import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { supabaseAdmin } from "../lib/supabase";

const authRouter = new Hono();

// Helper: normalize Swedish phone numbers
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "+46" + digits.slice(1);
  if (digits.startsWith("46")) return "+" + digits;
  if (digits.startsWith("7")) return "+46" + digits;
  return "+" + digits;
}

// GET /api/auth/me — returns authenticated user profile using Supabase JWT
authRouter.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }
  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user || !user.phone) {
    return c.json({ error: { message: "Invalid or expired token", code: "UNAUTHORIZED" } }, 401);
  }

  let profile = await db.userProfile.findUnique({ where: { phone: user.phone } });
  if (!profile) {
    profile = await db.userProfile.create({
      data: {
        phone: user.phone,
        firstName: "",
        lastName: "",
        email: user.email ?? "",
        phoneVerified: true,
        credits: 0,
      },
    });
  }

  return c.json({ data: profile });
});

// POST /api/auth/logout — signs out of Supabase
authRouter.post("/logout", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    // Get user to find their sessions
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user) {
      await supabaseAdmin.auth.admin.signOut(user.id);
    }
    // Also clean up any legacy sessions
    await db.session.deleteMany({ where: { token } }).catch(() => {});
  }
  return c.json({ data: { success: true } });
});

// --- Email verification (still uses backend DB, requires Supabase JWT auth) ---
const emailVerifySendLimiter = new Map<string, { count: number; resetAt: number }>();
const EMAIL_VERIFY_SEND_LIMIT = 3;
const EMAIL_VERIFY_SEND_WINDOW_MS = 15 * 60 * 1000;

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

function generateOtp(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return (100000 + (bytes[0]! % 900000)).toString();
}

async function getPhoneFromToken(c: any): Promise<string | null> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user || !user.phone) return null;
  return user.phone;
}

// POST /api/auth/send-email-verification
authRouter.post(
  "/send-email-verification",
  zValidator("json", z.object({ email: z.string().email() })),
  async (c) => {
    const phone = await getPhoneFromToken(c);
    if (!phone) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const { email } = c.req.valid("json");

    if (!checkRateLimit(emailVerifySendLimiter, phone, EMAIL_VERIFY_SEND_LIMIT, EMAIL_VERIFY_SEND_WINDOW_MS)) {
      return c.json({ error: { message: "För många försök. Vänta 15 minuter.", code: "RATE_LIMITED" } }, 429);
    }

    await db.emailVerification.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.emailVerification.create({
      data: { phone, email, code, expiresAt },
    });

    console.log(`[EMAIL VERIFY] Code for ${email} (phone: ${phone}): ${code}`);

    return c.json({ data: { success: true, message: "Verification code generated (check server logs)" } });
  }
);

// POST /api/auth/verify-email
authRouter.post(
  "/verify-email",
  zValidator("json", z.object({ email: z.string().email(), code: z.string() })),
  async (c) => {
    const phone = await getPhoneFromToken(c);
    if (!phone) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const { email, code } = c.req.valid("json");

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

    await db.emailVerification.update({
      where: { id: verification.id },
      data: { used: true },
    });

    const profile = await db.userProfile.update({
      where: { phone },
      data: { emailVerified: true, email },
    });

    return c.json({ data: { success: true, emailVerified: true, user: profile } });
  }
);

export { authRouter };
