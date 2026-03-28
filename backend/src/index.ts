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
import { logger } from "hono/logger";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/restaurants", restaurantsRouter);
app.route("/api/reservations", reservationsRouter);
app.route("/api/profile", profileRouter);
app.route("/api/alerts", alertsRouter);
app.route("/api/auth", authRouter);

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
