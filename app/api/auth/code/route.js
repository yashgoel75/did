import crypto from 'crypto';
import { storeAuthCode, getClient } from "../../../../lib/kv";
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { parseAbi } from 'viem';

// Function to generate a random code
function generateAuthCode() {
  return crypto.randomBytes(32).toString('hex');
}

// Contract configuration
const CONTRACT_ADDRESS = "0xaF52fF3fe18434226749f2CC8652900Cb7f23937";
const abi = parseAbi([
  "function profiles(address) public view returns (string did, string name, string email)",
]);

// Create a public client to interact with the blockchain
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/-DcT-NFdhaJSS6OR8zR_itZiCcnsJEMC")
});

export async function POST(req) {
  try {
    const { clientId, address, did } = await req.json();
    
    if (!clientId || !address || !did) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }), 
        { status: 400 }
      );
    }
    
    // Verify client exists
    const client = await getClient(clientId);
    if (!client || !client.active) {
      return new Response(
        JSON.stringify({ error: "Invalid client ID" }), 
        { status: 401 }
      );
    }
    
    // Verify the DID exists in the smart contract and belongs to this address
    try {
      const profileData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "profiles",
        args: [address]
      });
      
      // Verify that the DID in the contract matches the one being used for auth
      if (!profileData || !profileData.did || profileData.did !== did) {
        return new Response(
          JSON.stringify({ error: "Invalid DID or DID not registered to this address" }), 
          { status: 401 }
        );
      }
      
      console.log("Profile verified from blockchain:", profileData);
    } catch (contractError) {
      console.error("Error verifying profile from contract:", contractError);
      return new Response(
        JSON.stringify({ error: "Failed to verify DID from blockchain" }), 
        { status: 500 }
      );
    }
    
    // Generate a temporary authorization code
    const code = generateAuthCode();
    
    // Store the code with expiration (10 minutes) in KV storage
    await storeAuthCode(code, {
      code,
      clientId,
      address,
      did,
      createdAt: new Date().toISOString(),
      used: false
    });
    
    return new Response(
      JSON.stringify({ code }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error in auth/code:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}