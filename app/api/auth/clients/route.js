import { connectToDatabase } from "../../../../lib/mongodb";
import crypto from 'crypto';

// Generate client credentials
function generateClientCredentials() {
  return {
    clientId: crypto.randomBytes(16).toString('hex'),
    clientSecret: crypto.randomBytes(32).toString('hex')
  };
}

// Register a new client
export async function POST(req) {
  try {
    const { name, redirectUris, description } = await req.json();
    
    if (!name || !redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request parameters" }),
        { status: 400 }
      );
    }
    
    const { clientId, clientSecret } = generateClientCredentials();
    
    const { db } = await connectToDatabase();
    const result = await db.collection("oauthClients").insertOne({
      name,
      clientId,
      clientSecret, // In production, hash this before storing
      redirectUris,
      description,
      createdAt: new Date(),
      active: true
    });
    
    return new Response(
      JSON.stringify({
        clientId,
        clientSecret,
        name,
        redirectUris,
        _id: result.insertedId
      }),
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Error registering client:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}

// Get all registered clients
export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const clients = await db.collection("oauthClients")
      .find({ active: true })
      .project({ clientSecret: 0 }) // Don't return secrets
      .toArray();
    
    return new Response(
      JSON.stringify(clients),
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error fetching clients:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}