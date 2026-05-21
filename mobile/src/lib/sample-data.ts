/**
 * SAMPLE DATA – Endast för test och UX-utvärdering.
 * Ta bort eller sätt SHOW_SAMPLE_DATA = false för att dölja.
 *
 * Exempeldata visas enbart när riktig data saknas (tom array från API).
 */

import type { Reservation, ActivityAlert, RestaurantAlertWithRestaurant, Watch } from "@/lib/api/types";

export const SHOW_SAMPLE_DATA = true;

// ─── Exempelrestauranger ────────────────────────────────────────────────────

const SAMPLE_RESTAURANTS = {
  gastrologik: {
    id: "sample-r1",
    name: "Gastrologik",
    address: "Artillerigatan 14, Stockholm",
    cuisine: "Nordiskt",
    neighborhood: "Östermalm",
    rating: 4.9,
    reviewCount: 342,
    priceLevel: 4,
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
    description: "Säsongsbaserad nordisk fine dining i Östermalmsstil.",
    tags: ["Fine dining", "Säsongsbetonat", "Vegetarienvänligt"],
    timesBookedOnReslot: 18,
    seatType: "Inne",
    instagram: null,
    website: null,
    vibeTags: [],
    goodForTags: [],
    foodTags: [],
    latitude: 59.336,
    longitude: 18.077,
    isExclusive: false,
    city: "Stockholm",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  shibumi: {
    id: "sample-r2",
    name: "Shibumi",
    address: "Kungsgatan 23, Stockholm",
    cuisine: "Japanskt",
    neighborhood: "Norrmalm",
    rating: 4.7,
    reviewCount: 215,
    priceLevel: 3,
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&q=80",
    description: "Omakase och japansk precisionskök mitt i city.",
    tags: ["Omakase", "Sushi", "Date night"],
    timesBookedOnReslot: 11,
    seatType: "Inne",
    instagram: null,
    website: null,
    vibeTags: [],
    goodForTags: [],
    foodTags: [],
    latitude: 59.334,
    longitude: 18.063,
    isExclusive: false,
    city: "Stockholm",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  leMoule: {
    id: "sample-r3",
    name: "Le Moule",
    address: "Nybrogatan 8, Stockholm",
    cuisine: "Franskt",
    neighborhood: "Östermalm",
    rating: 4.6,
    reviewCount: 178,
    priceLevel: 3,
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80",
    description: "Klassisk parisisk bistro med svenska råvaror.",
    tags: ["Bistro", "Vin", "Romantiskt"],
    timesBookedOnReslot: 9,
    seatType: "Inne",
    instagram: null,
    website: null,
    vibeTags: [],
    goodForTags: [],
    foodTags: [],
    latitude: 59.335,
    longitude: 18.08,
    isExclusive: false,
    city: "Stockholm",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  trattoriaRoma: {
    id: "sample-r4",
    name: "Trattoria Roma",
    address: "Hornsgatan 56, Stockholm",
    cuisine: "Italienskt",
    neighborhood: "Södermalm",
    rating: 4.5,
    reviewCount: 291,
    priceLevel: 2,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
    description: "Familjedriven italiensk trattoria sedan 1998.",
    tags: ["Pasta", "Pizza", "Familj"],
    timesBookedOnReslot: 23,
    seatType: "Inne",
    instagram: null,
    website: null,
    vibeTags: [],
    goodForTags: [],
    foodTags: [],
    latitude: 59.317,
    longitude: 18.055,
    isExclusive: false,
    city: "Stockholm",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  pelikan: {
    id: "sample-r5",
    name: "Pelikan",
    address: "Blekingegatan 40, Stockholm",
    cuisine: "Husmanskost",
    neighborhood: "Södermalm",
    rating: 4.4,
    reviewCount: 512,
    priceLevel: 2,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
    description: "Stockholmsk klassikerrestaurang med äkta husmanskost.",
    tags: ["Husmans", "Klassiker", "Öl"],
    timesBookedOnReslot: 31,
    seatType: "Inne",
    instagram: null,
    website: null,
    vibeTags: [],
    goodForTags: [],
    foodTags: [],
    latitude: 59.314,
    longitude: 18.073,
    isExclusive: false,
    city: "Stockholm",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
};

// ─── Exempelbokningar (upplagda) ────────────────────────────────────────────

export const SAMPLE_SUBMITTED_RESERVATIONS: Reservation[] = [
  {
    id: "sample-sub-1",
    restaurantId: "sample-r1",
    submitterPhone: "__sample__",
    submitterFirstName: "Anna",
    submitterLastName: "Lindgren",
    reservationDate: "2025-09-12",
    reservationTime: "19:30:00",
    partySize: 2,
    seatType: "Inne",
    nameOnReservation: "Lindgren",
    status: "active",
    claimerPhone: null,
    cancelFee: null,
    prepaidAmount: null,
    verificationLink: null,
    extraInfo: "Fönsterbord önskas",
    cancellationWindowHours: 24,
    claimedAt: null,
    gracePeriodEndsAt: null,
    creditStatus: "none",
    serviceFee: 0,
    createdAt: "2025-09-01T10:00:00Z",
    updatedAt: "2025-09-01T10:00:00Z",
    restaurant: SAMPLE_RESTAURANTS.gastrologik,
  },
  {
    id: "sample-sub-2",
    restaurantId: "sample-r3",
    submitterPhone: "__sample__",
    submitterFirstName: "Anna",
    submitterLastName: "Lindgren",
    reservationDate: "2025-09-18",
    reservationTime: "18:00:00",
    partySize: 4,
    seatType: "Inne",
    nameOnReservation: "Lindgren",
    status: "claimed",
    claimerPhone: "+46701234567",
    cancelFee: null,
    prepaidAmount: null,
    verificationLink: null,
    extraInfo: null,
    cancellationWindowHours: 12,
    claimedAt: "2025-09-05T14:22:00Z",
    gracePeriodEndsAt: null,
    creditStatus: "awarded",
    serviceFee: 0,
    createdAt: "2025-09-02T08:00:00Z",
    updatedAt: "2025-09-05T14:22:00Z",
    restaurant: SAMPLE_RESTAURANTS.leMoule,
  },
  {
    id: "sample-sub-3",
    restaurantId: "sample-r4",
    submitterPhone: "__sample__",
    submitterFirstName: "Anna",
    submitterLastName: "Lindgren",
    reservationDate: "2025-09-05",
    reservationTime: "20:00:00",
    partySize: 3,
    seatType: "Inne",
    nameOnReservation: "Lindgren",
    status: "completed",
    claimerPhone: "+46709876543",
    cancelFee: null,
    prepaidAmount: null,
    verificationLink: null,
    extraInfo: null,
    cancellationWindowHours: 6,
    claimedAt: "2025-08-30T09:00:00Z",
    gracePeriodEndsAt: null,
    creditStatus: "awarded",
    serviceFee: 0,
    createdAt: "2025-08-28T12:00:00Z",
    updatedAt: "2025-09-05T20:30:00Z",
    restaurant: SAMPLE_RESTAURANTS.trattoriaRoma,
  },
];

// ─── Exempelbokningar (övertagna) ────────────────────────────────────────────

export const SAMPLE_CLAIMED_RESERVATIONS: Reservation[] = [
  {
    id: "sample-cl-1",
    restaurantId: "sample-r2",
    submitterPhone: "+46709999111",
    submitterFirstName: "Erik",
    submitterLastName: "Svensson",
    reservationDate: "2025-09-20",
    reservationTime: "19:00:00",
    partySize: 2,
    seatType: "Inne",
    nameOnReservation: "Svensson",
    status: "claimed",
    claimerPhone: "__sample__",
    cancelFee: null,
    prepaidAmount: null,
    verificationLink: null,
    extraInfo: null,
    cancellationWindowHours: 24,
    claimedAt: "2025-09-06T11:00:00Z",
    gracePeriodEndsAt: null,
    creditStatus: "none",
    serviceFee: 0,
    createdAt: "2025-09-04T09:00:00Z",
    updatedAt: "2025-09-06T11:00:00Z",
    restaurant: SAMPLE_RESTAURANTS.shibumi,
  },
  {
    id: "sample-cl-2",
    restaurantId: "sample-r5",
    submitterPhone: "+46702223344",
    submitterFirstName: "Maria",
    submitterLastName: "Bergström",
    reservationDate: "2025-09-03",
    reservationTime: "17:30:00",
    partySize: 5,
    seatType: "Inne",
    nameOnReservation: "Bergström",
    status: "completed",
    claimerPhone: "__sample__",
    cancelFee: null,
    prepaidAmount: null,
    verificationLink: null,
    extraInfo: "Födelsedag – extra stolar kan behövas",
    cancellationWindowHours: 12,
    claimedAt: "2025-08-29T16:40:00Z",
    gracePeriodEndsAt: null,
    creditStatus: "awarded",
    serviceFee: 0,
    createdAt: "2025-08-27T14:00:00Z",
    updatedAt: "2025-09-03T18:00:00Z",
    restaurant: SAMPLE_RESTAURANTS.pelikan,
    feedback: {
      id: "sample-fb-1",
      worked: true,
      comment: "Fungerade perfekt, stämningen var fantastisk!",
      createdAt: "2025-09-03T21:00:00Z",
    },
  },
];

export const SAMPLE_ALL_RESERVATIONS: Reservation[] = [
  ...SAMPLE_SUBMITTED_RESERVATIONS,
  ...SAMPLE_CLAIMED_RESERVATIONS,
];

// ─── Exempelaktivitetsnotiser ────────────────────────────────────────────────

export const SAMPLE_ACTIVITY_ALERTS: ActivityAlert[] = [
  {
    id: "sample-act-1",
    userPhone: "__sample__",
    type: "claim",
    title: "Ditt bord är övertaget! 🎉",
    message: "Någon tog över din bokning på Le Moule den 18 sep. Du har fått +2 credits.",
    read: false,
    restaurantId: "sample-r3",
    createdAt: "2025-09-05T14:22:00Z",
  },
  {
    id: "sample-act-2",
    userPhone: "__sample__",
    type: "credit",
    title: "+2 credits",
    message: "Du fick credits för att du lade upp ett bord på Trattoria Roma. Tack!",
    read: true,
    restaurantId: "sample-r4",
    createdAt: "2025-08-30T09:10:00Z",
  },
  {
    id: "sample-act-3",
    userPhone: "__sample__",
    type: "drop",
    title: "Nytt bord hos Gastrologik",
    message: "Ett bord för 2 den 12 sep kl 19:30 är tillgängligt. Agera snabbt!",
    read: true,
    restaurantId: "sample-r1",
    createdAt: "2025-09-01T08:55:00Z",
  },
];

// ─── Exempelrestaurangbevakningar ────────────────────────────────────────────

export const SAMPLE_RESTAURANT_ALERTS: RestaurantAlertWithRestaurant[] = [
  {
    id: "sample-ra-1",
    userPhone: "__sample__",
    restaurantId: "sample-r1",
    enabled: true,
    createdAt: "2025-08-15T10:00:00Z",
    restaurant: SAMPLE_RESTAURANTS.gastrologik,
  },
  {
    id: "sample-ra-2",
    userPhone: "__sample__",
    restaurantId: "sample-r2",
    enabled: true,
    createdAt: "2025-08-20T12:30:00Z",
    restaurant: SAMPLE_RESTAURANTS.shibumi,
  },
  {
    id: "sample-ra-3",
    userPhone: "__sample__",
    restaurantId: "sample-r5",
    enabled: true,
    createdAt: "2025-08-25T09:00:00Z",
    restaurant: SAMPLE_RESTAURANTS.pelikan,
  },
];

// ─── Exempelbevakningar (watches) ────────────────────────────────────────────

export const SAMPLE_WATCHES: Watch[] = [
  {
    id: "sample-w1",
    userPhone: "__sample__",
    restaurantId: "sample-r1",
    date: "2025-09-27",
    partySize: 2,
    notes: "Helst fönsterbord",
    filterOptions: JSON.stringify({ timeRange: ["18:00", "21:00"], weekdays: [5, 6], partySize: 2 }),
    createdAt: "2025-09-01T08:00:00Z",
    restaurant: SAMPLE_RESTAURANTS.gastrologik,
  },
  {
    id: "sample-w2",
    userPhone: "__sample__",
    restaurantId: "sample-r2",
    date: "2025-10-04",
    partySize: 2,
    notes: null,
    filterOptions: JSON.stringify({ timeRange: ["19:00", "22:00"], weekdays: [5], partySize: 2 }),
    createdAt: "2025-09-02T10:00:00Z",
    restaurant: SAMPLE_RESTAURANTS.shibumi,
  },
  {
    id: "sample-w3",
    userPhone: "__sample__",
    restaurantId: null,
    date: null,
    partySize: 4,
    notes: "Söker bord för 4 på lördag",
    filterOptions: JSON.stringify({ timeRange: ["17:00", "20:00"], weekdays: [6], partySize: 4 }),
    createdAt: "2025-09-03T14:00:00Z",
    restaurant: null,
  },
];

// ─── Merge-helpers ────────────────────────────────────────────────────────────
// Injicerar exempeldata om riktig data är tom (tom array).

export function withSampleReservations(
  real: Reservation[],
  phone: string | null | undefined
): Reservation[] {
  if (!SHOW_SAMPLE_DATA) return real;
  if (real.length > 0) return real;
  const p = phone || "__sample__";
  // Ersätt placeholder-phone med inloggad användares nummer
  return SAMPLE_ALL_RESERVATIONS.map((r) => ({
    ...r,
    submitterPhone: r.submitterPhone === "__sample__" ? p : r.submitterPhone,
    claimerPhone: r.claimerPhone === "__sample__" ? p : r.claimerPhone,
  }));
}

export function withSampleActivityAlerts(real: ActivityAlert[]): ActivityAlert[] {
  if (!SHOW_SAMPLE_DATA) return real;
  if (real.length > 0) return real;
  return SAMPLE_ACTIVITY_ALERTS;
}

export function withSampleRestaurantAlerts(
  real: RestaurantAlertWithRestaurant[]
): RestaurantAlertWithRestaurant[] {
  if (!SHOW_SAMPLE_DATA) return real;
  if (real.length > 0) return real;
  return SAMPLE_RESTAURANT_ALERTS;
}

export function withSampleWatches(real: Watch[]): Watch[] {
  if (!SHOW_SAMPLE_DATA) return real;
  if (real.length > 0) return real;
  return SAMPLE_WATCHES;
}
