import { createMiddleware } from "hono/factory";
import type { SessionVariables } from "./session.middleware";

type AuthenticatedUser = NonNullable<SessionVariables["user"]>;

export type AuthenticatedVariables = SessionVariables & {
  authenticatedUser: AuthenticatedUser;
};

export const requireAuthentication = createMiddleware<{
  Variables: AuthenticatedVariables;
}>(async (c, next) => {
  const user = c.get("user");

  if (!user) {
    return c.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required",
        },
      },
      401,
    );
  }

  c.set("authenticatedUser", user);
  await next();
});
