import { createMiddleware } from "hono/factory";
import { supabaseAdmin } from "../lib/supabase";
import { db } from "../db";

/**
 * Auth middleware: verifies Supabase JWT, extracts phone, sets userPhone on context.
 * Also ensures a UserProfile exists for the authenticated user.
 */
export const authMiddleware = createMiddleware<{
  Variables: { userPhone: string; supabaseUserId: string };
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      401
    );
  }

  const token = authHeader.slice(7);

  // Verify the Supabase JWT and get the user
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return c.json(
      { error: { message: "Invalid or expired token", code: "UNAUTHORIZED" } },
      401
    );
  }

  const phone = user.phone;
  if (!phone) {
    return c.json(
      { error: { message: "No phone number on account", code: "UNAUTHORIZED" } },
      401
    );
  }

  // Ensure UserProfile exists (auto-create on first authenticated request)
  const existing = await db.userProfile.findUnique({ where: { phone } });
  if (!existing) {
    await db.userProfile.create({
      data: {
        phone,
        firstName: "",
        lastName: "",
        email: user.email ?? "",
        phoneVerified: true,
        credits: 0,
      },
    });
  }

  c.set("userPhone", phone);
  c.set("supabaseUserId", user.id);
  await next();
});
