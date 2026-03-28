import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";

const reservationsRouter = new Hono();

// GET /api/reservations - List available reservations with restaurant info
reservationsRouter.get(
  "/",
  zValidator(
    "query",
    z.object({
      city: z.string().optional(),
      neighborhood: z.string().optional(),
      date: z.string().optional(),
    })
  ),
  async (c) => {
    const { city, neighborhood, date } = c.req.valid("query");

    const where: Record<string, unknown> = {
      status: "active",
    };

    // Filter by restaurant properties
    const restaurantWhere: Record<string, unknown> = {};
    if (city) {
      restaurantWhere.city = city;
    }
    if (neighborhood) {
      restaurantWhere.neighborhood = neighborhood;
    }
    if (Object.keys(restaurantWhere).length > 0) {
      where.restaurant = restaurantWhere;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.reservationDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const reservations = await db.reservation.findMany({
      where,
      include: {
        restaurant: true,
      },
      orderBy: { reservationDate: "asc" },
    });

    return c.json({ data: reservations });
  }
);

// GET /api/reservations/mine - Get user's reservations
reservationsRouter.get(
  "/mine",
  zValidator(
    "query",
    z.object({
      phone: z.string(),
    })
  ),
  async (c) => {
    const { phone } = c.req.valid("query");

    const reservations = await db.reservation.findMany({
      where: {
        OR: [{ submitterPhone: phone }, { claimerPhone: phone }],
      },
      include: {
        restaurant: true,
      },
      orderBy: { reservationDate: "desc" },
    });

    return c.json({ data: reservations });
  }
);

// GET /api/reservations/:id - Get single reservation
reservationsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { restaurant: true },
  });

  if (!reservation) {
    return c.json({ error: { message: "Reservation not found", code: "NOT_FOUND" } }, 404);
  }

  return c.json({ data: reservation });
});

// POST /api/reservations - Submit a new reservation
reservationsRouter.post(
  "/",
  zValidator(
    "json",
    z.object({
      restaurantId: z.string(),
      submitterPhone: z.string(),
      submitterFirstName: z.string(),
      submitterLastName: z.string(),
      reservationDate: z.string(),
      reservationTime: z.string(),
      partySize: z.number().int().min(1),
      seatType: z.string(),
      nameOnReservation: z.string(),
      cancelFee: z.number().optional(),
      prepaidAmount: z.number().optional(),
      verificationLink: z.string().optional(),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");

    // Verify restaurant exists
    const restaurant = await db.restaurant.findUnique({
      where: { id: body.restaurantId },
    });
    if (!restaurant) {
      return c.json({ error: { message: "Restaurant not found", code: "NOT_FOUND" } }, 404);
    }

    const reservation = await db.reservation.create({
      data: {
        restaurantId: body.restaurantId,
        submitterPhone: body.submitterPhone,
        submitterFirstName: body.submitterFirstName,
        submitterLastName: body.submitterLastName,
        reservationDate: new Date(body.reservationDate),
        reservationTime: body.reservationTime,
        partySize: body.partySize,
        seatType: body.seatType,
        nameOnReservation: body.nameOnReservation,
        cancelFee: body.cancelFee ?? null,
        prepaidAmount: body.prepaidAmount ?? null,
        verificationLink: body.verificationLink ?? null,
        status: "active",
      },
      include: {
        restaurant: true,
      },
    });

    // Increment timesBookedOnReslot
    await db.restaurant.update({
      where: { id: body.restaurantId },
      data: { timesBookedOnReslot: { increment: 1 } },
    });

    // Create activity alerts for users who have alerts for this restaurant
    const alerts = await db.restaurantAlert.findMany({
      where: { restaurantId: body.restaurantId, enabled: true },
    });

    for (const alert of alerts) {
      await db.activityAlert.create({
        data: {
          userPhone: alert.userPhone,
          type: "drop",
          title: "Ny bokning tillgänglig!",
          message: `En bokning på ${restaurant.name} för ${body.partySize} personer den ${body.reservationTime} har lagts upp.`,
          restaurantId: body.restaurantId,
        },
      });
    }

    return c.json({ data: reservation }, 201);
  }
);

// POST /api/reservations/:id/claim - Claim a reservation
reservationsRouter.post(
  "/:id/claim",
  zValidator(
    "json",
    z.object({
      claimerPhone: z.string(),
    })
  ),
  async (c) => {
    const id = c.req.param("id");
    const { claimerPhone } = c.req.valid("json");

    const reservation = await db.reservation.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!reservation) {
      return c.json({ error: { message: "Reservation not found", code: "NOT_FOUND" } }, 404);
    }

    if (reservation.status !== "active") {
      return c.json(
        { error: { message: "Reservation is no longer available", code: "NOT_AVAILABLE" } },
        400
      );
    }

    if (reservation.submitterPhone === claimerPhone) {
      return c.json(
        { error: { message: "Cannot claim your own reservation", code: "SELF_CLAIM" } },
        400
      );
    }

    // Update reservation status
    const updated = await db.reservation.update({
      where: { id },
      data: {
        status: "claimed",
        claimerPhone,
      },
      include: { restaurant: true },
    });

    // Award 2 tokens to submitter
    await db.userProfile.upsert({
      where: { phone: reservation.submitterPhone },
      update: { tokens: { increment: 2 } },
      create: {
        phone: reservation.submitterPhone,
        firstName: reservation.submitterFirstName,
        lastName: reservation.submitterLastName,
        email: "",
        tokens: 2,
      },
    });

    // Create activity alerts
    await db.activityAlert.create({
      data: {
        userPhone: reservation.submitterPhone,
        type: "token",
        title: "Du fick 2 tokens!",
        message: `Din bokning på ${reservation.restaurant.name} har blivit tagen. Du har fått 2 tokens som tack!`,
        restaurantId: reservation.restaurantId,
      },
    });

    await db.activityAlert.create({
      data: {
        userPhone: claimerPhone,
        type: "claim",
        title: "Bokning bekräftad!",
        message: `Du har tagit över bokningen på ${reservation.restaurant.name} den ${reservation.reservationTime}.`,
        restaurantId: reservation.restaurantId,
      },
    });

    return c.json({ data: updated });
  }
);

// PATCH /api/reservations/:id/cancel - Cancel a reservation
reservationsRouter.patch("/:id/cancel", async (c) => {
  const id = c.req.param("id");

  const reservation = await db.reservation.findUnique({ where: { id } });

  if (!reservation) {
    return c.json({ error: { message: "Reservation not found", code: "NOT_FOUND" } }, 404);
  }

  if (reservation.status !== "active") {
    return c.json(
      { error: { message: "Only active reservations can be cancelled", code: "INVALID_STATUS" } },
      400
    );
  }

  const updated = await db.reservation.update({
    where: { id },
    data: { status: "cancelled" },
    include: { restaurant: true },
  });

  return c.json({ data: updated });
});

export { reservationsRouter };
