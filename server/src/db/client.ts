import { MongoClient, type Db } from "mongodb";
import { env } from "../config/env";

const client = new MongoClient(env.MONGODB_URI);

let db: Db | undefined;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  await client.connect();

  db = client.db(env.MONGODB_DB_NAME);

  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("Database not connected");
  }

  return db;
}

export function getMongoClient(): MongoClient {
  return client;
}