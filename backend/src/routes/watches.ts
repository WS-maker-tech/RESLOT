import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { db } from "../db";

const watchesRouter = new Hono<{ Variables: { userPhone: string } }>();

watchesRouter.get("/", async (c) => {
  const phone = c.get("userPhone");

  const watches = await db.watch.findMany({
    where: { userPhone: phone },
    include: { restaurant: true },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: watches });
});

watchesRouter.post(
  "/",
  zValidator("json", z.object({
    restaurantId: z.string().optional(),
    date: z.string().optional(),
    partySize: z.number().optional(),
    notes: z.string().optional(),
  })),
  async (c) => {
    const userPhone = c.get("userPhone");
    const body = c.req.valid("json");
    const watch = await db.watch.create({ data: { ...body, userPhone } });
    return c.json({ data: watch }, 201);
  }
);

watchesRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const userPhone = c.get("userPhone");

  // Only delete if the watch belongs to the authenticated user
  const watch = await db.watch.findUnique({ where: { id } });
  if (!watch) {
    return c.json({ error: { message: "Watch not found", code: "NOT_FOUND" } }, 404);
  }
  if (watch.userPhone !== userPhone) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  await db.watch.delete({ where: { id } });
  return c.json({ data: { success: true } });
});

export { watchesRouter };
