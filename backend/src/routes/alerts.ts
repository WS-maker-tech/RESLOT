import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";

const alertsRouter = new Hono();

// GET /api/alerts - Get user's activity alerts
alertsRouter.get(
  "/",
  zValidator(
    "query",
    z.object({
      phone: z.string(),
    })
  ),
  async (c) => {
    const { phone } = c.req.valid("query");

    const alerts = await db.activityAlert.findMany({
      where: { userPhone: phone },
      orderBy: { createdAt: "desc" },
    });

    // If no real alerts, return sample test data
    if (alerts.length === 0) {
      const now = new Date();
      const sampleAlerts = [
        {
          id: "sample-1",
          userPhone: phone,
          type: "drop",
          title: "Bord frigörs!",
          message: "Ett bord på Frantzén blev precis ledigt för 2 personer",
          read: false,
          restaurantId: null,
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
          id: "sample-2",
          userPhone: phone,
          type: "claim",
          title: "Din reservation är reserverad",
          message: "Du har reserverat bordet på Noma för i morgon",
          read: false,
          restaurantId: null,
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          id: "sample-3",
          userPhone: phone,
          type: "token",
          title: "+50 poäng!",
          message: "Du tjänade 50 poäng på din senaste bokning",
          read: false,
          restaurantId: null,
          createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
        },
      ];
      return c.json({ data: sampleAlerts });
    }

    return c.json({ data: alerts });
  }
);

// POST /api/alerts/read - Mark alerts as read
alertsRouter.post(
  "/read",
  zValidator(
    "json",
    z.object({
      phone: z.string().optional(),
      alertIds: z.array(z.string()).optional(),
    })
  ),
  async (c) => {
    const { phone, alertIds } = c.req.valid("json");

    if (alertIds && alertIds.length > 0) {
      await db.activityAlert.updateMany({
        where: { id: { in: alertIds } },
        data: { read: true },
      });
    } else if (phone) {
      await db.activityAlert.updateMany({
        where: { userPhone: phone },
        data: { read: true },
      });
    }

    return c.json({ data: { success: true } });
  }
);

// GET /api/restaurant-alerts - Get user's restaurant alerts with restaurant info
alertsRouter.get(
  "/restaurant-alerts",
  zValidator(
    "query",
    z.object({
      phone: z.string(),
    })
  ),
  async (c) => {
    const { phone } = c.req.valid("query");

    const alerts = await db.restaurantAlert.findMany({
      where: { userPhone: phone },
      include: { restaurant: true },
      orderBy: { createdAt: "desc" },
    });

    // If no real alerts, return sample test data with random restaurants
    if (alerts.length === 0) {
      const restaurantCount = await db.restaurant.count();

      if (restaurantCount === 0) {
        return c.json({ data: [] });
      }

      // Fetch random restaurants (up to 2)
      const restaurants = await db.restaurant.findMany({
        take: Math.min(2, restaurantCount),
        orderBy: { createdAt: "desc" },
      });

      const now = new Date();
      const sampleAlerts = restaurants.map((restaurant, index) => ({
        id: `sample-restaurant-${index + 1}`,
        userPhone: phone,
        restaurantId: restaurant.id,
        enabled: true,
        createdAt: new Date(now.getTime() - (index + 1) * 12 * 60 * 60 * 1000), // Stagger by 12 hours
        restaurant,
      }));

      return c.json({ data: sampleAlerts });
    }

    return c.json({ data: alerts });
  }
);

// POST /api/restaurant-alerts - Add restaurant alert
alertsRouter.post(
  "/restaurant-alerts",
  zValidator(
    "json",
    z.object({
      userPhone: z.string(),
      restaurantId: z.string(),
    })
  ),
  async (c) => {
    const { userPhone, restaurantId } = c.req.valid("json");

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

// DELETE /api/restaurant-alerts/:id - Remove restaurant alert
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
