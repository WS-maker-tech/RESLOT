// Backend response types matching Prisma schema

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine: string;
  neighborhood: string;
  rating: number;
  reviewCount: number;
  priceLevel: number;
  image: string;
  description: string;
  tags: string;
  timesBookedOnReslot: number;
  seatType: string;
  instagram: string | null;
  website: string | null;
  vibeTags: string;
  goodForTags: string;
  foodTags: string;
  latitude: number | null;
  longitude: number | null;
  isExclusive: boolean;
  city: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  restaurantId: string;
  submitterPhone: string;
  submitterFirstName: string;
  submitterLastName: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  seatType: string;
  nameOnReservation: string;
  status: "active" | "claimed" | "grace_period" | "completed" | "expired" | "cancelled";
  claimerPhone: string | null;
  cancelFee: number | null;
  prepaidAmount: number | null;
  verificationLink: string | null;
  extraInfo: string | null;
  cancellationWindowHours: number | null;
  claimedAt: string | null;
  gracePeriodEndsAt: string | null;
  creditStatus: "none" | "pending" | "awarded" | "reverted";
  serviceFee: number;
  createdAt: string;
  updatedAt: string;
  restaurant: Restaurant;
}

export interface UserProfile {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  credits: number;
  selectedCity: string;
  dateOfBirth: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  referralCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityAlert {
  id: string;
  userPhone: string;
  type: "drop" | "claim" | "credit" | "premium";
  title: string;
  message: string;
  read: boolean;
  restaurantId: string | null;
  createdAt: string;
}

export interface RestaurantAlertWithRestaurant {
  id: string;
  userPhone: string;
  restaurantId: string;
  enabled: boolean;
  createdAt: string;
  restaurant: Restaurant;
}

export interface WatchFilterOptions {
  timeRange?: [string, string];
  weekdays?: number[];
  partySize?: number;
}

export interface Watch {
  id: string;
  userPhone: string;
  restaurantId: string | null;
  date: string | null;
  partySize: number | null;
  notes: string | null;
  filterOptions: string | null;
  createdAt: string;
  restaurant: Restaurant | null;
}

export function parseWatchFilters(json: string | null): WatchFilterOptions | null {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

export interface MissedReservation extends Reservation {
  timeToClaim: number | null;
}

export interface SavedRestaurant {
  id: string;
  userPhone: string;
  restaurantId: string;
  restaurant: Restaurant;
  createdAt: string;
}

export interface CardStatus {
  hasCard: boolean;
  cardLast4: string | null;
  cardBrand: string | null;
}

export interface CheckoutSessionResult {
  checkoutUrl: string | null;
  sessionId: string;
}

export interface CreditsPurchaseResult {
  checkoutUrl: string | null;
  sessionId?: string;
  amount: number;
  currency: string;
  // Dev mode fields
  success?: boolean;
  newBalance?: number;
}

export interface TagWithCount {
  label: string;
  count: number;
}

export function parseTags(jsonStr: string): string[] {
  try { return JSON.parse(jsonStr); } catch { return []; }
}

export function parseTagsWithCount(jsonStr: string): TagWithCount[] {
  try { return JSON.parse(jsonStr); } catch { return []; }
}
