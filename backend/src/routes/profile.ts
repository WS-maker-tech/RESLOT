import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";

const profileRouter = new Hono();

// GET /api/profile - Get user profile (create if doesn't exist)
profileRouter.get(
  "/",
  zValidator(
    "query",
    z.object({
      phone: z.string(),
    })
  ),
  async (c) => {
    const { phone } = c.req.valid("query");

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
  }
);

// PUT /api/profile - Update profile
profileRouter.put(
  "/",
  zValidator(
    "json",
    z.object({
      phone: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
      avatar: z.string().optional(),
      selectedCity: z.string().optional(),
    })
  ),
  async (c) => {
    const { phone, ...updates } = c.req.valid("json");

    // Remove undefined values
    const data: Record<string, string> = {};
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

export { profileRouter };
