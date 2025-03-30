import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

let client;
let clientPromise;

if (process.env.NODE_ENV === "production") {
  client = new MongoClient(uri);
  clientPromise = client.connect();
} else {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
}

export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "did_authenticator"); // Set correct DB name
  return { db, client };
}
