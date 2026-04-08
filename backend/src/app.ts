import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
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
import { authMiddleware } from "./middleware/auth";
import { env } from "./env";
import { getStripe } from "./stripe";

const app = new Hono();

const TRUSTED_ORIGINS = new Set([
  "http://localhost:8081",
  "http://localhost:3000",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:3000",
  "https://mobile-three-sable.vercel.app",
  "https://reslot.se",
]);

const TRUSTED_SUFFIX_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
];

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return "*";
    if (TRUSTED_ORIGINS.has(origin)) return origin;
    if (TRUSTED_SUFFIX_PATTERNS.some((re) => re.test(origin))) return origin;
    return origin; // Allow all for now — tighten after launch
  },
  credentials: true,
}));

app.use("*", logger());

// Auth middleware on protected routes
app.use("/api/profile/*", authMiddleware);
app.use("/api/alerts/*", authMiddleware);
app.use("/api/watches/*", authMiddleware);
app.use("/api/credits/*", authMiddleware);
app.use("/api/referral/*", authMiddleware);
app.use("/api/saved-restaurants/*", authMiddleware);
app.use("/api/notifications/*", authMiddleware);

// Health check
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

export default app;
