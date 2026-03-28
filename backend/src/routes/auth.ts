import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { env } from "../env";

const authRouter = new Hono();

// Helper: generate 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: generate session token
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
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
// Login directly with just phone number (no OTP required)
authRouter.post(
  "/direct-login",
  zValidator("json", z.object({ phone: z.string() })),
  async (c) => {
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
        tokens: 0,
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

    // Find valid OTP
    const otp = await db.otpCode.findFirst({
      where: {
        phone: normalizedPhone,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    // In dev mode (no Twilio), allow bypass code "000000"
    const isDevBypass = !env.TWILIO_ACCOUNT_SID && code === "000000";

    if (!otp && !isDevBypass) {
      return c.json({ error: { message: "Invalid or expired code", code: "INVALID_OTP" } }, 400);
    }

    // Mark OTP as used (only if real OTP was used)
    if (otp) {
      await db.otpCode.update({ where: { id: otp.id }, data: { used: true } });
    }

    // Upsert user profile
    const profile = await db.userProfile.upsert({
      where: { phone: normalizedPhone },
      update: {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(email ? { email } : {}),
      },
      create: {
        phone: normalizedPhone,
        firstName: firstName ?? "",
        lastName: lastName ?? "",
        email: email ?? "",
        tokens: 0,
      },
    });

    // Create session (expires in 90 days)
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    await db.session.create({ data: { phone: normalizedPhone, token, expiresAt } });

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

export { authRouter };
