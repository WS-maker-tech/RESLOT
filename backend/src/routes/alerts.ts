import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";

const alertsRouter = new Hono<{ Variables: { userPhone: string } }>();

// GET /api/alerts - Get user's activity alerts
alertsRouter.get("/", async (c) => {
  const phone = c.get("userPhone");

  const alerts = await db.activityAlert.findMany({
    where: { userPhone: phone },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: alerts });
});

// POST /api/alerts/read - Mark alerts as read
alertsRouter.post(
  "/read",
  zValidator(
    "json",
    z.object({
      alertIds: z.array(z.string()).optional(),
    })
  ),
  async (c) => {
    const phone = c.get("userPhone");
    const { alertIds } = c.req.valid("json");

    if (alertIds && alertIds.length > 0) {
      await db.activityAlert.updateMany({
        where: { id: { in: alertIds } },
        data: { read: true },
      });
    } else {
      await db.activityAlert.updateMany({
        where: { userPhone: phone },
        data: { read: true },
      });
    }

    return c.json({ data: { success: true } });
  }
);

// GET /api/alerts/restaurant-alerts - Get user's restaurant alerts with restaurant info
alertsRouter.get("/restaurant-alerts", async (c) => {
  const phone = c.get("userPhone");

  const alerts = await db.restaurantAlert.findMany({
    where: { userPhone: phone },
    include: { restaurant: true },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: alerts });
});

// POST /api/alerts/restaurant-alerts - Add restaurant alert
alertsRouter.post(
  "/restaurant-alerts",
  zValidator(
    "json",
    z.object({
      restaurantId: z.string(),
    })
  ),
  async (c) => {
    const userPhone = c.get("userPhone");
    const { restaurantId } = c.req.valid("json");

    // Check if alert already exists
    const existing = await db.restaurantAlert.findFirst({
      where: { userPhone, restaurantId },
    });

    if (existing) {
      // Re-enable if disabled
      const updated = await db.restaurantAlert.update({
        where: { id: existing.id },
        data: { enabled: true },
        include: { restaurant: true },
      });
      return c.json({ data: updated });
    }

    const alert = await db.restaurantAlert.create({
      data: {
        userPhone,
        restaurantId,
      },
      include: { restaurant: true },
    });

    return c.json({ data: alert }, 201);
  }
);

// DELETE /api/alerts/restaurant-alerts/:id - Remove restaurant alert
alertsRouter.delete("/restaurant-alerts/:id", async (c) => {
  const id = c.req.param("id");

  const alert = await db.restaurantAlert.findUnique({ where: { id } });
  if (!alert) {
    return c.json({ error: { message: "Alert not found", code: "NOT_FOUND" } }, 404);
  }

  await db.restaurantAlert.delete({ where: { id } });

  return c.json({ data: { success: true } });
});

export { alertsRouter };
