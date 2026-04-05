import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { db } from "../db";

const referralRouter = new Hono<{ Variables: { userPhone: string } }>();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

referralRouter.get("/code", async (c) => {
  const phone = c.get("userPhone");

  let profile = await db.userProfile.findUnique({ where: { phone } });
  if (!profile) return c.json({ error: { message: "Anv\u00e4ndare ej hittad", code: "NOT_FOUND" } }, 404);

  if (!profile.referralCode) {
    let tries = 0;
    while (tries < 10) {
      const code = generateCode();
      try {
        profile = await db.userProfile.update({
          where: { phone },
          data: { referralCode: code },
        });
        break;
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("Unique constraint")) {
          tries++;
          if (tries >= 10) {
            return c.json({ error: { message: "Kunde inte generera kod, försök igen", code: "RETRY" } }, 500);
          }
          continue;
        }
        throw e;
      }
    }
  }

  return c.json({ data: { referralCode: profile.referralCode } });
});

referralRouter.post(
  "/use",
  zValidator("json", z.object({
    referralCode: z.string(),
  })),
  async (c) => {
    const phone = c.get("userPhone");
    const { referralCode } = c.req.valid("json");

    const newUser = await db.userProfile.findUnique({ where: { phone } });
    if (!newUser) return c.json({ error: { message: "Anv\u00e4ndare ej hittad", code: "NOT_FOUND" } }, 404);

    if (newUser.referralUsed) {
      return c.json({ error: { message: "Referralkod redan anv\u00e4nd", code: "ALREADY_USED" } }, 400);
    }

    const referrer = await db.userProfile.findFirst({ where: { referralCode } });
    if (!referrer) return c.json({ error: { message: "Ogiltig referralkod", code: "INVALID_CODE" } }, 404);

    // Anti-abuse: block deleted accounts and self-referrals
    if (referrer.isDeleted) {
      return c.json({ error: { message: "Ogiltig referralkod", code: "INVALID_CODE" } }, 404);
    }
    if (newUser.isDeleted) {
      return c.json({ error: { message: "Kontot har raderats", code: "ACCOUNT_DELETED" } }, 403);
    }
    if (referrer.phone === phone) {
      return c.json({ error: { message: "Kan inte anv\u00e4nda din egen kod", code: "SELF_REFERRAL" } }, 400);
    }

    await db.userProfile.update({ where: { phone: referrer.phone }, data: { credits: { increment: 1 } } });
    await db.userProfile.update({ where: { phone }, data: { credits: { increment: 1 }, referralUsed: referralCode } });

    await db.activityAlert.create({
      data: {
        userPhone: referrer.phone,
        type: "credit",
        title: "Din v\u00e4n registrerade sig!",
        message: "Du fick 1 Reslot credit f\u00f6r att din v\u00e4n registrerade sig med din kod.",
      },
    });
    await db.activityAlert.create({
      data: {
        userPhone: phone,
        type: "credit",
        title: "V\u00e4lkommen bonus!",
        message: "Du fick 1 Reslot credit som v\u00e4lkomstbonus.",
      },
    });

    return c.json({ data: { success: true } });
  }
);

export { referralRouter };
