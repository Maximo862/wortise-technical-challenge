import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { env } from "./config/env";
import { createAuth } from "./auth/auth";
import { connectToDatabase, getMongoClient } from "./db/client";
import { sessionMiddleware, type SessionVariables } from "./middlewares/session.middleware";
import { healthRoute } from "./routes/health.route";

let db;

try {
  db = await connectToDatabase();
  console.log("Connected to MongoDB");
} catch (error) {
  console.error("Failed to connect to MongoDB:", error);
  process.exit(1);
}

const auth = createAuth(db, getMongoClient());

const app = new Hono<{ Variables: SessionVariables }>();

app.use("*", cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use("*", sessionMiddleware(auth));

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/health", healthRoute);

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});