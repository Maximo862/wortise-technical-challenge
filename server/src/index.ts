import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./config/env";
import { connectToDatabase } from "./db/client";
import { healthRoute } from "./routes/health.route";

try {
  await connectToDatabase();
  console.log("Connected to MongoDB");
} catch (error) {
  console.error("Failed to connect to MongoDB:", error);
  process.exit(1);
}

const app = new Hono();

app.route("/health", healthRoute);

serve({
  fetch: app.fetch,
  port: env.PORT,
});