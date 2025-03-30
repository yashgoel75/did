import { getClient } from "../../../../lib/kv";

export async function GET(req) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const clientId = url.searchParams.get("client_id");
    const redirectUri = url.searchParams.get("redirect_uri");
    const state = url.searchParams.get("state");
    
    console.log("Authorize request received:", { clientId, redirectUri, state });
    
    if (!clientId || !redirectUri) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400 }
      );
    }
    
    // Validate clientId exists and redirectUri is authorized
    const client = await getClient(clientId);
    if (!client || !client.active) {
      return new Response(
        JSON.stringify({ error: "Invalid client ID" }),
        { status: 401 }
      );
    }
    
    if (!client.redirectUris.includes(redirectUri)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized redirect URI" }),
        { status: 401 }
      );
    }
    
    // Construct the absolute URL for the login page
    const origin = url.origin;
    const loginUrl = new URL("/auth/login", origin);
    
    // Add query parameters
    loginUrl.searchParams.append("client_id", clientId);
    loginUrl.searchParams.append("redirect_uri", redirectUri);
    if (state) loginUrl.searchParams.append("state", state);
    
    console.log("Redirecting to:", loginUrl.toString());
    
    // Redirect to the login page
    return Response.redirect(loginUrl.toString(), 302);
    
  } catch (error) {
    console.error("Error in auth/authorize:", error.message);
    return new Response(
      JSON.stringify({ error: "Server error: " + error.message }),
      { status: 500 }
    );
  }
}