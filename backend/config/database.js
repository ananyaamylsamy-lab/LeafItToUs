import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let db = null;
let client = null;

// Establish MongoDB connection
export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("leafittous");
    console.log("Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

export const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
};

export const getCollection = (collectionName) => {
  const database = getDB();
  return database.collection(collectionName);
};

process.on("SIGINT", async () => {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
  }
  process.exit(0);
});