import { getAccessToken } from "../../../../lib/fileStore";
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { parseAbi } from 'viem';
import { addCorsHeaders } from "../../../../utils/cors";

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

// Helper function to parse profile data
function parseProfileData(rawData) {
  if (Array.isArray(rawData)) {
    return {
      did: rawData[0],
      name: rawData[1],
      email: rawData[2]
    };
  }
  return rawData;
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: addCorsHeaders()
  });
}

export async function GET(req) {
  try {
    // Log the incoming request headers for debugging
    console.log("Userinfo request headers:", Object.fromEntries(req.headers.entries()));
    
    // Extract the Bearer token from Authorization header
    const authHeader = req.headers.get("authorization");
    console.log("Auth header:", authHeader);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: addCorsHeaders() }
      );
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    console.log("Token:", token.substring(0, 10) + "...");
    
    // Verify the token exists in our store
    const tokenData = getAccessToken(token);
    console.log("Token data found:", tokenData ? "Yes" : "No");
    
    if (!tokenData) {
      console.log("Invalid or expired token");
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: addCorsHeaders() }
      );
    }
    
    // Get user profile from blockchain
    try {
      console.log("Fetching profile for address:", tokenData.address);
      
      const rawProfileData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "profiles",
        args: [tokenData.address]
      });
      
      console.log("Raw profile data from contract:", rawProfileData);
      
      // Parse profile data
      const profileData = parseProfileData(rawProfileData);
      console.log("Parsed profile data:", profileData);
      
      if (!profileData || !profileData.did) {
        console.log("No DID found for this address");
        return new Response(
          JSON.stringify({ error: "User profile not found" }),
          { status: 404, headers: addCorsHeaders() }
        );
      }
      
      // Return user information
      return new Response(
        JSON.stringify({
          did: tokenData.did,
          name: profileData.name || null,
          email: profileData.email || null,
          address: tokenData.address
        }),
        { status: 200, headers: addCorsHeaders() }
      );
    } catch (contractError) {
      console.error("Error fetching user profile from contract:", contractError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user profile: " + contractError.message }),
        { status: 500, headers: addCorsHeaders() }
      );
    }
  } catch (error) {
    console.error("Error in userinfo:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: addCorsHeaders() }
    );
  }
}