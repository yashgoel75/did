import { connectToDatabase } from "../../../../lib/mongodb";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");
    
    if (!address) {
      return new Response(
        JSON.stringify({ error: "Address parameter is required" }),
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const profile = await db.collection("profiles").findOne({ address });
    
    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404 }
      );
    }
    
    // Remove sensitive data if needed
    delete profile._id;
    
    return new Response(
      JSON.stringify(profile),
      { status: 200}
    );
    
  } catch (error) {
    console.error("Error in auth/profile:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}