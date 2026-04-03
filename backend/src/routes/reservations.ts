import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { authMiddleware } from "../middleware/auth";
import { createClaimPreAuth, cancelPreAuth, capturePayment, getOrCreateStripeCustomer, createNoShowFeeCharge } from "../stripe";
import { sendPushToUser, sendPushToUsers } from "../push";
import { matchesWatchFilters } from "./watches";

const reservationsRouter = new Hono();

// --- Task A3: In-memory rate limiter for claims ---
const claimRateLimit = new Map<string, { count: number; resetAt: number }>();
const CLAIM_RATE_LIMIT = 10;
const CLAIM_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkClaimRateLimit(phone: string): boolean {
  const now = Date.now();
  const entry = claimRateLimit.get(phone);

  if (!entry || now > entry.resetAt) {
    claimRateLimit.set(phone, { count: 1, resetAt: now + CLAIM_RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= CLAIM_RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// GET /api/reservations - List available reservations with restaurant info (PUBLIC)
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

// --- Task A4: Social Proof Stats Endpoint (PUBLIC, BEFORE /:id) ---
reservationsRouter.get("/stats", async (c) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const weeklyReservations = await db.reservation.count({
    where: {
      createdAt: { gte: sevenDaysAgo },
      status: { in: ["active", "claimed", "grace_period", "completed"] },
    },
  });

  return c.json({ data: { weeklyReservations } });
});

// GET /api/reservations/mine - Get user's reservations (PROTECTED)
reservationsRouter.get("/mine", authMiddleware, async (c) => {
  const phone = c.get("userPhone");

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
});

// GET /api/reservations/missed - Recently claimed bookings for loss aversion (PUBLIC)
reservationsRouter.get("/missed", async (c) => {
  const city = c.req.query("city");
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {
    status: { in: ["claimed", "grace_period", "completed"] },
  };

  if (city) {
    where.restaurant = { city };
  }

  const reservations = await db.reservation.findMany({
    where,
    include: { restaurant: true },
    orderBy: { claimedAt: "desc" },
    take: 10,
  });

  const data = reservations.map((r) => ({
    ...r,
    timeToClaim: r.claimedAt && r.createdAt
      ? Math.round((new Date(r.claimedAt).getTime() - new Date(r.createdAt).getTime()) / 60000)
      : null,
  }));

  return c.json({ data });
});

// GET /api/reservations/:id - Get single reservation (PUBLIC)
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

// POST /api/reservations - Submit a new reservation (PROTECTED)
reservationsRouter.post(
  "/",
  authMiddleware,
  zValidator(
    "json",
    z.object({
      restaurantId: z.string(),
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
      extraInfo: z.string().max(500).optional(),
      cancellationWindowHours: z.number().optional(),
    })
  ),
  async (c) => {
    const submitterPhone = c.get("userPhone");
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
        submitterPhone,
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
        extraInfo: body.extraInfo?.replace(/<[^>]*>/g, "").trim() || null,
        cancellationWindowHours: body.cancellationWindowHours,
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
          title: "Ny bokning tillg\u00e4nglig!",
          message: `En bokning p\u00e5 ${restaurant.name} f\u00f6r ${body.partySize} personer den ${body.reservationTime} har lagts upp.`,
          restaurantId: body.restaurantId,
        },
      });
    }

    // Push notify users watching this restaurant
    if (alerts.length > 0) {
      const watcherPhones = alerts.map((a) => a.userPhone);
      sendPushToUsers(
        watcherPhones,
        "Ny bokning tillgänglig!",
        `En bokning på ${restaurant.name} för ${body.partySize} pers den ${body.reservationTime} har lagts upp.`,
        { type: "watch_match", restaurantId: body.restaurantId, reservationId: reservation.id }
      ).catch(() => {});
    }

    // Also check watches (bevakningar) for matching criteria with smart filters
    const matchingWatches = await db.watch.findMany({
      where: { restaurantId: body.restaurantId },
    });
    const watchPhones = matchingWatches
      .filter((w) => matchesWatchFilters(w, {
        reservationTime: body.reservationTime,
        reservationDate: new Date(body.reservationDate),
        partySize: body.partySize,
      }))
      .map((w) => w.userPhone)
      .filter((p) => p !== submitterPhone);
    if (watchPhones.length > 0) {
      sendPushToUsers(
        watchPhones,
        "Bevakningsträff!",
        `En bokning på ${restaurant.name} matchar din bevakning.`,
        { type: "watch_match", restaurantId: body.restaurantId, reservationId: reservation.id }
      ).catch(() => {});
    }

    return c.json({ data: reservation }, 201);
  }
);

// Service fee constant (SEK)
const SERVICE_FEE_SEK = 29;
// Grace period duration (ms) — 5 minutes
const GRACE_PERIOD_MS = 5 * 60 * 1000;

// Helper: send SMS if Twilio is configured
async function sendSms(to: string, body: string) {
  const { env } = await import("../env");
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
    try {
      const twilio = require("twilio");
      const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body,
        from: env.TWILIO_PHONE_NUMBER,
        to,
      });
      console.log(`[SMS] Sent to ${to}`);
    } catch (err) {
      console.error("[SMS] Twilio error:", err);
    }
  } else {
    console.log(`[SMS DEV] Would send to ${to}: ${body}`);
  }
}

// POST /api/reservations/:id/claim - Claim a reservation (PROTECTED)
// Uses optimistic locking (version field) to prevent race conditions
reservationsRouter.post(
  "/:id/claim",
  authMiddleware,
  async (c) => {
    const id = c.req.param("id");
    const claimerPhone = c.get("userPhone");

    // Rate limit check
    if (!checkClaimRateLimit(claimerPhone)) {
      return c.json(
        { error: { message: "Max 10 claims per timme", code: "RATE_LIMITED" } },
        429
      );
    }

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

    // Check claimer has enough credits
    // ── DYNAMIC PRICING HOOK (Future) ──────────────────────────────────────
    // When dynamic pricing is implemented:
    // 1. Read `reservation.creditCost` (already in schema, default 2)
    // 2. creditCost is set at submission time based on:
    //    - restaurant.demandMultiplier (popularity-based, already in schema)
    //    - Time until reservation (urgency premium)
    //    - Day of week / time of day
    // 3. Replace the hardcoded `2` below with `reservation.creditCost`
    // 4. Update the decrement in the transaction below similarly
    // ────────────────────────────────────────────────────────────────────────
    const creditCost = 2; // Future: reservation.creditCost ?? 2
    const claimer = await db.userProfile.findUnique({ where: { phone: claimerPhone } });
    if (!claimer) {
      return c.json({ error: { message: "Användare ej hittad", code: "NOT_FOUND" } }, 404);
    }
    if (claimer.credits < creditCost) {
      return c.json(
        { error: { message: `Du har inte tillräckligt med credits (${creditCost} krävs)`, code: "INSUFFICIENT_CREDITS" } },
        400
      );
    }

    // Get or create Stripe Customer for SCA/PSD2 compliance
    const stripeCustomerId = await getOrCreateStripeCustomer({
      phone: claimerPhone,
      email: claimer.email || undefined,
      name: `${claimer.firstName} ${claimer.lastName}`.trim() || undefined,
      existingCustomerId: claimer.stripeCustomerId,
    });

    // Persist stripeCustomerId if newly created
    if (stripeCustomerId && !claimer.stripeCustomerId) {
      await db.userProfile.update({
        where: { phone: claimerPhone },
        data: { stripeCustomerId },
      });
    }

    // Stripe pre-auth for service fee
    let stripeResult;
    try {
      stripeResult = await createClaimPreAuth({
        amountSek: SERVICE_FEE_SEK,
        reservationId: id,
        claimerPhone,
        stripeCustomerId,
      });
    } catch (err: unknown) {
      console.error("[CLAIM] Stripe pre-auth error:", err);
      const msg = err instanceof Error && err.message.includes("card")
        ? "Ditt kort nekades. Kontrollera dina kortuppgifter och försök igen."
        : "Betalningen kunde inte genomföras. Försök igen senare.";
      return c.json(
        { error: { message: msg, code: "PAYMENT_FAILED" } },
        402
      );
    }

    if (!stripeResult) {
      return c.json(
        { error: { message: "Betalning ej tillgänglig. Kontrollera att du har registrerat ett kort.", code: "PAYMENT_UNAVAILABLE" } },
        503
      );
    }

    // Calculate grace deadline
    const now = new Date();
    const graceDeadline = new Date(now.getTime() + GRACE_PERIOD_MS);

    // Optimistic locking: only update if version matches (prevents race condition)
    const currentVersion = reservation.version;
    try {
      const updated = await db.$transaction(async (tx) => {
        // Atomic update with version check
        const result = await tx.reservation.updateMany({
          where: {
            id,
            status: "active",
            version: currentVersion,
          },
          data: {
            status: "grace_period",
            claimerPhone,
            claimedAt: now,
            graceDeadline,
            creditStatus: "pending",
            serviceFee: SERVICE_FEE_SEK,
            stripePaymentIntentId: stripeResult.paymentIntentId,
            version: currentVersion + 1,
          },
        });

        if (result.count === 0) {
          throw new Error("OPTIMISTIC_LOCK_FAILED");
        }

        // Deduct 2 credits from claimer (inside transaction)
        await tx.userProfile.update({
          where: { phone: claimerPhone },
          data: { credits: { decrement: 2 } },
        });

        // Return the updated reservation
        return tx.reservation.findUnique({
          where: { id },
          include: { restaurant: true },
        });
      });

      if (!updated) {
        return c.json(
          { error: { message: "Reservation not found after update", code: "NOT_FOUND" } },
          404
        );
      }

      // In-app alerts to both parties
      const dateStr = new Date(reservation.reservationDate).toLocaleDateString("sv-SE");
      await db.activityAlert.create({
        data: {
          userPhone: claimerPhone,
          type: "claim",
          title: `Bokning bekräftad — ${reservation.restaurant.name}`,
          message: `Du har tagit över bokningen för ${reservation.partySize} pers den ${dateStr} kl ${reservation.reservationTime}. Namn på bokning: ${reservation.nameOnReservation}. Ångerfrist: 5 min.`,
          restaurantId: reservation.restaurantId,
        },
      });
      await db.activityAlert.create({
        data: {
          userPhone: reservation.submitterPhone,
          type: "claim",
          title: `Din bokning togs över`,
          message: `Din bokning på ${reservation.restaurant.name} den ${dateStr} har tagits över. Credits utbetalas efter 5 min ångerfrist.`,
          restaurantId: reservation.restaurantId,
        },
      });

      // Send SMS to both parties
      await sendSms(
        claimerPhone,
        `Reslot: Du har tagit över bokningen på ${reservation.restaurant.name} den ${dateStr} kl ${reservation.reservationTime}. Ångerfrist: 5 min.`
      );
      await sendSms(
        reservation.submitterPhone,
        `Reslot: Din bokning på ${reservation.restaurant.name} den ${dateStr} har tagits över. Credits kommer inom 5 min.`
      );

      // Push notification to claimer immediately
      sendPushToUser(
        claimerPhone,
        `Bokning bekräftad — ${reservation.restaurant.name}`,
        `Du har tagit över bokningen för ${reservation.partySize} pers den ${dateStr} kl ${reservation.reservationTime}. Ångerfrist: 5 min.`,
        { type: "claim_confirmed", reservationId: id, restaurantId: reservation.restaurantId }
      ).catch(() => {});

      // DELAYED: Submitter push notification is sent AFTER grace period (5 min)
      // via the CRON job in index.ts — not immediately, to avoid premature alerts
      // In-app ActivityAlert above is still created immediately for record-keeping

      return c.json({
        data: {
          ...updated,
          stripeClientSecret: stripeResult.clientSecret,
          stripeRequiresAction: stripeResult.requiresAction,
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "OPTIMISTIC_LOCK_FAILED") {
        // Someone else claimed it first — cancel Stripe pre-auth
        await cancelPreAuth(stripeResult.paymentIntentId);
        return c.json(
          { error: { message: "Bokningen har redan tagits över av någon annan", code: "ALREADY_CLAIMED" } },
          409
        );
      }
      throw err;
    }
  }
);

// POST /api/reservations/:id/cancel-claim - Cancel claim within grace period (PROTECTED)
reservationsRouter.post("/:id/cancel-claim", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const userPhone = c.get("userPhone");

  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { restaurant: true },
  });

  if (!reservation) {
    return c.json({ error: { message: "Reservation not found", code: "NOT_FOUND" } }, 404);
  }

  // Only the claimer can cancel their own claim
  if (reservation.claimerPhone !== userPhone) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  if (reservation.status !== "grace_period") {
    return c.json(
      { error: { message: "Bokningen \u00e4r inte i \u00e5ngerfristen", code: "NOT_IN_GRACE" } },
      400
    );
  }

  if (!reservation.graceDeadline || new Date() > reservation.graceDeadline) {
    return c.json(
      { error: { message: "\u00c5ngerfristen har g\u00e5tt ut", code: "GRACE_EXPIRED" } },
      400
    );
  }

  // Cancel Stripe pre-auth if exists
  if (reservation.stripePaymentIntentId) {
    await cancelPreAuth(reservation.stripePaymentIntentId);
  }

  // Refund 2 credits to claimer
  if (reservation.claimerPhone) {
    await db.userProfile.update({
      where: { phone: reservation.claimerPhone },
      data: { credits: { increment: 2 } },
    });
  }

  // Revert reservation to active
  const updated = await db.reservation.update({
    where: { id },
    data: {
      status: "active",
      claimerPhone: null,
      claimedAt: null,
      graceDeadline: null,
      creditStatus: "reverted",
      serviceFee: null,
      stripePaymentIntentId: null,
    },
    include: { restaurant: true },
  });

  // Notify submitter
  await db.activityAlert.create({
    data: {
      userPhone: reservation.submitterPhone,
      type: "claim",
      title: "\u00d6vertagandet \u00e5ngrades",
      message: `\u00d6vertagandet av din bokning p\u00e5 ${reservation.restaurant.name} \u00e5ngrades. Bokningen \u00e4r aktiv igen.`,
      restaurantId: reservation.restaurantId,
    },
  });

  return c.json({ data: updated });
});

// POST /api/reservations/:id/finalize - Finalize claim after grace period (PROTECTED)
reservationsRouter.post("/:id/finalize", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { restaurant: true },
  });

  if (!reservation) {
    return c.json({ error: { message: "Reservation not found", code: "NOT_FOUND" } }, 404);
  }

  if (reservation.status !== "grace_period") {
    return c.json(
      { error: { message: "Bokningen \u00e4r inte i \u00e5ngerfristen", code: "NOT_IN_GRACE" } },
      400
    );
  }

  if (reservation.graceDeadline && new Date() < reservation.graceDeadline) {
    return c.json(
      { error: { message: "Ångerfristen har inte gått ut ännu", code: "GRACE_NOT_EXPIRED" } },
      400
    );
  }

  // Capture Stripe pre-auth (charge the service fee)
  if (reservation.stripePaymentIntentId) {
    const captured = await capturePayment(reservation.stripePaymentIntentId);
    if (!captured) {
      console.error(`[FINALIZE] Failed to capture payment for reservation ${id}`);
    }
  }

  // Award 2 credits to submitter NOW
  await db.userProfile.upsert({
    where: { phone: reservation.submitterPhone },
    update: { credits: { increment: 2 } },
    create: {
      phone: reservation.submitterPhone,
      firstName: reservation.submitterFirstName,
      lastName: reservation.submitterLastName,
      email: "",
      credits: 2,
    },
  });

  const updated = await db.reservation.update({
    where: { id },
    data: {
      status: "completed",
      creditStatus: "awarded",
    },
    include: { restaurant: true },
  });

  // Notify submitter about credit award
  await db.activityAlert.create({
    data: {
      userPhone: reservation.submitterPhone,
      type: "credit",
      title: "Du fick 2 credits!",
      message: `Din bokning p\u00e5 ${reservation.restaurant.name} har bekr\u00e4ftats. Du har f\u00e5tt 2 credits!`,
      restaurantId: reservation.restaurantId,
    },
  });

  return c.json({ data: updated });
});

// PATCH /api/reservations/:id/cancel - Cancel a reservation (PROTECTED)
reservationsRouter.patch("/:id/cancel", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const userPhone = c.get("userPhone");

  const reservation = await db.reservation.findUnique({ where: { id } });

  if (!reservation) {
    return c.json({ error: { message: "Reservation not found", code: "NOT_FOUND" } }, 404);
  }

  // Only the submitter can cancel their own reservation
  if (reservation.submitterPhone !== userPhone) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
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

// POST /api/reservations/:id/report-no-show - Report a no-show (PROTECTED)
// Only the original submitter can report within 24h after reservation time
reservationsRouter.post(
  "/:id/report-no-show",
  authMiddleware,
  zValidator(
    "json",
    z.object({
      reason: z.string().min(1).max(500),
      evidenceUrl: z.string().optional(),
    })
  ),
  async (c) => {
    const id = c.req.param("id");
    const reporterPhone = c.get("userPhone");
    const { reason, evidenceUrl } = c.req.valid("json");

    const reservation = await db.reservation.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!reservation) {
      return c.json({ error: { message: "Reservation not found", code: "NOT_FOUND" } }, 404);
    }

    // Only submitter can report no-show
    if (reservation.submitterPhone !== reporterPhone) {
      return c.json(
        { error: { message: "Bara den som lade upp bokningen kan rapportera no-show", code: "FORBIDDEN" } },
        403
      );
    }

    // Only completed reservations can have no-show reports
    if (reservation.status !== "completed") {
      return c.json(
        { error: { message: "Kan bara rapportera no-show på genomförda bokningar", code: "INVALID_STATUS" } },
        400
      );
    }

    // Must be within 24 hours after reservation date+time
    const reservationDateTime = new Date(reservation.reservationDate);
    const [hours, minutes] = reservation.reservationTime.split(":").map(Number);
    reservationDateTime.setHours(hours || 0, minutes || 0, 0, 0);
    const twentyFourHoursAfter = new Date(reservationDateTime.getTime() + 24 * 60 * 60 * 1000);

    if (new Date() > twentyFourHoursAfter) {
      return c.json(
        { error: { message: "No-show kan bara rapporteras inom 24 timmar efter bokningstiden", code: "TOO_LATE" } },
        400
      );
    }

    // Check for duplicate report
    const existingReport = await db.noShowReport.findFirst({
      where: { reservationId: id, reporterPhone },
    });

    if (existingReport) {
      return c.json(
        { error: { message: "Du har redan rapporterat no-show för denna bokning", code: "DUPLICATE" } },
        409
      );
    }

    // Create no-show report
    const report = await db.noShowReport.create({
      data: {
        reservationId: id,
        reporterPhone,
        reason,
        evidenceUrl: evidenceUrl ?? null,
        status: "confirmed", // Auto-confirm for now
      },
    });

    // Calculate no-show fee: 10-20% of prepaidAmount, or flat 100 SEK
    const NO_SHOW_FLAT_FEE_SEK = 100;
    const NO_SHOW_PERCENTAGE = 0.15; // 15%
    const noShowFeeSek = reservation.prepaidAmount
      ? Math.round(reservation.prepaidAmount * NO_SHOW_PERCENTAGE)
      : NO_SHOW_FLAT_FEE_SEK;

    // Charge the claimer via Stripe
    let feeCharged = false;
    let feePaymentIntentId: string | null = null;

    if (reservation.claimerPhone) {
      const claimer = await db.userProfile.findUnique({ where: { phone: reservation.claimerPhone } });
      if (claimer) {
        const chargeResult = await createNoShowFeeCharge({
          amountSek: noShowFeeSek,
          reservationId: id,
          claimerPhone: reservation.claimerPhone,
          stripeCustomerId: claimer.stripeCustomerId,
        });
        if (chargeResult) {
          feeCharged = true;
          feePaymentIntentId = chargeResult.paymentIntentId;
        }
      }
    }

    // Update reservation status to no_show and record fee
    await db.reservation.update({
      where: { id },
      data: {
        status: "no_show",
        noShowFeeCharged: feeCharged,
        noShowFeePaymentIntentId: feePaymentIntentId,
      },
    });

    // Alert the claimer about the no-show report and fee
    if (reservation.claimerPhone) {
      await db.activityAlert.create({
        data: {
          userPhone: reservation.claimerPhone,
          type: "claim",
          title: "No-show rapporterad",
          message: feeCharged
            ? `En no-show har bekräftats för din bokning på ${reservation.restaurant.name}. En avgift på ${noShowFeeSek} SEK har debiterats.`
            : `En no-show har rapporterats för din bokning på ${reservation.restaurant.name}. Vi utreder ärendet.`,
          restaurantId: reservation.restaurantId,
        },
      });
    }

    return c.json({ data: { ...report, noShowFeeSek, feeCharged } }, 201);
  }
);

// POST /api/reservations/:id/resell - Resell a claimed/completed reservation (PROTECTED)
reservationsRouter.post("/:id/resell", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const userPhone = c.get("userPhone");

  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { restaurant: true },
  });

  if (!reservation) {
    return c.json({ error: { message: "Reservation not found", code: "NOT_FOUND" } }, 404);
  }

  // Only the claimer can resell
  if (reservation.claimerPhone !== userPhone) {
    return c.json(
      { error: { message: "Bara den som tog över bokningen kan sälja vidare", code: "FORBIDDEN" } },
      403
    );
  }

  // Only completed or claimed reservations can be resold
  if (!["completed", "claimed"].includes(reservation.status)) {
    return c.json(
      { error: { message: "Bokningen kan inte säljas vidare i nuvarande status", code: "INVALID_STATUS" } },
      400
    );
  }

  // Check reservation date is in the future
  const reservationDateTime = new Date(reservation.reservationDate);
  const [hours, minutes] = reservation.reservationTime.split(":").map(Number);
  reservationDateTime.setHours(hours || 0, minutes || 0, 0, 0);

  if (reservationDateTime <= new Date()) {
    return c.json(
      { error: { message: "Kan inte sälja vidare en bokning som redan passerat", code: "PAST_RESERVATION" } },
      400
    );
  }

  // Get the claimer's profile for submitter info on the new reservation
  const claimerProfile = await db.userProfile.findUnique({ where: { phone: userPhone } });
  if (!claimerProfile) {
    return c.json({ error: { message: "Användare ej hittad", code: "NOT_FOUND" } }, 404);
  }

  // Create a new active reservation copying details from the original
  const newReservation = await db.reservation.create({
    data: {
      restaurantId: reservation.restaurantId,
      submitterPhone: userPhone, // The claimer becomes the new submitter
      submitterFirstName: claimerProfile.firstName,
      submitterLastName: claimerProfile.lastName,
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime,
      partySize: reservation.partySize,
      seatType: reservation.seatType,
      nameOnReservation: reservation.nameOnReservation,
      cancelFee: reservation.cancelFee,
      prepaidAmount: reservation.prepaidAmount,
      verificationLink: reservation.verificationLink,
      extraInfo: reservation.extraInfo,
      cancellationWindowHours: reservation.cancellationWindowHours,
      resoldFromId: reservation.id,
      status: "active",
    },
    include: { restaurant: true },
  });

  // Mark original reservation as resold
  await db.reservation.update({
    where: { id },
    data: { status: "resold" },
  });

  // Notify original submitter
  await db.activityAlert.create({
    data: {
      userPhone: reservation.submitterPhone,
      type: "claim",
      title: "Bokning vidaresåld",
      message: `Bokningen på ${reservation.restaurant.name} har sålts vidare och finns nu tillgänglig igen.`,
      restaurantId: reservation.restaurantId,
    },
  });

  return c.json({ data: newReservation }, 201);
});

export { reservationsRouter };
