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
    const url = new URL(req.url);
    const address = url.searchParams.get("address");
    
    if (!address) {
      return new Response(
        JSON.stringify({ error: "Address parameter is required" }),
        { status: 400 }
      );
    }
    
    // Fetch profile from the blockchain instead of MongoDB
    try {
      const profileData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "profiles",
        args: [address]
      });
      
      if (!profileData || !profileData.did) {
        return new Response(
          JSON.stringify({ error: "Profile not found" }),
          { status: 404 }
        );
      }
      
      // Return the profile data
      return new Response(
        JSON.stringify({
          address,
          did: profileData.did,
          name: profileData.name,
          email: profileData.email
        }),
        { status: 200 }
      );
    } catch (contractError) {
      console.error("Error fetching profile from contract:", contractError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profile from blockchain" }),
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error in auth/profile:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}