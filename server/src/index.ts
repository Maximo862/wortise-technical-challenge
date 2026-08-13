import { serve } from "@hono/node-server";
import { env } from "./config/env";
import { createAuth } from "./auth/auth";
import { connectToDatabase, getMongoClient } from "./db/client";
import { createApp } from "./app";

let db;

try {
  db = await connectToDatabase();
  console.log("Connected to MongoDB");
} catch (error) {
  console.error("Failed to connect to MongoDB:", error);
  process.exit(1);
}

const auth = createAuth(db, getMongoClient());
const app = createApp(auth, env.CLIENT_ORIGIN);

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
    hostname: "0.0.0.0",
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  },
);
