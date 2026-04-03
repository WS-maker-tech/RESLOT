import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import {
  createCreditsPurchase,
  createCreditsCheckoutSession,
  createCardSetupCheckoutSession,
  createSetupIntent,
  getStripe,
  getOrCreateStripeCustomer,
  getDefaultPaymentMethod,
} from "../stripe";
import { env } from "../env";
import { sendPushToUser } from "../push";

const creditsRouter = new Hono<{ Variables: { userPhone: string } }>();

// POST /purchase — initiate credits purchase via Stripe Checkout Session
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

    // In dev mode (no Stripe key), grant credits immediately for testing
    if (!env.STRIPE_SECRET_KEY) {
      if (env.NODE_ENV === "production") {
        return c.json({ error: { message: "Stripe är inte konfigurerad. Kontakta support.", code: "PAYMENT_UNAVAILABLE" } }, 503);
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

      sendPushToUser(
        phone,
        `${quantity} credits köpta!`,
        `Du har köpt ${quantity} Reslot credit${quantity > 1 ? "s" : ""} för ${quantity * 39} kr.`,
        { type: "credits_purchased", quantity }
      ).catch(() => {});

      return c.json({ data: { success: true, newBalance: updated.credits, checkoutUrl: null } });
    }

    // Production: get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer({
      phone,
      email: profile.email || undefined,
      name: `${profile.firstName} ${profile.lastName}`.trim() || undefined,
      existingCustomerId: profile.stripeCustomerId,
    });

    // Persist stripeCustomerId if newly created
    if (customerId && !profile.stripeCustomerId) {
      await db.userProfile.update({
        where: { phone },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create Checkout Session — handles SCA/3DS automatically
    try {
      const session = await createCreditsCheckoutSession({
        quantity,
        phone,
        customerId,
        successUrl: `vibecode://credits?status=success&quantity=${quantity}`,
        cancelUrl: `vibecode://credits?status=cancelled`,
      });

      if (!session) {
        return c.json({ error: { message: "Kunde inte skapa betalningssession. Försök igen.", code: "CHECKOUT_FAILED" } }, 503);
      }

      return c.json({
        data: {
          checkoutUrl: session.url,
          sessionId: session.sessionId,
          amount: quantity * 39,
          currency: "sek",
        },
      });
    } catch (err) {
      console.error("[STRIPE] Checkout session creation error:", err);
      return c.json({ error: { message: "Betalningen kunde inte startas. Kontrollera dina kortuppgifter och försök igen.", code: "STRIPE_ERROR" } }, 500);
    }
  }
);

// POST /setup-card — create a Checkout Session for saving a card
creditsRouter.post("/setup-card", async (c) => {
  const phone = c.get("userPhone");

  if (!env.STRIPE_SECRET_KEY) {
    if (env.NODE_ENV === "production") {
      return c.json({ error: { message: "Stripe är inte konfigurerad. Kontakta support.", code: "PAYMENT_UNAVAILABLE" } }, 503);
    }
    return c.json({ data: { checkoutUrl: null, hasCard: true } });
  }

  const profile = await db.userProfile.findUnique({ where: { phone } });
  if (!profile) {
    return c.json({ error: { message: "Användare ej hittad", code: "NOT_FOUND" } }, 404);
  }

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer({
    phone,
    email: profile.email || undefined,
    name: `${profile.firstName} ${profile.lastName}`.trim() || undefined,
    existingCustomerId: profile.stripeCustomerId,
  });

  if (!customerId) {
    return c.json({ error: { message: "Kunde inte skapa kundprofil hos Stripe. Försök igen.", code: "CUSTOMER_FAILED" } }, 500);
  }

  // Persist stripeCustomerId if newly created
  if (!profile.stripeCustomerId) {
    await db.userProfile.update({
      where: { phone },
      data: { stripeCustomerId: customerId },
    });
  }

  try {
    const session = await createCardSetupCheckoutSession({
      customerId,
      successUrl: `vibecode://payment?status=card_saved`,
      cancelUrl: `vibecode://payment?status=cancelled`,
    });

    if (!session) {
      return c.json({ error: { message: "Kunde inte öppna kortinställningar. Försök igen.", code: "SETUP_FAILED" } }, 503);
    }

    return c.json({
      data: {
        checkoutUrl: session.url,
        sessionId: session.sessionId,
      },
    });
  } catch (err) {
    console.error("[STRIPE] Card setup session error:", err);
    return c.json({ error: { message: "Kunde inte starta kortregistrering. Försök igen senare.", code: "STRIPE_ERROR" } }, 500);
  }
});

// GET /card-status — check if user has a saved payment method
creditsRouter.get("/card-status", async (c) => {
  const phone = c.get("userPhone");

  if (!env.STRIPE_SECRET_KEY) {
    return c.json({ data: { hasCard: false, cardLast4: null, cardBrand: null } });
  }

  const profile = await db.userProfile.findUnique({ where: { phone } });
  if (!profile?.stripeCustomerId) {
    return c.json({ data: { hasCard: false, cardLast4: null, cardBrand: null } });
  }

  try {
    const stripe = getStripe()!;
    const methods = await stripe.paymentMethods.list({
      customer: profile.stripeCustomerId,
      type: "card",
      limit: 1,
    });

    const card = methods.data[0];
    return c.json({
      data: {
        hasCard: !!card,
        cardLast4: card?.card?.last4 ?? null,
        cardBrand: card?.card?.brand ?? null,
      },
    });
  } catch (err) {
    console.error("[STRIPE] Card status check error:", err);
    return c.json({ data: { hasCard: false, cardLast4: null, cardBrand: null } });
  }
});

// POST /webhook — Stripe webhook for payment events
creditsRouter.post("/webhook", async (c) => {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: { message: "Webhook ej konfigurerad", code: "NOT_CONFIGURED" } }, 503);
  }

  const sig = c.req.header("stripe-signature");
  if (!sig) {
    return c.json({ error: { message: "Saknar stripe-signature header", code: "BAD_REQUEST" } }, 400);
  }

  const rawBody = await c.req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Signaturverifiering misslyckades:", err);
    return c.json({ error: { message: "Ogiltig signatur", code: "BAD_SIGNATURE" } }, 400);
  }

  // Idempotency check — prevent duplicate processing
  const existing = await db.processedEvent.findUnique({ where: { id: event.id } });
  if (existing) {
    console.log(`[STRIPE WEBHOOK] Redan hanterat event ${event.id}, hoppar över`);
    return c.json({ received: true });
  }

  try {
    // Handle Checkout Session completed (credits purchase via Checkout)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { type, phone, quantity } = session.metadata ?? {};

      if (type === "credits_purchase" && phone && quantity) {
        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty < 1) {
          console.error(`[STRIPE WEBHOOK] Ogiltigt antal credits i metadata: ${quantity}`);
        } else {
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

          sendPushToUser(
            phone,
            `${qty} credits köpta!`,
            `Du har köpt ${qty} Reslot credit${qty > 1 ? "s" : ""} för ${qty * 39} kr.`,
            { type: "credits_purchased", quantity: qty }
          ).catch(() => {});

          console.log(`[STRIPE WEBHOOK] Checkout credits: ${qty} credits för ${phone}`);
        }
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const { type, phone, quantity } = pi.metadata;

      // Handle direct PaymentIntent credits purchase (legacy flow)
      if (type === "credits_purchase" && phone && quantity) {
        const qty = parseInt(quantity, 10);
        if (!isNaN(qty) && qty >= 1) {
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

          sendPushToUser(
            phone,
            `${qty} credits köpta!`,
            `Du har köpt ${qty} Reslot credit${qty > 1 ? "s" : ""} för ${qty * 39} kr.`,
            { type: "credits_purchased", quantity: qty }
          ).catch(() => {});

          console.log(`[STRIPE WEBHOOK] Credits purchase: ${qty} credits för ${phone}`);
        }
      }

      // Handle claim pre-auth capture success
      if (type === "claim_preauth") {
        const reservationId = pi.metadata.reservationId;
        if (reservationId) {
          await db.reservation.updateMany({
            where: { id: reservationId, stripePaymentIntentId: pi.id },
            data: { captureStatus: "captured" },
          });
          console.log(`[STRIPE WEBHOOK] Claim capture lyckades för reservation ${reservationId}`);
        }
      }
    }

    // Handle payment failures
    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object;
      const { type: metaType, claimerPhone, reservationId } = pi.metadata;
      const failureMessage = pi.last_payment_error?.message ?? "Okänt fel";

      if (metaType === "claim_preauth" && reservationId) {
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
            await db.activityAlert.create({
              data: {
                userPhone: claimerPhone,
                type: "claim",
                title: "Betalning misslyckades",
                message: `Betalningen kunde inte genomföras: ${failureMessage}. Dina credits har återbetalats.`,
              },
            });
            sendPushToUser(
              claimerPhone,
              "Betalning misslyckades",
              `Betalningen kunde inte genomföras: ${failureMessage}. Dina credits har återbetalats.`,
              { type: "payment_failed", reservationId }
            ).catch(() => {});
          }

          console.log(`[STRIPE WEBHOOK] Betalning misslyckades för claim reservation ${reservationId}: ${failureMessage}`);
        }
      }

      if (metaType === "credits_purchase") {
        const phone = pi.metadata.phone;
        if (phone) {
          await db.activityAlert.create({
            data: {
              userPhone: phone,
              type: "credit",
              title: "Köp misslyckades",
              message: `Ditt creditköp kunde inte genomföras: ${failureMessage}. Kontrollera dina kortuppgifter och försök igen.`,
            },
          });
          sendPushToUser(
            phone,
            "Köp misslyckades",
            `Ditt creditköp kunde inte genomföras. Kontrollera dina kortuppgifter och försök igen.`,
            { type: "purchase_failed" }
          ).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Fel vid hantering av event:", err);
    // Still mark as processed to avoid infinite retries on broken data
  }

  // Mark event as processed
  await db.processedEvent.create({ data: { id: event.id, type: event.type } });

  return c.json({ received: true });
});

export { creditsRouter };
