import { getActiveClients } from "../../../../config/clients";

// Get all registered clients
export async function GET(req) {
  try {
    const clients = getActiveClients();
    
    return new Response(
      JSON.stringify(clients),
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

// POST endpoint is disabled since we're using hardcoded clients
export async function POST(req) {
  return new Response(
    JSON.stringify({ 
      error: "Client registration is disabled. Using pre-configured clients only." 
    }),
    { status: 403 }
  );
}