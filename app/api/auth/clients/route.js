import crypto from 'crypto';
import { storeClient, getAllClients } from "../../../../lib/kv";

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
    
    const clientData = {
      clientId,
      clientSecret,
      name,
      redirectUris,
      description,
      createdAt: new Date().toISOString(),
      active: true
    };
    
    // Store in Vercel KV
    await storeClient(clientId, clientData);
    
    // Don't return the secret in the response
    const { clientSecret: _, ...clientResponse } = clientData;
    
    return new Response(
      JSON.stringify({
        ...clientResponse,
        clientSecret
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
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
    const clients = await getAllClients();
    
    // Remove secrets before returning
    const safeClients = clients.map(({ clientSecret, ...client }) => client);
    
    return new Response(
      JSON.stringify(safeClients),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error fetching clients:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}