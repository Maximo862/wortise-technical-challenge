import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { Hono } from "hono";
import { healthRoute } from "./routes/health.route";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

const PORT = Number(process.env.PORT) || 3000;

const app = new Hono();

app.route("/health", healthRoute);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});
