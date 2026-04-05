import { db } from "../db";

export interface TrustFactors {
  completedClaims: number;
  noShows: number;
  cancellations: number;
  positiveFeedbacks: number;
  negativeFeedbacks: number;
  avgClaimSpeedMinutes: number | null;
  accountAgeDays: number;
}

export async function calculateTrustScore(phone: string): Promise<number> {
  const [reservations, feedbacks, profile] = await Promise.all([
    db.reservation.findMany({
      where: { submitterPhone: phone },
      select: { status: true, claimedAt: true, createdAt: true },
    }),
    db.reservationFeedback.findMany({
      where: {
        reservation: { submitterPhone: phone },
      },
      select: { worked: true },
    }),
    db.userProfile.findUnique({
      where: { phone },
      select: { createdAt: true },
    }),
  ]);

  const completedClaims = reservations.filter(r => r.status === "completed").length;
  const noShows = reservations.filter(r => r.status === "no_show").length;
  const cancellations = reservations.filter(r => r.status === "cancelled").length;
  const positiveFeedbacks = feedbacks.filter(f => f.worked).length;
  const negativeFeedbacks = feedbacks.filter(f => !f.worked).length;

  const accountAgeDays = profile
    ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Weighted scoring (0-5 scale)
  let score = 3.0; // Start neutral

  // Completed reservations boost (+0.1 each, max +1.0)
  score += Math.min(completedClaims * 0.1, 1.0);

  // Positive feedback boost (+0.15 each, max +0.75)
  score += Math.min(positiveFeedbacks * 0.15, 0.75);

  // Negative feedback penalty (-0.3 each)
  score -= negativeFeedbacks * 0.3;

  // No-show heavy penalty (-0.5 each)
  score -= noShows * 0.5;

  // Cancellation mild penalty (-0.1 each)
  score -= cancellations * 0.1;

  // Account age bonus (up to +0.25 after 30 days)
  score += Math.min(accountAgeDays / 120, 0.25);

  return Math.min(5.0, Math.max(1.0, Math.round(score * 10) / 10));
}

export type TrustLevel = "new" | "active" | "reliable" | "trusted";

export function getTrustLevel(score: number): TrustLevel {
  if (score >= 4.5) return "trusted";
  if (score >= 3.5) return "reliable";
  if (score >= 2.5) return "active";
  return "new";
}
