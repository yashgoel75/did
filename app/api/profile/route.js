import { connectToDatabase } from "../../../lib/mongodb";

export async function POST(req) {
  try {
    const { address, did, name, email } = await req.json();
    const { db } = await connectToDatabase();

    const result = await db.collection("profiles").updateOne(
      { address },
      { $set: { did, name, email, updatedAt: new Date() } },
      { upsert: true }
    );

    return new Response(JSON.stringify({ success: true, result }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}