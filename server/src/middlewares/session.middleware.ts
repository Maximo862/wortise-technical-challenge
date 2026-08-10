import type { MiddlewareHandler } from "hono";
import type { Auth, AuthSession } from "../auth/auth";

export type SessionVariables = {
  user: AuthSession["user"] | null;
  session: AuthSession["session"] | null;
};

export function sessionMiddleware(auth: Auth): MiddlewareHandler<{ Variables: SessionVariables }> {
  return async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    c.set("user", session?.user ?? null);
    c.set("session", session?.session ?? null);
    await next();
  };
}
