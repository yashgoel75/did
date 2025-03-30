import { getAccessToken } from "../../../../lib/kv";
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { parseAbi } from 'viem';

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

export async function GET(req) {
  try {
    // Extract the Bearer token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401 }
      );
    }
    
    const token = authHeader.split(" ")[1];
    
    // Validate the token
    const tokenData = await getAccessToken(token);
    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401 }
      );
    }
    
    // Get user data from blockchain
    try {
      const profileData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "profiles",
        args: [tokenData.address]
      });
      
      if (!profileData || !profileData.did) {
        return new Response(
          JSON.stringify({ error: "User profile not found" }),
          { status: 404 }
        );
      }
      
      // Return user information
      return new Response(
        JSON.stringify({
          did: tokenData.did,
          name: profileData.name,
          email: profileData.email,
          address: tokenData.address
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (contractError) {
      console.error("Error fetching profile from contract:", contractError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profile from blockchain" }),
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error in userinfo:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}