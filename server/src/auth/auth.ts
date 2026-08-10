import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import type { Db, MongoClient } from "mongodb";

// built after the MongoDB connection is confirmed 
export function createAuth(db: Db, client: MongoClient) {
  return betterAuth({
    database: mongodbAdapter(db, { client }),
    emailAndPassword: {
      enabled: true,
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [process.env.CLIENT_ORIGIN ?? "http://localhost:5173"],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>;
