import { connectToDatabase } from "../../../../lib/mongodb";
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { parseAbi } from 'viem';

const CONTRACT_ADDRESS = '0xc84fE0C202E1f00698Fe577363609Df6adD127e3';
const abi = parseAbi([
  'function getDID(address user) public view returns (string)',
]);

export async function POST(req) {
  try {
    console.log("Received DID verification request");
    const { address } = await req.json();
    console.log("Verifying DID for address:", address);

    if (!address) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Wallet address is required" 
      }), { status: 400 });
    }

    try {
      // 1. Get user from MongoDB
      const { db } = await connectToDatabase();
      console.log("Connected to MongoDB for DID verification");
      
      const profile = await db.collection("profiles").findOne({ address });
      
      if (!profile || !profile.did) {
        console.log("No DID found in database for address:", address);
        return new Response(JSON.stringify({ 
          success: true,
          authenticated: false,
          message: "No DID found. Please register first."
        }), { status: 200 });
      }

      // 2. Verify against blockchain
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(process.env.ETHEREUM_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'),
      });
      
      try {
        // Read DID from smart contract
        const blockchainDid = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'getDID',
          args: [address],
        });

        // 3. Compare DIDs from MongoDB and blockchain
        if (blockchainDid && blockchainDid.length > 0) {
          if (profile.did === blockchainDid) {
            // DIDs match - fully verified
            console.log("DID verified successfully:", profile.did);
            return new Response(JSON.stringify({ 
              success: true,
              authenticated: true,
              did: profile.did,
              name: profile.name,
              didVerified: true,
              message: "DID successfully verified on both database and blockchain."
            }), { status: 200 });
          } else {
            // DIDs don't match - potential security issue
            console.log("DID mismatch: Database:", profile.did, "Blockchain:", blockchainDid);
            return new Response(JSON.stringify({ 
              success: false,
              authenticated: false,
              message: "DID verification failed - mismatch between registered DIDs."
            }), { status: 401 });
          }
        } else {
          // No blockchain DID found, but MongoDB has a record
          console.log("No blockchain DID found, using MongoDB record only");
          return new Response(JSON.stringify({ 
            success: true,
            authenticated: true,
            did: profile.did,
            name: profile.name,
            didVerified: false,
            message: "Authenticated with database only."
          }), { status: 200 });
        }
      } catch (blockchainError) {
        // Blockchain verification failed - fall back to database only
        console.error("Blockchain verification error:", blockchainError);
        return new Response(JSON.stringify({ 
          success: true,
          authenticated: true,
          did: profile.did,
          name: profile.name,
          didVerified: false,
          message: "Authenticated with database only."
        }), { status: 200 });
      }
    } catch (dbError) {
      console.error("Database error during DID verification:", dbError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Database connection failed. Please try again later." 
      }), { status: 503 });
    }
  } catch (error) {
    console.error("Error in DID verification:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
}