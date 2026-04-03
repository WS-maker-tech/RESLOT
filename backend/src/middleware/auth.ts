import { createMiddleware } from "hono/factory";
import { db } from "../db";

/**
 * Auth middleware: extracts Bearer token, validates session, sets userPhone on context.
 * Returns 401 if token is missing, invalid, or session is expired.
 */
export const authMiddleware = createMiddleware<{
  Variables: { userPhone: string };
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      401
    );
  }

  const token = authHeader.slice(7);

  const session = await db.session.findUnique({ where: { token } });

  if (!session) {
    return c.json(
      { error: { message: "Invalid session", code: "UNAUTHORIZED" } },
      401
    );
  }

  if (session.expiresAt < new Date()) {
    return c.json(
      { error: { message: "Session expired", code: "SESSION_EXPIRED" } },
      401
    );
  }

  // Token rotation: if session is older than 7 days, issue a new token
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const sessionAge = Date.now() - new Date(session.createdAt).getTime();
  if (sessionAge > sevenDaysMs) {
    // Generate new token
    const bytes = new Uint8Array(48);
    crypto.getRandomValues(bytes);
    const newToken = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 64);
    const newExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    await db.session.update({
      where: { token },
      data: { token: newToken, expiresAt: newExpiry, createdAt: new Date() },
    });

    // Set the new token in response header so client can update
    c.header("X-New-Token", newToken);
  }

  c.set("userPhone", session.phone);
  await next();
});
