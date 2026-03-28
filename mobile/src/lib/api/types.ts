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
  tags: string; // JSON string array
  timesBookedOnReslot: number;
  seatType: string;
  instagram: string | null;
  website: string | null;
  vibeTags: string; // JSON string array of {label, count}
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
  status: "active" | "claimed" | "expired" | "cancelled";
  claimerPhone: string | null;
  cancelFee: number | null;
  prepaidAmount: number | null;
  verificationLink: string | null;
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
  tokens: number;
  selectedCity: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityAlert {
  id: string;
  userPhone: string;
  type: "drop" | "claim" | "token" | "premium";
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

export interface TagWithCount {
  label: string;
  count: number;
}

// Helper to parse JSON string fields
export function parseTags(jsonStr: string): string[] {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return [];
  }
}

export function parseTagsWithCount(jsonStr: string): TagWithCount[] {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return [];
  }
}
