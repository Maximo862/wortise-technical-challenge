import { cors } from "hono/cors";
import { Hono } from "hono";
import type { Auth } from "./auth/auth";
import {
  sessionMiddleware,
  type SessionVariables,
} from "./middlewares/session.middleware";
import { articlesRoute } from "./routes/articles.route";
import { healthRoute } from "./routes/health.route";
import { publicRoute } from "./routes/public.route";

export function createApp(auth: Auth, clientOrigin: string) {
  const app = new Hono<{ Variables: SessionVariables }>();

  app.use("*", cors({ origin: clientOrigin, credentials: true }));
  app.use("*", sessionMiddleware(auth));

  app.on(["POST", "GET"], "/api/auth/*", (c) =>
    auth.handler(c.req.raw),
  );

  app.route("/health", healthRoute);
  app.route("/api/articles", articlesRoute);
  app.route("/api/public", publicRoute);

  return app;
}

export type App = ReturnType<typeof createApp>;
