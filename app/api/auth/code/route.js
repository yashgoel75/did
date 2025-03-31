import { getClient } from "../../../../config/clients";
import { generateAuthCode, storeAuthCode, logStoreState } from "../../../../lib/firestore";
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { parseAbi } from 'viem';
import { addCorsHeaders } from "../../../../utils/cors";
import { getAdminDb } from "../../../../lib/firebase-admin";

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

// Handle CORS preflight
export async function OPTIONS(req) {
  const origin = req.headers.get('origin') || '';
  
  return new Response(null, {
    status: 204,
    headers: addCorsHeaders({
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }, origin)
  });
}

export async function POST(req) {
  try {
    const origin = req.headers.get('origin') || '';
    console.log("Request origin:", origin);
    
    // Check Firebase connection first
    const db = getAdminDb();
    if (!db) {
      console.error("Firebase Admin not initialized");
      return new Response(
        JSON.stringify({ error: "Database connection error. Please try again later." }),
        { status: 500, headers: addCorsHeaders({}, origin) }
      );
    }
    
    const { clientId, address, did } = await req.json();
    
    console.log("Code request received:", { clientId, address, did });
    await logStoreState(); // Need await for async function
    
    if (!clientId || !address || !did) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }), 
        { status: 400, headers: addCorsHeaders({}, origin) }
      );
    }
    
    // Verify client exists from hardcoded list
    const client = getClient(clientId);
    if (!client || !client.active) {
      console.log("Invalid client ID:", clientId);
      return new Response(
        JSON.stringify({ error: "Invalid client ID" }), 
        { status: 401, headers: addCorsHeaders({}, origin) }
      );
    }
    
    // Verify the DID exists in the smart contract and belongs to this address
    try {
      console.log("Reading profile from contract for address:", address);
      
      const rawProfileData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "profiles",
        args: [address]
      });
      
      console.log("Raw profile data from contract:", rawProfileData);
      
      // Parse the profile data
      const profileData = parseProfileData(rawProfileData);
      console.log("Parsed profile data:", profileData);
      
      if (!profileData || !profileData.did) {
        console.log("No DID found for address:", address);
        return new Response(
          JSON.stringify({ error: "DID not registered for this address" }), 
          { status: 401, headers: addCorsHeaders({}, origin) }
        );
      }
      
      if (profileData.did !== did) {
        console.log("DID mismatch:", { providedDid: did, contractDid: profileData.did });
        return new Response(
          JSON.stringify({ error: "Provided DID does not match the one registered to this address" }), 
          { status: 401, headers: addCorsHeaders({}, origin) }
        );
      }
      
      console.log("Profile verified from blockchain:", profileData);
    } catch (contractError) {
      console.error("Error verifying profile from contract:", contractError);
      return new Response(
        JSON.stringify({ error: "Failed to verify DID from blockchain: " + contractError.message }), 
        { status: 500, headers: addCorsHeaders({}, origin) }
      );
    }
    
    // Generate a temporary authorization code
    const code = generateAuthCode();
    
    // Store the code with expiration
    const codeData = {
      code,
      clientId,  // IMPORTANT: Ensure this matches exactly what we check in the token endpoint
      address,
      did,
      createdAt: new Date().toISOString(),
      used: false
    };
    
    // Log the operation details
    console.log("Attempting to store auth code in Firestore:", {
      code: code.substring(0, 8) + '...',
      clientId,
      did
    });
    
    try {
      // MUST USE AWAIT
      const success = await storeAuthCode(codeData);
      
      if (!success) {
        console.error("Failed to store authorization code - no error thrown but operation failed");
        return new Response(
          JSON.stringify({ error: "Failed to store authorization code" }), 
          { status: 500, headers: addCorsHeaders({}, origin) }
        );
      }
      
      console.log("Auth code generated successfully:", { code: code.substring(0, 8) + '...', clientId });
      await logStoreState(); // Log the state after adding the code
      
      return new Response(
        JSON.stringify({ code }),
        { status: 200, headers: addCorsHeaders({}, origin) }
      );
    } catch (dbError) {
      console.error("Database error storing auth code:", dbError);
      return new Response(
        JSON.stringify({ 
          error: "Database error storing authorization code", 
          details: dbError.message 
        }), 
        { status: 500, headers: addCorsHeaders({}, origin) }
      );
    }
    
  } catch (error) {
    console.error("Error in auth/code:", error.message, error.stack);
    const origin = req.headers.get('origin') || '';
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { status: 500, headers: addCorsHeaders({}, origin) }
    );
  }
}