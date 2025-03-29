import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { parseAbi } from 'viem';

const CONTRACT_ADDRESS = '0xc84fE0C202E1f00698Fe577363609Df6adD127e3';
const abi = parseAbi([
  'function getDID(address user) public view returns (string)',
]);

export async function POST(req) {
  try {
    console.log("Received blockchain-based authentication request");
    const { address } = await req.json();
    
    if (!address) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Wallet address is required" 
      }), { status: 400 });
    }
    
    // Create public client for Sepolia testnet
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.ETHEREUM_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'),
    });
    
    try {
      // Read DID from smart contract
      const did = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getDID',
        args: [address],
      });
      
      if (did && did.length > 0) {
        return new Response(JSON.stringify({ 
          success: true,
          authenticated: true,
          did,
          // Note: name and email not available from blockchain
          fromBlockchain: true
        }), { status: 200 });
      } else {
        return new Response(JSON.stringify({ 
          success: true,
          authenticated: false,
          message: "No DID found on blockchain. Please register first."
        }), { status: 200 });
      }
    } catch (blockchainError) {
      console.error("Blockchain query error:", blockchainError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Blockchain query failed" 
      }), { status: 502 });
    }
  } catch (error) {
    console.error("Blockchain auth error:", error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
}