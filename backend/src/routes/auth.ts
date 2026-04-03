import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { env } from "../env";

const authRouter = new Hono();

// --- Rate limiters for OTP endpoints ---
const otpSendLimiter = new Map<string, { count: number; resetAt: number }>();
const otpVerifyLimiter = new Map<string, { count: number; resetAt: number }>();

const OTP_SEND_LIMIT = 3; // max 3 sends per 15 minutes
const OTP_SEND_WINDOW_MS = 15 * 60 * 1000;
const OTP_VERIFY_LIMIT = 5; // max 5 verify attempts per 15 minutes
const OTP_VERIFY_WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(
  limiter: Map<string, { count: number; resetAt: number }>,
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = limiter.get(key);
  if (!entry || now > entry.resetAt) {
    limiter.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// Helper: generate 6-digit OTP (cryptographically secure)
function generateOtp(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return (100000 + (bytes[0]! % 900000)).toString();
}

// Helper: generate session token (cryptographically secure)
function generateToken(): string {
  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 64);
}

// Helper: normalize Swedish phone numbers
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "+46" + digits.slice(1);
  if (digits.startsWith("46")) return "+" + digits;
  if (digits.startsWith("7")) return "+46" + digits;
  return "+" + digits;
}

// POST /api/auth/send-otp
authRouter.post(
  "/send-otp",
  zValidator("json", z.object({ phone: z.string() })),
  async (c) => {
    const { phone } = c.req.valid("json");
    const normalizedPhone = normalizePhone(phone);

    // Rate limit: max 3 sends per 15 minutes
    if (!checkRateLimit(otpSendLimiter, normalizedPhone, OTP_SEND_LIMIT, OTP_SEND_WINDOW_MS)) {
      return c.json({ error: { message: "För många försök. Vänta 15 minuter.", code: "RATE_LIMITED" } }, 429);
    }

    // Invalidate old OTPs for this phone
    await db.otpCode.updateMany({
      where: { phone: normalizedPhone, used: false },
      data: { used: true },
    });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.otpCode.create({
      data: { phone: normalizedPhone, code, expiresAt },
    });

    // Send via Twilio if configured, otherwise log for dev
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
      try {
        const twilio = require("twilio");
        const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: `Din Reslot-kod är: ${code}`,
          from: env.TWILIO_PHONE_NUMBER,
          to: normalizedPhone,
        });
        console.log(`[AUTH] SMS sent to ${normalizedPhone}`);
      } catch (err) {
        console.error("[AUTH] Twilio error:", err);
        return c.json({ error: { message: "Could not send SMS", code: "SMS_ERROR" } }, 500);
      }
    } else {
      // Dev mode: log the OTP so developer can see it in LOGS tab
      console.log(`[AUTH DEV] OTP for ${normalizedPhone}: ${code}`);
    }

    return c.json({ data: { success: true, dev: !env.TWILIO_ACCOUNT_SID } });
  }
);

// POST /api/auth/direct-login
// Login directly with just phone number (no OTP required) — DEV ONLY
authRouter.post(
  "/direct-login",
  zValidator("json", z.object({ phone: z.string() })),
  async (c) => {
    // Block in production — this endpoint bypasses OTP verification
    if (env.NODE_ENV === "production") {
      return c.json({ error: { message: "Not available in production", code: "FORBIDDEN" } }, 403);
    }

    const { phone } = c.req.valid("json");
    const normalizedPhone = normalizePhone(phone);

    // Upsert user profile
    const profile = await db.userProfile.upsert({
      where: { phone: normalizedPhone },
      update: {},
      create: {
        phone: normalizedPhone,
        firstName: "",
        lastName: "",
        email: "",
        credits: 0,
      },
    });

    // Create session (expires in 90 days)
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await db.session.create({ data: { phone: normalizedPhone, token, expiresAt } });

    return c.json({ data: { token, user: profile } });
  }
);

// POST /api/auth/verify-otp
authRouter.post(
  "/verify-otp",
  zValidator(
    "json",
    z.object({
      phone: z.string(),
      code: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
    })
  ),
  async (c) => {
    const { phone, code, firstName, lastName, email } = c.req.valid("json");
    const normalizedPhone = normalizePhone(phone);

    // Rate limit: max 5 verify attempts per 15 minutes
    if (!checkRateLimit(otpVerifyLimiter, normalizedPhone, OTP_VERIFY_LIMIT, OTP_VERIFY_WINDOW_MS)) {
      return c.json({ error: { message: "För många försök. Vänta 15 minuter.", code: "RATE_LIMITED" } }, 429);
    }

    // Find valid OTP
    const otp = await db.otpCode.findFirst({
      where: {
        phone: normalizedPhone,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    // In dev mode (no Twilio, non-production), allow bypass code "000000"
    const isDevBypass = env.NODE_ENV !== "production" && !env.TWILIO_ACCOUNT_SID && code === "000000";

    if (!otp && !isDevBypass) {
      return c.json({ error: { message: "Invalid or expired code", code: "INVALID_OTP" } }, 400);
    }

    // Mark OTP as used (only if real OTP was used)
    if (otp) {
      await db.otpCode.update({ where: { id: otp.id }, data: { used: true } });
    }

    // Upsert user profile — mark phone as verified since OTP was validated
    const profile = await db.userProfile.upsert({
      where: { phone: normalizedPhone },
      update: {
        phoneVerified: true,
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(email ? { email } : {}),
      },
      create: {
        phone: normalizedPhone,
        firstName: firstName ?? "",
        lastName: lastName ?? "",
        email: email ?? "",
        phoneVerified: true,
        credits: 0,
      },
    });

    // Create session (expires in 90 days) — limit to max 5 sessions
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    await db.session.create({ data: { phone: normalizedPhone, token, expiresAt } });

    // Prune old sessions: keep only the 5 most recent
    const sessions = await db.session.findMany({
      where: { phone: normalizedPhone },
      orderBy: { createdAt: "desc" },
      skip: 5,
    });
    if (sessions.length > 0) {
      await db.session.deleteMany({
        where: { id: { in: sessions.map((s) => s.id) } },
      });
    }

    return c.json({ data: { token, user: profile } });
  }
);

// GET /api/auth/me
authRouter.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }
  const token = authHeader.slice(7);

  const session = await db.session.findUnique({
    where: { token },
  });

  if (!session || session.expiresAt < new Date()) {
    return c.json({ error: { message: "Session expired", code: "SESSION_EXPIRED" } }, 401);
  }

  const profile = await db.userProfile.findUnique({ where: { phone: session.phone } });
  if (!profile) {
    return c.json({ error: { message: "User not found", code: "NOT_FOUND" } }, 404);
  }

  return c.json({ data: profile });
});

// POST /api/auth/logout
authRouter.post("/logout", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    await db.session.deleteMany({ where: { token } });
  }
  return c.json({ data: { success: true } });
});

// --- Email verification rate limiter ---
const emailVerifySendLimiter = new Map<string, { count: number; resetAt: number }>();
const EMAIL_VERIFY_SEND_LIMIT = 3;
const EMAIL_VERIFY_SEND_WINDOW_MS = 15 * 60 * 1000;

// POST /api/auth/send-email-verification
authRouter.post(
  "/send-email-verification",
  zValidator("json", z.object({ email: z.string().email() })),
  async (c) => {
    // Require auth
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }
    const token = authHeader.slice(7);
    const session = await db.session.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }
    const phone = session.phone;

    const { email } = c.req.valid("json");

    // Rate limit: max 3 sends per 15 minutes per phone
    if (!checkRateLimit(emailVerifySendLimiter, phone, EMAIL_VERIFY_SEND_LIMIT, EMAIL_VERIFY_SEND_WINDOW_MS)) {
      return c.json({ error: { message: "För många försök. Vänta 15 minuter.", code: "RATE_LIMITED" } }, 429);
    }

    // Invalidate old unused codes for this phone
    await db.emailVerification.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.emailVerification.create({
      data: { phone, email, code, expiresAt },
    });

    // For now, log the code (no actual email sending)
    console.log(`[EMAIL VERIFY] Code for ${email} (phone: ${phone}): ${code}`);

    return c.json({ data: { success: true, message: "Verification code generated (check server logs)" } });
  }
);

// POST /api/auth/verify-email
authRouter.post(
  "/verify-email",
  zValidator("json", z.object({ email: z.string().email(), code: z.string() })),
  async (c) => {
    // Require auth
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }
    const token = authHeader.slice(7);
    const session = await db.session.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }
    const phone = session.phone;

    const { email, code } = c.req.valid("json");

    // Find valid verification code
    const verification = await db.emailVerification.findFirst({
      where: {
        phone,
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      return c.json({ error: { message: "Invalid or expired code", code: "INVALID_CODE" } }, 400);
    }

    // Mark code as used
    await db.emailVerification.update({
      where: { id: verification.id },
      data: { used: true },
    });

    // Update user profile: set emailVerified and email
    const profile = await db.userProfile.update({
      where: { phone },
      data: { emailVerified: true, email },
    });

    return c.json({ data: { success: true, emailVerified: true, user: profile } });
  }
);

export { authRouter };
