import nextEnv from "@next/env";
import { MongoClient } from "mongodb";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const uri = process.env.MONGODB_URI?.trim();
const databaseName = process.env.MONGODB_DB || "nextstep";
const collectionName = process.env.MONGODB_COLLECTION || "app_store";

if (!uri) {
  console.error("MONGODB_URI is not set. Add it to .env.local or your deployment environment.");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  await client.db(databaseName).command({ ping: 1 });
  const count = await client.db(databaseName).collection(collectionName).countDocuments();
  console.log(`MongoDB connected: ${databaseName}.${collectionName} (${count} document${count === 1 ? "" : "s"})`);
} finally {
  await client.close();
}
