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
 * Create a PaymentIntent for pre-authorization (hold) at claim time.
 * Amount = serviceFee (29 SEK) in öre.
 * Uses customer for SCA/PSD2 compliance.
 */
export async function createClaimPreAuth(params: {
  amountSek: number;
  reservationId: string;
  claimerPhone: string;
  stripeCustomerId?: string | null;
}): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  const stripe = getStripe();
  if (!stripe) {
    console.log("[STRIPE DEV] Would create pre-auth:", params);
    return { clientSecret: "dev_secret", paymentIntentId: "dev_pi_" + Date.now() };
  }

  const pi = await stripe.paymentIntents.create({
    amount: params.amountSek * 100, // öre
    currency: "sek",
    capture_method: "manual", // pre-auth only, capture later
    ...(params.stripeCustomerId ? { customer: params.stripeCustomerId } : {}),
    metadata: {
      reservationId: params.reservationId,
      claimerPhone: params.claimerPhone,
      type: "claim_preauth",
    },
  });

  return {
    clientSecret: pi.client_secret!,
    paymentIntentId: pi.id,
  };
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
 * Create a PaymentIntent for a no-show fee (immediate capture).
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

  try {
    const pi = await stripe.paymentIntents.create({
      amount: params.amountSek * 100, // öre
      currency: "sek",
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      ...(params.stripeCustomerId ? { customer: params.stripeCustomerId } : {}),
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
 */
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

/**
 * Create an escrow payment that holds funds on the platform and transfers
 * to the restaurant's connected account upon fulfillment.
 */
export async function createEscrowPayment(
  _params: EscrowPaymentParams
): Promise<EscrowPaymentResult> {
  // When ready to implement, replace this with:
  //
  // const stripe = getStripe();
  // const pi = await stripe.paymentIntents.create({
  //   amount: params.amountSek * 100,
  //   currency: 'sek',
  //   capture_method: 'manual',
  //   customer: params.stripeCustomerId,
  //   transfer_data: {
  //     destination: params.restaurantConnectedAccountId,
  //   },
  //   metadata: {
  //     reservationId: params.reservationId,
  //     type: 'escrow_payment',
  //   },
  // });
  throw new Error("Escrow not yet implemented — requires Stripe Connect setup");
}

/**
 * Release escrowed funds to the restaurant after successful fulfillment.
 */
export async function releaseEscrow(
  _paymentIntentId: string
): Promise<boolean> {
  // When ready: capture the manual PaymentIntent to trigger transfer
  // await stripe.paymentIntents.capture(paymentIntentId);
  throw new Error("Escrow release not yet implemented — requires Stripe Connect setup");
}

/**
 * Refund escrowed funds to the claimer (e.g., confirmed no-show).
 */
export async function refundEscrow(
  _paymentIntentId: string
): Promise<boolean> {
  // When ready: cancel the uncaptured PaymentIntent
  // await stripe.paymentIntents.cancel(paymentIntentId);
  throw new Error("Escrow refund not yet implemented — requires Stripe Connect setup");
}

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
    amount: amountSek * 100, // öre
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
