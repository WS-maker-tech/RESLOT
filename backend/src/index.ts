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
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import { db } from "./db";
import { getStripe } from "./stripe";
import { env } from "./env";

const app = new Hono();

// Trusted origins — explicit list, no wildcard echo
const TRUSTED_ORIGINS = [
  "http://localhost:8081",
  "http://localhost:3000",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:3000",
];

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return ""; // deny null origins
      // Allow exact matches
      if (TRUSTED_ORIGINS.includes(origin)) return origin;
      // Allow vibecode development domains
      if (
        origin.endsWith(".dev.vibecode.run") ||
        origin.endsWith(".vibecode.run") ||
        origin.endsWith(".vibecodeapp.com") ||
        origin.endsWith(".vibecode.dev") ||
        origin === "https://vibecode.dev"
      ) {
        return origin;
      }
      return ""; // deny unknown origins
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
          "⏰ 1 minut kvar av ångerfristen",
          `Din ångerfrist för ${reservation.restaurant.name} löper ut snart.`,
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
          // Mark as payment_failed — do NOT award credits
          await db.reservation.update({
            where: { id: reservation.id },
            data: { status: "payment_failed", creditStatus: "reverted" },
          });
          // Refund credits to claimer since payment failed
          if (reservation.claimerPhone) {
            await db.userProfile.update({
              where: { phone: reservation.claimerPhone },
              data: { credits: { increment: 2 } },
            });
          }
          continue; // Skip finalization for this reservation
        }
      }

      await db.$transaction(async (tx) => {
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: "completed", creditStatus: "awarded" },
        });

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
        "Credits intjänade!",
        "Du fick 2 credits för din delade bokning.",
        { type: "credits_awarded", reservationId: reservation.id, restaurantId: reservation.restaurantId }
      ).catch(() => {});

      // DELAYED submitter notification: booking was claimed (sent after grace period, not immediately)
      const dateStr = new Date(reservation.reservationDate).toLocaleDateString("sv-SE");
      sendPushToUser(
        reservation.submitterPhone,
        "Din bokning togs över! +2 credits",
        `Din bokning på ${reservation.restaurant.name} den ${dateStr} har tagits över och credits har utbetalats.`,
        { type: "booking_claimed", reservationId: reservation.id, restaurantId: reservation.restaurantId }
      ).catch(() => {});

      // Push notification: grace period completed for claimer
      if (reservation.claimerPhone) {
        sendPushToUser(
          reservation.claimerPhone,
          "Bokning slutförd",
          `Din bokning på ${reservation.restaurant.name} är nu bekräftad.`,
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

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
