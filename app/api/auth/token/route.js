import { getClient } from "../../../../config/clients";
import { getAuthCode, markAuthCodeAsUsed, generateToken, storeAccessToken, logStoreState } from "../../../../lib/firestore";
import { addCorsHeaders } from "../../../../utils/cors";

// Handle CORS preflight requests
export async function OPTIONS(req) {
  // Get origin for CORS
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
    // Get origin for CORS
    const origin = req.headers.get('origin') || '';
    console.log("Request origin:", origin);
    
    const data = await req.json();
    const { code, client_id, client_secret } = data;
    
    console.log("Token request received:", { code, client_id });
    await logStoreState(); // Need await for async function
    
    if (!code || !client_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: addCorsHeaders({}, origin) }
      );
    }
    
    // Verify client credentials from hardcoded list
    const client = getClient(client_id);
    if (!client || !client.active) {
      console.log("Invalid client ID:", client_id);
      return new Response(
        JSON.stringify({ error: "Invalid client ID" }),
        { status: 401, headers: addCorsHeaders({}, origin) }
      );
    }
    
    // If client_secret is provided, verify it
    if (client_secret && client.clientSecret !== client_secret) {
      console.log("Invalid client secret");
      return new Response(
        JSON.stringify({ error: "Invalid client credentials" }),
        { status: 401, headers: addCorsHeaders({}, origin) }
      );
    }
    
    // Find and validate the authorization code - MUST USE AWAIT
    const authCode = await getAuthCode(code);
    console.log("Auth code lookup result:", authCode ? "Found" : "Not found");
    
    if (!authCode) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired authorization code" }),
        { status: 400, headers: addCorsHeaders({}, origin) }
      );
    }
    
    console.log("Auth code details:", { 
      codeClientId: authCode.clientId, 
      requestClientId: client_id,
      did: authCode.did,
      used: authCode.used 
    });
    
    if (authCode.clientId !== client_id) {
      console.log("Client ID mismatch:", { codeClientId: authCode.clientId, requestClientId: client_id });
      return new Response(
        JSON.stringify({ error: "Authorization code was not issued for this client" }),
        { status: 400, headers: addCorsHeaders({}, origin) }
      );
    }
    
    // Mark the code as used - MUST USE AWAIT
    const marked = await markAuthCodeAsUsed(code);
    if (!marked) {
      return new Response(
        JSON.stringify({ error: "Failed to process authorization code" }),
        { status: 500, headers: addCorsHeaders({}, origin) }
      );
    }
    
    // Generate access token
    const accessToken = generateToken();
    const expiresIn = 604800; // 7 days (in seconds)
    
    // Store the token with expiration
    const tokenData = {
      token: accessToken,
      clientId: client_id,
      address: authCode.address,
      did: authCode.did,
      createdAt: new Date().toISOString()
    };
    
    // MUST USE AWAIT
    const stored = await storeAccessToken(tokenData);
    if (!stored) {
      return new Response(
        JSON.stringify({ error: "Failed to store access token" }),
        { status: 500, headers: addCorsHeaders({}, origin) }
      );
    }
    
    console.log("Token generated successfully for DID:", authCode.did);
    
    return new Response(
      JSON.stringify({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: expiresIn,
        did: authCode.did
      }),
      { status: 200, headers: addCorsHeaders({}, origin) }
    );
    
  } catch (error) {
    console.error("Error in auth/token:", error.message, error.stack);
    const origin = req.headers.get('origin') || '';
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: addCorsHeaders({}, origin) }
    );
  }
}