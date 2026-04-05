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
    filterOptions: z.object({
      timeRange: z.tuple([z.string(), z.string()]).optional(),
      weekdays: z.array(z.number().min(0).max(6)).optional(),
      partySize: z.number().min(1).optional(),
    }).optional(),
  })),
  async (c) => {
    const userPhone = c.get("userPhone");
    const body = c.req.valid("json");
    const watch = await db.watch.create({
      data: {
        userPhone,
        restaurantId: body.restaurantId,
        date: body.date,
        partySize: body.partySize,
        notes: body.notes,
        filterOptions: body.filterOptions ?? undefined,
      },
    });
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

/**
 * Check if a reservation matches a watch's filter options.
 * Used by the notification system to only send relevant alerts.
 */
export function matchesWatchFilters(
  watch: { filterOptions: unknown; partySize: number | null },
  reservation: { reservationTime: string; reservationDate: Date; partySize: number }
): boolean {
  if (!watch.filterOptions) return true;

  const filters = watch.filterOptions as {
    timeRange?: [string, string];
    weekdays?: number[];
    partySize?: number;
  };

  // Time range filter (e.g. ["18:00", "22:00"])
  if (filters.timeRange) {
    const [start, end] = filters.timeRange;
    const time = reservation.reservationTime.slice(0, 5);
    if (time < start || time > end) return false;
  }

  // Weekday filter (0=Sunday, 1=Monday, ..., 6=Saturday)
  if (filters.weekdays && filters.weekdays.length > 0) {
    const day = new Date(reservation.reservationDate).getDay();
    if (!filters.weekdays.includes(day)) return false;
  }

  // Party size filter
  if (filters.partySize) {
    if (reservation.partySize !== filters.partySize) return false;
  }

  // Legacy partySize on watch itself
  if (watch.partySize) {
    if (reservation.partySize !== watch.partySize) return false;
  }

  return true;
}

export { watchesRouter };
