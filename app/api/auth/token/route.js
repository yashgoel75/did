import { connectToDatabase } from "../../../../lib/mongodb";
import crypto from 'crypto';

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
    
    // Verify client credentials (in a production app, verify client_secret)
    const { db } = await connectToDatabase();
    const client = await db.collection("oauthClients").findOne({
      clientId: client_id,
      active: true
    });
    
    if (!client) {
      return new Response(
        JSON.stringify({ error: "Invalid client ID" }),
        { status: 401 }
      );
    }
    
    // In production, you would also verify client_secret here
    
    // Find and validate the authorization code
    const authCode = await db.collection("authCodes").findOne({ 
      code, 
      clientId: client_id,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!authCode) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired authorization code" }),
        { status: 400 }
      );
    }
    
    // Mark the code as used
    await db.collection("authCodes").updateOne(
      { _id: authCode._id },
      { $set: { used: true } }
    );
    
    // Generate access token
    const accessToken = generateToken();
    const expiresIn = 3600; // 1 hour
    
    // Store the token
    await db.collection("accessTokens").insertOne({
      token: accessToken,
      clientId: client_id,
      address: authCode.address,
      did: authCode.did,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expiresIn * 1000)
    });
    
    console.log("Token generated successfully for DID:", authCode.did);
    
    return new Response(
      JSON.stringify({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: expiresIn,
        did: authCode.did
      }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error in auth/token:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}