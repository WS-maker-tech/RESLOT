import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
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
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import { db } from "./db";

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
app.post("/api/webhooks/stripe", async (c) => {
  // Forward to credits webhook handler
  const { creditsRouter } = await import("./routes/credits");
  return creditsRouter.fetch(
    new Request(new URL("/webhook", c.req.url).toString(), {
      method: "POST",
      headers: c.req.raw.headers,
      body: c.req.raw.body,
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

// --- Grace Period Auto-Finalize Cron (every 60s) ---
import { capturePayment } from "./stripe";

const GRACE_PERIOD_CRON_INTERVAL = 60 * 1000; // 60 seconds
let cronRunning = false; // Simple mutex to prevent parallel execution

setInterval(async () => {
  if (cronRunning) {
    console.log("[CRON] Skipped — previous run still in progress");
    return;
  }
  cronRunning = true;
  try {
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
