import Stripe from "stripe";
import { env } from "./env";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return stripeInstance;
}

/**
 * Get or create a Stripe Customer for SCA/PSD2 compliance.
 */
export async function getOrCreateStripeCustomer(params: {
  phone: string;
  email?: string;
  name?: string;
  existingCustomerId?: string | null;
}): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) {
    return "dev_cus_" + Date.now();
  }

  // Use existing customer if available
  if (params.existingCustomerId) {
    return params.existingCustomerId;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    phone: params.phone,
    email: params.email || undefined,
    name: params.name || undefined,
    metadata: { phone: params.phone },
  });

  return customer.id;
}

/**
 * Get the default payment method for a customer.
 * Returns null if no payment method is saved.
 */
export async function getDefaultPaymentMethod(
  customerId: string
): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return "dev_pm_" + Date.now();

  const methods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
    limit: 1,
  });

  return methods.data[0]?.id ?? null;
}

/**
 * Create a SetupIntent so the customer can save a card for future payments.
 * Returns clientSecret for the mobile app to confirm via Stripe Checkout.
 */
export async function createSetupIntent(
  customerId: string
): Promise<{ clientSecret: string; setupIntentId: string } | null> {
  const stripe = getStripe();
  if (!stripe) {
    return { clientSecret: "dev_seti_secret", setupIntentId: "dev_seti_" + Date.now() };
  }

  const si = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    metadata: { type: "card_setup" },
  });

  return {
    clientSecret: si.client_secret!,
    setupIntentId: si.id,
  };
}

/**
 * Create a Stripe Checkout Session for saving a card (setup mode).
 * Opens hosted page — handles SCA/3DS automatically.
 */
export async function createCardSetupCheckoutSession(params: {
  customerId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string } | null> {
  const stripe = getStripe();
  if (!stripe) {
    return { url: "https://checkout.stripe.com/dev", sessionId: "dev_cs_" + Date.now() };
  }

  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: "setup",
    payment_method_types: ["card"],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { type: "card_setup" },
  });

  return {
    url: session.url!,
    sessionId: session.id,
  };
}

/**
 * Create a Stripe Checkout Session for credits purchase.
 * Opens hosted page — handles SCA/3DS automatically.
 */
export async function createCreditsCheckoutSession(params: {
  quantity: number;
  phone: string;
  customerId?: string | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string } | null> {
  const stripe = getStripe();
  if (!stripe) {
    return { url: "https://checkout.stripe.com/dev", sessionId: "dev_cs_credits_" + Date.now() };
  }

  const amountSek = params.quantity * 39;

  const session = await stripe.checkout.sessions.create({
    ...(params.customerId ? { customer: params.customerId } : {}),
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "sek",
          product_data: {
            name: `${params.quantity} Reslot Credit${params.quantity > 1 ? "s" : ""}`,
            description: `Köp av ${params.quantity} credit${params.quantity > 1 ? "s" : ""} till Reslot`,
          },
          unit_amount: 3900, // 39 kr in öre
        },
        quantity: params.quantity,
      },
    ],
    metadata: {
      phone: params.phone,
      quantity: String(params.quantity),
      type: "credits_purchase",
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return {
    url: session.url!,
    sessionId: session.id,
  };
}

/**
 * Create a PaymentIntent for pre-authorization (hold) at claim time.
 * Amount = serviceFee (29 SEK) in ore.
 *
 * If the customer has a saved payment method, uses off_session confirmation
 * for seamless SCA-compliant pre-auth. Otherwise returns clientSecret for
 * client-side confirmation.
 */
export async function createClaimPreAuth(params: {
  amountSek: number;
  reservationId: string;
  claimerPhone: string;
  stripeCustomerId?: string | null;
}): Promise<{
  clientSecret: string;
  paymentIntentId: string;
  requiresAction: boolean;
} | null> {
  const stripe = getStripe();
  if (!stripe) {
    console.log("[STRIPE DEV] Would create pre-auth:", params);
    return { clientSecret: "dev_secret", paymentIntentId: "dev_pi_" + Date.now(), requiresAction: false };
  }

  // Try to use saved payment method for seamless off_session charge
  let paymentMethodId: string | null = null;
  if (params.stripeCustomerId) {
    paymentMethodId = await getDefaultPaymentMethod(params.stripeCustomerId);
  }

  try {
    const pi = await stripe.paymentIntents.create({
      amount: params.amountSek * 100, // ore
      currency: "sek",
      capture_method: "manual", // pre-auth only, capture later
      ...(params.stripeCustomerId ? { customer: params.stripeCustomerId } : {}),
      ...(paymentMethodId
        ? {
            payment_method: paymentMethodId,
            confirm: true,
            off_session: true,
          }
        : {
            automatic_payment_methods: { enabled: true },
          }),
      metadata: {
        reservationId: params.reservationId,
        claimerPhone: params.claimerPhone,
        type: "claim_preauth",
      },
    });

    return {
      clientSecret: pi.client_secret!,
      paymentIntentId: pi.id,
      requiresAction: pi.status === "requires_action",
    };
  } catch (err: unknown) {
    // SCA required — card needs additional authentication
    if (
      err instanceof Stripe.errors.StripeCardError &&
      err.code === "authentication_required"
    ) {
      const piId = (err as any).payment_intent?.id;
      if (piId) {
        const pi = await stripe.paymentIntents.retrieve(piId);
        return {
          clientSecret: pi.client_secret!,
          paymentIntentId: pi.id,
          requiresAction: true,
        };
      }
    }
    console.error("[STRIPE] Pre-auth creation error:", err);
    throw err;
  }
}

/**
 * Capture a previously authorized PaymentIntent (after grace period).
 */
export async function capturePayment(paymentIntentId: string): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe) {
    console.log("[STRIPE DEV] Would capture:", paymentIntentId);
    return true;
  }

  try {
    await stripe.paymentIntents.capture(paymentIntentId);
    return true;
  } catch (err) {
    console.error("[STRIPE] Capture error:", err);
    return false;
  }
}

/**
 * Cancel a pre-authorized PaymentIntent (if claim is cancelled during grace period).
 */
export async function cancelPreAuth(paymentIntentId: string): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe) {
    console.log("[STRIPE DEV] Would cancel pre-auth:", paymentIntentId);
    return true;
  }

  try {
    await stripe.paymentIntents.cancel(paymentIntentId);
    return true;
  } catch (err) {
    console.error("[STRIPE] Cancel pre-auth error:", err);
    return false;
  }
}

/**
 * Create a PaymentIntent for a no-show fee (off-session capture using saved card).
 */
export async function createNoShowFeeCharge(params: {
  amountSek: number;
  reservationId: string;
  claimerPhone: string;
  stripeCustomerId?: string | null;
}): Promise<{ paymentIntentId: string } | null> {
  const stripe = getStripe();
  if (!stripe) {
    console.log("[STRIPE DEV] Would create no-show fee charge:", params);
    return { paymentIntentId: "dev_pi_noshow_" + Date.now() };
  }

  // Get saved payment method for off-session charge
  let paymentMethodId: string | null = null;
  if (params.stripeCustomerId) {
    paymentMethodId = await getDefaultPaymentMethod(params.stripeCustomerId);
  }

  if (!paymentMethodId) {
    console.error("[STRIPE] No saved payment method for no-show fee, customer:", params.stripeCustomerId);
    return null;
  }

  try {
    const pi = await stripe.paymentIntents.create({
      amount: params.amountSek * 100, // ore
      currency: "sek",
      confirm: true,
      off_session: true,
      customer: params.stripeCustomerId!,
      payment_method: paymentMethodId,
      metadata: {
        reservationId: params.reservationId,
        claimerPhone: params.claimerPhone,
        type: "no_show_fee",
      },
    });
    return { paymentIntentId: pi.id };
  } catch (err) {
    console.error("[STRIPE] No-show fee charge error:", err);
    return null;
  }
}

/**
 * Create a PaymentIntent for credits purchase (immediate capture).
 * Kept for backward compatibility — prefer createCreditsCheckoutSession.
 */
export async function createCreditsPurchase(params: {
  quantity: number;
  phone: string;
}): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  const stripe = getStripe();
  const amountSek = params.quantity * 39;

  if (!stripe) {
    console.log("[STRIPE DEV] Would create credits purchase:", params);
    return { clientSecret: "dev_secret", paymentIntentId: "dev_pi_credits_" + Date.now() };
  }

  const pi = await stripe.paymentIntents.create({
    amount: amountSek * 100, // ore
    currency: "sek",
    metadata: {
      phone: params.phone,
      quantity: String(params.quantity),
      type: "credits_purchase",
    },
  });

  return {
    clientSecret: pi.client_secret!,
    paymentIntentId: pi.id,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCROW IMPLEMENTATION (Future — Stripe Connect)
// ─────────────────────────────────────────────────────────────────────────────
// When implemented:
// 1. Restaurants become Stripe Connected Accounts (Standard or Express)
//    - Onboarding via Stripe Account Links
//    - Each restaurant stores its `stripeConnectedAccountId` in the Restaurant model
// 2. Claims use PaymentIntents with `transfer_data` to route funds to
//    the restaurant's connected account
// 3. Funds are held in escrow (platform balance) until the reservation is fulfilled
// 4. Automatic payout to restaurant after the no-show reporting window passes
//    (typically 24h after reservation time)
// 5. If a no-show is confirmed, funds are returned to the claimer instead
//
// Required env vars:
//   STRIPE_CONNECT_CLIENT_ID — for OAuth-based onboarding
//
// Required schema changes:
//   Restaurant: add `stripeConnectedAccountId String?`
//   Reservation: add `escrowStatus String @default("none")`
//               values: none | held | released_to_restaurant | refunded
// ─────────────────────────────────────────────────────────────────────────────

export interface EscrowPaymentParams {
  amountSek: number;
  reservationId: string;
  claimerPhone: string;
  restaurantConnectedAccountId: string;
  stripeCustomerId?: string | null;
}

export interface EscrowPaymentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export async function createEscrowPayment(
  _params: EscrowPaymentParams
): Promise<EscrowPaymentResult> {
  throw new Error("Escrow not yet implemented — requires Stripe Connect setup");
}

export async function releaseEscrow(
  _paymentIntentId: string
): Promise<boolean> {
  throw new Error("Escrow release not yet implemented — requires Stripe Connect setup");
}

export async function refundEscrow(
  _paymentIntentId: string
): Promise<boolean> {
  throw new Error("Escrow refund not yet implemented — requires Stripe Connect setup");
}
