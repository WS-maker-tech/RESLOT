import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { sendPushNotification } from "../push";

const profileRouter = new Hono<{ Variables: { userPhone: string } }>();

// GET /api/profile - Get user profile (create if doesn't exist)
profileRouter.get("/", async (c) => {
  const phone = c.get("userPhone");

  let profile = await db.userProfile.findUnique({
    where: { phone },
  });

  if (!profile) {
    profile = await db.userProfile.create({
      data: {
        phone,
        firstName: "",
        lastName: "",
        email: "",
      },
    });
  }

  return c.json({ data: profile });
});

// PUT /api/profile - Update profile
profileRouter.put(
  "/",
  zValidator(
    "json",
    z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
      avatar: z.string().optional(),
      selectedCity: z.string().optional(),
      dateOfBirth: z.string().optional(),
      // emailVerified and phoneVerified removed — users must not set verification status
    })
  ),
  async (c) => {
    const phone = c.get("userPhone");
    const updates = c.req.valid("json");

    // Remove undefined values
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        data[key] = value;
      }
    }

    const profile = await db.userProfile.upsert({
      where: { phone },
      update: data,
      create: {
        phone,
        firstName: updates.firstName ?? "",
        lastName: updates.lastName ?? "",
        email: updates.email ?? "",
        avatar: updates.avatar ?? null,
        selectedCity: updates.selectedCity ?? "Stockholm",
      },
    });

    return c.json({ data: profile });
  }
);

// POST /api/profile/push-token - Save push notification token
profileRouter.post(
  "/push-token",
  zValidator("json", z.object({ token: z.string().min(1) })),
  async (c) => {
    const phone = c.get("userPhone");
    const { token } = c.req.valid("json");

    await db.userProfile.upsert({
      where: { phone },
      update: { pushToken: token },
      create: {
        phone,
        firstName: "",
        lastName: "",
        email: "",
        pushToken: token,
      },
    });

    return c.json({ data: { success: true } });
  }
);

profileRouter.delete("/", async (c) => {
  const phone = c.get("userPhone");

  const profile = await db.userProfile.findUnique({ where: { phone } });
  if (!profile) {
    return c.json({ error: { message: "Anv\u00e4ndare ej hittad", code: "NOT_FOUND" } }, 404);
  }

  const anonymizedPhone = `deleted_${profile.id}_${Date.now()}`;
  const anonymizedEmail = `deleted_${profile.id}@reslot.se`;

  // Anonymize user profile (GDPR compliant)
  await db.userProfile.update({
    where: { phone },
    data: {
      phone: anonymizedPhone,
      firstName: "Raderad",
      lastName: "Anv\u00e4ndare",
      email: anonymizedEmail,
      avatar: null,
      dateOfBirth: null,
      credits: 0,
      referralCode: null,
      referralUsed: null,
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  // Delete all sessions
  await db.session.deleteMany({ where: { phone } });

  // Delete all OTP codes
  await db.otpCode.deleteMany({ where: { phone } });

  // Delete restaurant alerts
  await db.restaurantAlert.deleteMany({ where: { userPhone: phone } });

  // Delete watches
  await db.watch.deleteMany({ where: { userPhone: phone } });

  // Anonymize activity alerts (keep for audit but remove PII)
  await db.activityAlert.updateMany({
    where: { userPhone: phone },
    data: { userPhone: anonymizedPhone },
  });

  // Anonymize reservations (keep for audit trail)
  await db.reservation.updateMany({
    where: { submitterPhone: phone },
    data: { submitterPhone: anonymizedPhone, submitterFirstName: "Raderad", submitterLastName: "Anv\u00e4ndare" },
  });
  await db.reservation.updateMany({
    where: { claimerPhone: phone },
    data: { claimerPhone: anonymizedPhone },
  });

  return c.json({ data: { success: true } });
});

export { profileRouter };
