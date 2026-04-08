import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import { sampleRouter } from "./routes/sample";
import { restaurantsRouter } from "./routes/restaurants";
import { reservationsRouter } from "./routes/reservations";
import { profileRouter } from "./routes/profile";
import { alertsRouter } from "./routes/alerts";
import { authRouter } from "./routes/auth";
import { watchesRouter } from "./routes/watches";
import { creditsRouter } from "./routes/credits";
import { referralRouter } from "./routes/referral";
import { savedRestaurantsRouter } from "./routes/saved-restaurants";
import { notificationsRouter } from "./routes/notifications";
import { supportRouter } from "./routes/support";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import { db } from "./db";
import { getStripe } from "./stripe";
import { env } from "./env";

const app = new Hono();

const TRUSTED_ORIGINS = new Set([
  "http://localhost:8081",
  "http://localhost:3000",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:3000",
  "https://vibecode.dev",
]);

const TRUSTED_SUFFIX_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.dev$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "";
      if (TRUSTED_ORIGINS.has(origin)) return origin;
      if (TRUSTED_SUFFIX_PATTERNS.some((re) => re.test(origin))) return origin;
      return "";
    },
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Stripe webhook must be BEFORE auth middleware (Stripe signs requests, not our auth)
// Import directly to avoid dynamic import issues with body streaming
app.post("/api/webhooks/stripe", async (c) => {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: { message: "Webhook ej konfigurerad", code: "NOT_CONFIGURED" } }, 503);
  }

  const sig = c.req.header("stripe-signature");
  if (!sig) {
    return c.json({ error: { message: "Saknar stripe-signature header", code: "BAD_REQUEST" } }, 400);
  }

  // Read raw body ONCE here — do not consume it again downstream
  const rawBody = await c.req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Signaturverifiering misslyckades:", err);
    return c.json({ error: { message: "Ogiltig signatur", code: "BAD_SIGNATURE" } }, 400);
  }

  // Forward validated event to credits webhook handler by injecting raw body
  return creditsRouter.fetch(
    new Request(new URL("/webhook", c.req.url).toString(), {
      method: "POST",
      headers: c.req.raw.headers,
      body: rawBody,
    }),
    c.env
  );
});

// Auth middleware on protected routes
app.use("/api/profile/*", authMiddleware);
app.use("/api/alerts/*", authMiddleware);
app.use("/api/watches/*", authMiddleware);
app.use("/api/credits/*", authMiddleware);
app.use("/api/referral/*", authMiddleware);
app.use("/api/saved-restaurants/*", authMiddleware);
app.use("/api/notifications/*", authMiddleware);

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/restaurants", restaurantsRouter);
app.route("/api/reservations", reservationsRouter);
app.route("/api/profile", profileRouter);
app.route("/api/alerts", alertsRouter);
app.route("/api/auth", authRouter);
app.route("/api/watches", watchesRouter);
app.route("/api/credits", creditsRouter);
app.route("/api/referral", referralRouter);
app.route("/api/saved-restaurants", savedRestaurantsRouter);
app.route("/api/notifications", notificationsRouter);
app.route("/api/support", supportRouter);

// --- Grace Period Auto-Finalize Cron (every 60s) ---
import { capturePayment } from "./stripe";
import { sendPushToUser } from "./push";

const GRACE_PERIOD_CRON_INTERVAL = 60 * 1000; // 60 seconds
let cronRunning = false; // Simple mutex to prevent parallel execution

setInterval(async () => {
  if (cronRunning) {
    console.log("[CRON] Skipped — previous run still in progress");
    return;
  }
  cronRunning = true;
  try {
    // Grace period reminder: notify claimers with ~1 minute left
    const fourMinutesAgo = new Date(Date.now() - 4 * 60 * 1000);
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

    const aboutToExpire = await db.reservation.findMany({
      where: {
        status: "grace_period",
        claimedAt: { gte: threeMinutesAgo, lt: fourMinutesAgo },
      },
      include: { restaurant: true },
    });

    for (const reservation of aboutToExpire) {
      if (reservation.claimerPhone) {
        sendPushToUser(
          reservation.claimerPhone,
          "Ångerfristen löper ut",
          `Ångerfristen löper ut om 1 minut. Fortfarande nöjd?`,
          { type: "grace_reminder", reservationId: reservation.id }
        ).catch(() => {});
      }
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const expiredGracePeriods = await db.reservation.findMany({
      where: {
        status: "grace_period",
        claimedAt: { lt: fiveMinutesAgo },
      },
      include: { restaurant: true },
    });

    for (const reservation of expiredGracePeriods) {
      // Capture Stripe pre-auth before finalizing
      if (reservation.stripePaymentIntentId) {
        const captured = await capturePayment(reservation.stripePaymentIntentId);
        if (!captured) {
          console.error(`[CRON] Failed to capture payment for reservation ${reservation.id} — marking as payment_failed`);
          await db.$transaction(async (tx) => {
            const result = await tx.reservation.updateMany({
              where: { id: reservation.id, status: "grace_period", version: reservation.version },
              data: { status: "payment_failed", creditStatus: "reverted", version: reservation.version + 1 },
            });
            if (result.count === 0) return;
            if (reservation.claimerPhone) {
              await tx.userProfile.update({
                where: { phone: reservation.claimerPhone },
                data: { credits: { increment: 2 } },
              });
            }
          });
          continue;
        }
      }

      await db.$transaction(async (tx) => {
        const result = await tx.reservation.updateMany({
          where: { id: reservation.id, status: "grace_period", version: reservation.version },
          data: { status: "completed", creditStatus: "awarded", version: reservation.version + 1 },
        });

        if (result.count === 0) return;

        await tx.userProfile.upsert({
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

        await tx.activityAlert.create({
          data: {
            userPhone: reservation.submitterPhone,
            type: "credit",
            title: "Credits intjänade!",
            message: "Du fick 2 credits för din delade bokning.",
          },
        });
      });

      // Real-time validation: re-check reservation state before sending push
      const freshRes = await db.reservation.findUnique({ where: { id: reservation.id } });
      if (!freshRes || freshRes.status !== "completed") {
        console.log(`[CRON] Reservation ${reservation.id} state changed, skipping push`);
        continue;
      }

      // Push notification: credits awarded to submitter
      sendPushToUser(
        reservation.submitterPhone,
        "+2 credits",
        `Tack! Du fick 2 credits för bokningen på ${reservation.restaurant.name}.`,
        { type: "credits_awarded", reservationId: reservation.id, restaurantId: reservation.restaurantId }
      ).catch(() => {});

      // DELAYED submitter notification: booking was claimed (sent after grace period, not immediately)
      const dateStr = new Date(reservation.reservationDate).toLocaleDateString("sv-SE");
      sendPushToUser(
        reservation.submitterPhone,
        `Bordet på ${reservation.restaurant.name} är överlåtet`,
        `Någon tog bordet på ${reservation.restaurant.name}. Dina 2 credits är utbetalade.`,
        { type: "booking_claimed", reservationId: reservation.id, restaurantId: reservation.restaurantId }
      ).catch(() => {});

      // Push notification: grace period completed for claimer
      if (reservation.claimerPhone) {
        sendPushToUser(
          reservation.claimerPhone,
          `Bordet är ditt`,
          `Bokningen på ${reservation.restaurant.name} är bekräftad. Vi ses där!`,
          { type: "grace_completed", reservationId: reservation.id, restaurantId: reservation.restaurantId }
        ).catch(() => {});
      }
    }

    if (expiredGracePeriods.length > 0) {
      console.log(
        `[CRON] Auto-finalized ${expiredGracePeriods.length} grace period claim(s)`
      );
    }
  } catch (err) {
    console.error("[CRON] Grace period auto-finalize error:", err);
  } finally {
    cronRunning = false;
  }
}, GRACE_PERIOD_CRON_INTERVAL);

// --- 2-Hour Reminder Cron (every 30 min) ---
const REMINDER_CRON_INTERVAL = 30 * 60 * 1000; // 30 minutes
let reminderCronRunning = false;

setInterval(async () => {
  if (reminderCronRunning) {
    console.log("[REMINDER CRON] Skipped — previous run still in progress");
    return;
  }
  reminderCronRunning = true;
  try {
    const now = new Date();
    // Window: reservations happening between 1h45m and 2h15m from now
    const windowStart = new Date(now.getTime() + 105 * 60 * 1000); // +1h45m
    const windowEnd = new Date(now.getTime() + 135 * 60 * 1000);   // +2h15m

    const reservations = await db.reservation.findMany({
      where: {
        status: "claimed",
        reminderSent: false,
        reservationDate: {
          gte: new Date(now.toISOString().slice(0, 10)), // today or later
        },
      },
      include: { restaurant: true },
    });

    for (const reservation of reservations) {
      // Combine reservationDate + reservationTime into a full datetime
      const dateStr = reservation.reservationDate.toISOString().slice(0, 10);
      const reservationDateTime = new Date(`${dateStr}T${reservation.reservationTime}:00`);

      if (reservationDateTime >= windowStart && reservationDateTime <= windowEnd) {
        if (reservation.claimerPhone) {
          await sendPushToUser(
            reservation.claimerPhone,
            "Påminnelse",
            `Om 2 timmar sitter du på ${reservation.restaurant.name}. Glöm inte.`,
            { type: "reminder_2h", reservationId: reservation.id, restaurantId: reservation.restaurantId }
          ).catch(() => {});
        }

        await db.reservation.update({
          where: { id: reservation.id },
          data: { reminderSent: true },
        });
      }
    }

    const sent = reservations.filter((r) => {
      const dateStr = r.reservationDate.toISOString().slice(0, 10);
      const dt = new Date(`${dateStr}T${r.reservationTime}:00`);
      return dt >= windowStart && dt <= windowEnd;
    }).length;

    if (sent > 0) {
      console.log(`[REMINDER CRON] Sent ${sent} 2h reminder(s)`);
    }
  } catch (err) {
    console.error("[REMINDER CRON] Error:", err);
  } finally {
    reminderCronRunning = false;
  }
}, REMINDER_CRON_INTERVAL);

const port = Number(process.env.PORT) || 3000;

// Export app for Vercel serverless
export { app };

export default {
  port,
  fetch: app.fetch,
};
