import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";

const savedRestaurantsRouter = new Hono<{ Variables: { userPhone: string } }>();

// GET /api/saved-restaurants - List user's saved restaurants
savedRestaurantsRouter.get("/", async (c) => {
  const userPhone = c.get("userPhone");

  const saved = await db.savedRestaurant.findMany({
    where: { userPhone },
    include: { restaurant: true },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: saved });
});

// POST /api/saved-restaurants - Save a restaurant
savedRestaurantsRouter.post(
  "/",
  zValidator("json", z.object({ restaurantId: z.string() })),
  async (c) => {
    const userPhone = c.get("userPhone");
    const { restaurantId } = c.req.valid("json");

    // Verify restaurant exists
    const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      return c.json({ error: { message: "Restaurant not found", code: "NOT_FOUND" } }, 404);
    }

    // Upsert to handle duplicates gracefully
    const saved = await db.savedRestaurant.upsert({
      where: {
        userPhone_restaurantId: { userPhone, restaurantId },
      },
      update: {}, // Already saved, no-op
      create: { userPhone, restaurantId },
      include: { restaurant: true },
    });

    return c.json({ data: saved }, 201);
  }
);

// DELETE /api/saved-restaurants/:restaurantId - Remove a saved restaurant
savedRestaurantsRouter.delete("/:restaurantId", async (c) => {
  const userPhone = c.get("userPhone");
  const restaurantId = c.req.param("restaurantId");

  try {
    await db.savedRestaurant.delete({
      where: {
        userPhone_restaurantId: { userPhone, restaurantId },
      },
    });
  } catch {
    return c.json({ error: { message: "Saved restaurant not found", code: "NOT_FOUND" } }, 404);
  }

  return c.json({ data: { success: true } });
});

export { savedRestaurantsRouter };
