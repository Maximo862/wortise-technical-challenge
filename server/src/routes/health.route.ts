import { Hono } from "hono";
import { HEALTH_STATUS_OK } from "shared";

export const healthRoute = new Hono().get("/", (c) => {
  return c.json({ status: HEALTH_STATUS_OK });
});
