import { Hono } from "hono";

export const supportRouter = new Hono();

supportRouter.post("/", async (c) => {
  return c.json({ success: true });
});
