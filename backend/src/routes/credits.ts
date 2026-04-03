import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { createCreditsPurchase, getStripe } from "../stripe";
import { env } from "../env";
import { sendPushToUser } from "../push";

const creditsRouter = new Hono<{ Variables: { userPhone: string } }>();

// POST /purchase — initiate credits purchase via Stripe
creditsRouter.post(
  "/purchase",
  zValidator("json", z.object({
    quantity: z.number().min(1).max(100),
  })),
  async (c) => {
    const phone = c.get("userPhone");
    const { quantity } = c.req.valid("json");

    const profile = await db.userProfile.findUnique({ where: { phone } });
    if (!profile) {
      return c.json({ error: { message: "Användare ej hittad", code: "NOT_FOUND" } }, 404);
    }

    const result = await createCreditsPurchase({ quantity, phone });
    if (!result) {
      return c.json({ error: { message: "Betalning ej tillgänglig", code: "PAYMENT_UNAVAILABLE" } }, 503);
    }

    // In dev mode (no Stripe key, non-production), grant credits immediately for testing
    if (!env.STRIPE_SECRET_KEY) {
      if (env.NODE_ENV === "production") {
        return c.json({ error: { message: "Betalning ej konfigurerad", code: "PAYMENT_UNAVAILABLE" } }, 503);
      }

      const updated = await db.userProfile.update({
        where: { phone },
        data: { credits: { increment: quantity } },
      });

      await db.activityAlert.create({
        data: {
          userPhone: phone,
          type: "credit",
          title: `${quantity} credits köpta`,
          message: `Du har köpt ${quantity} Reslot credit${quantity > 1 ? "s" : ""} för ${quantity * 39} kr.`,
        },
      });

      // Push notification for credits purchased
      sendPushToUser(
        phone,
        `${quantity} credits köpta!`,
        `Du har köpt ${quantity} Reslot credit${quantity > 1 ? "s" : ""} för ${quantity * 39} kr.`,
        { type: "credits_purchased", quantity }
      ).catch(() => {});

      return c.json({ data: { success: true, newBalance: updated.credits, clientSecret: null } });
    }

    // In production: return clientSecret for mobile to confirm payment
    return c.json({
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        amount: quantity * 39,
        currency: "sek",
      },
    });
  }
);

// POST /webhook — Stripe webhook for credits purchase confirmation
creditsRouter.post("/webhook", async (c) => {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: { message: "Webhook ej konfigurerad", code: "NOT_CONFIGURED" } }, 503);
  }

  const sig = c.req.header("stripe-signature");
  if (!sig) {
    return c.json({ error: { message: "Missing signature", code: "BAD_REQUEST" } }, 400);
  }

  const rawBody = await c.req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Signature verification failed:", err);
    return c.json({ error: { message: "Invalid signature", code: "BAD_SIGNATURE" } }, 400);
  }

  // Idempotency check — prevent duplicate processing
  const existing = await db.processedEvent.findUnique({ where: { id: event.id } });
  if (existing) {
    console.log(`[STRIPE WEBHOOK] Already processed event ${event.id}, skipping`);
    return c.json({ received: true });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const { type, phone, quantity } = pi.metadata;

    if (type === "credits_purchase" && phone && quantity) {
      const qty = parseInt(quantity, 10);
      await db.userProfile.update({
        where: { phone },
        data: { credits: { increment: qty } },
      });

      await db.activityAlert.create({
        data: {
          userPhone: phone,
          type: "credit",
          title: `${qty} credits köpta`,
          message: `Du har köpt ${qty} Reslot credit${qty > 1 ? "s" : ""} för ${qty * 39} kr.`,
        },
      });

      // Push notification for credits purchased via Stripe
      sendPushToUser(
        phone,
        `${qty} credits köpta!`,
        `Du har köpt ${qty} Reslot credit${qty > 1 ? "s" : ""} för ${qty * 39} kr.`,
        { type: "credits_purchased", quantity: qty }
      ).catch(() => {});

      console.log(`[STRIPE WEBHOOK] Credits purchase: ${qty} credits for ${phone}`);
    }

    // Handle claim pre-auth capture success
    if (type === "claim_preauth") {
      const reservationId = pi.metadata.reservationId;
      if (reservationId) {
        await db.reservation.updateMany({
          where: { id: reservationId, stripePaymentIntentId: pi.id },
          data: { captureStatus: "captured" },
        });
        console.log(`[STRIPE WEBHOOK] Claim capture succeeded for reservation ${reservationId}`);
      }
    }
  }

  // Handle payment failures
  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object;
    const { type: metaType, claimerPhone, reservationId } = pi.metadata;

    if (metaType === "claim_preauth" && reservationId) {
      // Payment failed — revert the claim
      const reservation = await db.reservation.findUnique({ where: { id: reservationId } });
      if (reservation && (reservation.status === "grace_period" || reservation.status === "completed")) {
        await db.reservation.update({
          where: { id: reservationId },
          data: { status: "payment_failed", captureStatus: "failed", creditStatus: "reverted" },
        });
        // Refund credits to claimer
        if (claimerPhone) {
          await db.userProfile.update({
            where: { phone: claimerPhone },
            data: { credits: { increment: 2 } },
          });
        }
        // Alert both parties
        if (claimerPhone) {
          await db.activityAlert.create({
            data: {
              userPhone: claimerPhone,
              type: "claim",
              title: "Betalning misslyckades",
              message: "Betalningen för din övertagna bokning kunde inte genomföras. Dina credits har återbetalats.",
            },
          });
        }
        // Push notification for payment failure
        if (claimerPhone) {
          sendPushToUser(
            claimerPhone,
            "Betalning misslyckades",
            "Betalningen för din övertagna bokning kunde inte genomföras. Dina credits har återbetalats.",
            { type: "payment_failed", reservationId }
          ).catch(() => {});
        }

        console.log(`[STRIPE WEBHOOK] Payment failed for claim reservation ${reservationId}`);
      }
    }
  }

  // Mark event as processed
  await db.processedEvent.create({ data: { id: event.id, type: event.type } });

  return c.json({ received: true });
});

export { creditsRouter };
