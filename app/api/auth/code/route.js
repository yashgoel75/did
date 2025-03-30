import { connectToDatabase } from "../../../../lib/mongodb";
import crypto from 'crypto';

// Function to generate a random code
function generateAuthCode() {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(req) {
  try {
    const { clientId, address, did } = await req.json();
    
    if (!clientId || !address || !did) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }), 
        { status: 400 }
      );
    }
    
    // Generate a temporary authorization code
    const code = generateAuthCode();
    
    // Store the code in the database with an expiration time
    const { db } = await connectToDatabase();
    await db.collection("authCodes").insertOne({
      code,
      clientId,
      address,
      did,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
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