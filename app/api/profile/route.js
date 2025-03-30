import { connectToDatabase } from "../../../lib/mongodb";

export async function POST(req) {
  try {
    console.log("Received POST request to /api/profile");
    const { address, did, name, email } = await req.json();
    console.log("Data received:", { address, did, name, email });

    const { db } = await connectToDatabase();
    console.log("Connected to MongoDB");

    const result = await db.collection("profiles").updateOne(
      { address },
      { $set: { did, name, email, updatedAt: new Date() } },
      { upsert: true }
    );
    console.log("MongoDB update result:", result);

    return new Response(JSON.stringify({ ok: true, success: true, result }), { status: 200 });
  } catch (error) {
    console.error("Error in /api/profile:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}