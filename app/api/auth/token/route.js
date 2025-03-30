import crypto from 'crypto';
import { getAuthCode, markAuthCodeAsUsed, storeAccessToken, getClient } from "../../../../lib/kv";

// Function to generate a token
function generateToken() {
  return crypto.randomBytes(64).toString('hex');
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { code, client_id, client_secret } = data;
    
    console.log("Token request:", { code, client_id });
    
    if (!code || !client_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400 }
      );
    }
    
    // Verify client credentials
    const client = await getClient(client_id);
    if (!client || !client.active) {
      return new Response(
        JSON.stringify({ error: "Invalid client ID" }),
        { status: 401 }
      );
    }
    
    // In production, verify client_secret
    if (client_secret && client.clientSecret !== client_secret) {
      return new Response(
        JSON.stringify({ error: "Invalid client credentials" }),
        { status: 401 }
      );
    }
    
    // Find and validate the authorization code
    const authCode = await getAuthCode(code);
    if (!authCode || authCode.used || authCode.clientId !== client_id) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired authorization code" }),
        { status: 400 }
      );
    }
    
    // Mark the code as used
    await markAuthCodeAsUsed(code);
    
    // Generate access token
    const accessToken = generateToken();
    const expiresIn = 604800; // 7 days (in seconds)
    
    // Store the token with expiration
    await storeAccessToken(accessToken, {
      token: accessToken,
      clientId: client_id,
      address: authCode.address,
      did: authCode.did,
      createdAt: new Date().toISOString(),
    });
    
    console.log("Token generated successfully for DID:", authCode.did);
    
    return new Response(
      JSON.stringify({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: expiresIn,
        did: authCode.did
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in auth/token:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}