import { connectToDatabase } from "../../../../lib/mongodb";

export async function GET(req) {
  try {
    // Extract the Bearer token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401 }
      );
    }
    
    const token = authHeader.split(" ")[1];
    
    // Validate the token
    const { db } = await connectToDatabase();
    const tokenDoc = await db.collection("accessTokens").findOne({
      token,
      expiresAt: { $gt: new Date() }
    });
    
    if (!tokenDoc) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401 }
      );
    }
    
    // Get user data
    const profile = await db.collection("profiles").findOne({ address: tokenDoc.address });
    
    if (!profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404 }
      );
    }
    
    // Return user information
    return new Response(
      JSON.stringify({
        did: tokenDoc.did,
        name: profile.name,
        email: profile.email,
        address: tokenDoc.address
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in userinfo:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}