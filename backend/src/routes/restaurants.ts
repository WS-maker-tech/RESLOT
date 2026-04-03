import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";

const restaurantsRouter = new Hono();

// GET /api/restaurants - List restaurants
restaurantsRouter.get(
  "/",
  zValidator(
    "query",
    z.object({
      city: z.string().optional(),
      neighborhood: z.string().optional(),
      date: z.string().optional(),
      search: z.string().optional(),
    })
  ),
  async (c) => {
    const { city, neighborhood, search } = c.req.valid("query");

    const where: Record<string, unknown> = {};

    if (city) {
      where.city = city;
    }
    if (neighborhood) {
      where.neighborhood = neighborhood;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { cuisine: { contains: search } },
        { neighborhood: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const restaurants = await db.restaurant.findMany({
      where,
      orderBy: { rating: "desc" },
    });

    return c.json({ data: restaurants });
  }
);

// GET /api/restaurants/new-on-reslot - Restaurants that recently got their first booking
restaurantsRouter.get("/new-on-reslot", async (c) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find restaurants where timesBookedOnReslot is exactly 1 (first booking ever)
  // OR recently had their first reservation created
  const restaurants = await db.restaurant.findMany({
    where: {
      timesBookedOnReslot: { gte: 1, lte: 3 },
      reservations: {
        some: {
          createdAt: { gte: sevenDaysAgo },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  return c.json({ data: restaurants });
});

// GET /api/restaurants/:id - Get single restaurant
restaurantsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const restaurant = await db.restaurant.findUnique({
    where: { id },
    include: {
      reservations: {
        where: { status: "active" },
        orderBy: { reservationDate: "asc" },
      },
    },
  });

  if (!restaurant) {
    return c.json({ error: { message: "Restaurant not found", code: "NOT_FOUND" } }, 404);
  }

  return c.json({ data: restaurant });
});

export { restaurantsRouter };
