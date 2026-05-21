/**
 * SAMPLE DATA – Endast för test och UX-utvärdering.
 * Ta bort eller sätt SHOW_SAMPLE_DATA = false för att dölja.
 *
 * Exempeldata visas enbart när riktig data saknas (tom array från API).
 */

import type { Reservation, ActivityAlert, RestaurantAlertWithRestaurant, Watch } from "@/lib/api/types";

export const SHOW_SAMPLE_DATA = true;

// Hjälp: returnerar datum som YYYY-MM-DD, offset = dagar från idag
function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// ─── Exempelrestauranger (15 st) ────────────────────────────────────────────

const R = {
  gastrologik: {
    id: "sample-r1", name: "Gastrologik", address: "Artillerigatan 14, Stockholm",
    cuisine: "Nordiskt", neighborhood: "Östermalm", rating: 4.9, reviewCount: 342,
    priceLevel: 4, image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
    description: "Säsongsbaserad nordisk fine dining.", tags: ["Fine dining", "Säsongsbetonat"],
    timesBookedOnReslot: 18, seatType: "Inne", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.336, longitude: 18.077,
    isExclusive: false, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  shibumi: {
    id: "sample-r2", name: "Shibumi", address: "Kungsgatan 23, Stockholm",
    cuisine: "Japanskt", neighborhood: "Norrmalm", rating: 4.7, reviewCount: 215,
    priceLevel: 3, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&q=80",
    description: "Omakase och japansk precisionskök.", tags: ["Omakase", "Sushi"],
    timesBookedOnReslot: 11, seatType: "Inne", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.334, longitude: 18.063,
    isExclusive: false, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  leMoule: {
    id: "sample-r3", name: "Le Moule", address: "Nybrogatan 8, Stockholm",
    cuisine: "Franskt", neighborhood: "Östermalm", rating: 4.6, reviewCount: 178,
    priceLevel: 3, image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80",
    description: "Klassisk parisisk bistro med svenska råvaror.", tags: ["Bistro", "Vin"],
    timesBookedOnReslot: 9, seatType: "Inne", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.335, longitude: 18.08,
    isExclusive: false, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  trattoriaRoma: {
    id: "sample-r4", name: "Trattoria Roma", address: "Hornsgatan 56, Stockholm",
    cuisine: "Italienskt", neighborhood: "Södermalm", rating: 4.5, reviewCount: 291,
    priceLevel: 2, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
    description: "Familjedriven italiensk trattoria sedan 1998.", tags: ["Pasta", "Pizza"],
    timesBookedOnReslot: 23, seatType: "Inne", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.317, longitude: 18.055,
    isExclusive: false, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  pelikan: {
    id: "sample-r5", name: "Pelikan", address: "Blekingegatan 40, Stockholm",
    cuisine: "Husmanskost", neighborhood: "Södermalm", rating: 4.4, reviewCount: 512,
    priceLevel: 2, image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
    description: "Stockholmsk klassikerrestaurang med äkta husmanskost.", tags: ["Husmans", "Klassiker"],
    timesBookedOnReslot: 31, seatType: "Inne", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.314, longitude: 18.073,
    isExclusive: false, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  vraq: {
    id: "sample-r6", name: "Vraq", address: "Tegnérgatan 10, Stockholm",
    cuisine: "Modern europeisk", neighborhood: "Vasastan", rating: 4.6, reviewCount: 203,
    priceLevel: 3, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
    description: "Kreativt kök med skandinaviska influenser.", tags: ["Modern", "Vinnylista"],
    timesBookedOnReslot: 14, seatType: "Inne", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.342, longitude: 18.057,
    isExclusive: false, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  agrikultur: {
    id: "sample-r7", name: "Agrikultur", address: "Roslagsgatan 43, Stockholm",
    cuisine: "Nordiskt", neighborhood: "Östermalm", rating: 4.8, reviewCount: 267,
    priceLevel: 3, image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80",
    description: "Gård-till-bord med lokala råvaror från egna odlingar.", tags: ["Ekologiskt", "Nordiskt"],
    timesBookedOnReslot: 20, seatType: "Inne", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.347, longitude: 18.072,
    isExclusive: false, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  babette: {
    id: "sample-r8", name: "Babette", address: "Roslagsgatan 6, Stockholm",
    cuisine: "Franskt", neighborhood: "Vasastan", rating: 4.5, reviewCount: 189,
    priceLevel: 3, image: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=400&q=80",
    description: "Klassisk fransk brasserie med stockholmsk charm.", tags: ["Brasserie", "Steak frites"],
    timesBookedOnReslot: 16, seatType: "Inne", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.343, longitude: 18.055,
    isExclusive: false, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  indioKitchen: {
    id: "sample-r9", name: "Indio Kitchen", address: "Folkungagatan 84, Stockholm",
    cuisine: "Indiskt", neighborhood: "Södermalm", rating: 4.4, reviewCount: 334,
    priceLevel: 2, image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
    description: "Autentisk indisk mat med moderna trender.", tags: ["Curry", "Vegetariskt"],
    timesBookedOnReslot: 27, seatType: "Inne", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.315, longitude: 18.072,
    isExclusive: false, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  tacoBar: {
    id: "sample-r10", name: "Taco Bar Birger Jarlsgatan", address: "Birger Jarlsgatan 14, Stockholm",
    cuisine: "Mexikanskt", neighborhood: "Östermalm", rating: 4.2, reviewCount: 445,
    priceLevel: 2, image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80",
    description: "Stockholms mest omtyckta tacobar.", tags: ["Tacos", "Casual"],
    timesBookedOnReslot: 35, seatType: "Inne/Ute", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.337, longitude: 18.068,
    isExclusive: false, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  oaxen: {
    id: "sample-r11", name: "Oaxen Krog", address: "Beckholmsvägen 26, Stockholm",
    cuisine: "Nordiskt", neighborhood: "Djurgården", rating: 4.9, reviewCount: 198,
    priceLevel: 4, image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80",
    description: "Två stjärnor i Guide Michelin. Hållbart nordiskt kök.", tags: ["Michelin", "Hållbart"],
    timesBookedOnReslot: 8, seatType: "Inne", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.322, longitude: 18.097,
    isExclusive: true, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  kontrast: {
    id: "sample-r12", name: "Kontrast", address: "Rosenlundsgatan 12, Stockholm",
    cuisine: "Modern nordisk", neighborhood: "Södermalm", rating: 4.7, reviewCount: 156,
    priceLevel: 3, image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80",
    description: "Prisbelönt kök med fokus på kontraster i smak och textur.", tags: ["Tasting menu", "Kreativt"],
    timesBookedOnReslot: 12, seatType: "Inne", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.318, longitude: 18.059,
    isExclusive: false, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  leosMatsalar: {
    id: "sample-r13", name: "Leos Matsalar", address: "Götgatan 22, Stockholm",
    cuisine: "Klassiskt svenskt", neighborhood: "Södermalm", rating: 4.3, reviewCount: 387,
    priceLevel: 2, image: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&q=80",
    description: "Husmanskost och svenska klassiker i hjärtat av Söder.", tags: ["Husmans", "Lunch"],
    timesBookedOnReslot: 29, seatType: "Inne", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.316, longitude: 18.069,
    isExclusive: false, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  teatern: {
    id: "sample-r14", name: "Teatern", address: "Götgatan 78, Stockholm",
    cuisine: "Internationellt", neighborhood: "Södermalm", rating: 4.3, reviewCount: 421,
    priceLevel: 2, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
    description: "Folkungagatans hubb för mat, dryck och kultur.", tags: ["Bar", "Kvällsmat"],
    timesBookedOnReslot: 41, seatType: "Inne/Ute", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.312, longitude: 18.071,
    isExclusive: false, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
  ekstedt: {
    id: "sample-r15", name: "Ekstedt", address: "Humlegårdsgatan 17, Stockholm",
    cuisine: "Nordiskt", neighborhood: "Östermalm", rating: 4.8, reviewCount: 224,
    priceLevel: 4, image: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=400&q=80",
    description: "Niklas Ekstedts Michelin-restaurang — all mat tillagas över öppen eld.", tags: ["Michelin", "Eld", "Nordiskt"],
    timesBookedOnReslot: 10, seatType: "Inne", instagram: null, website: null,
    vibeTags: [], goodForTags: [], foodTags: [], latitude: 59.338, longitude: 18.074,
    isExclusive: true, city: "Stockholm", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
  },
};

// ─── Fabrik: skapa aktiv bokning ─────────────────────────────────────────────

function makeActive(
  id: string,
  restaurant: typeof R[keyof typeof R],
  daysOffset: number,
  time: string,
  partySize: number,
  seatType = "Inne",
  submitterName = "Anna Lindgren",
  extraInfo: string | null = null
): Reservation {
  return {
    id,
    restaurantId: restaurant.id,
    submitterPhone: "+46709000001",
    submitterFirstName: submitterName.split(" ")[0],
    submitterLastName: submitterName.split(" ")[1] ?? "",
    reservationDate: offsetDate(daysOffset),
    reservationTime: `${time}:00`,
    partySize,
    seatType,
    nameOnReservation: submitterName.split(" ")[1] ?? submitterName,
    status: "active",
    claimerPhone: null,
    cancelFee: null,
    prepaidAmount: null,
    verificationLink: null,
    extraInfo,
    cancellationWindowHours: 12,
    claimedAt: null,
    gracePeriodEndsAt: null,
    creditStatus: "none",
    serviceFee: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    restaurant,
  };
}

// ─── 22 aktiva bord (hemskärmen) ─────────────────────────────────────────────

export const SAMPLE_ACTIVE_RESERVATIONS: Reservation[] = [
  // Idag
  makeActive("sample-a1",  R.gastrologik,   0, "18:30", 2, "Inne", "Erik Svensson"),
  makeActive("sample-a2",  R.shibumi,       0, "19:00", 2, "Inne", "Maria Bergström"),
  makeActive("sample-a3",  R.leMoule,       0, "20:00", 4, "Inne", "Johan Lindqvist"),
  makeActive("sample-a4",  R.pelikan,       0, "17:30", 3, "Inne", "Sofia Karlsson"),
  makeActive("sample-a5",  R.vraq,          0, "19:30", 2, "Inne", "Anders Nilsson", "Vegetariskt alternativ önskas"),
  // Imorgon
  makeActive("sample-a6",  R.agrikultur,    1, "19:00", 2, "Inne", "Klara Björk"),
  makeActive("sample-a7",  R.babette,       1, "20:30", 4, "Inne", "Marcus Holm"),
  makeActive("sample-a8",  R.trattoriaRoma, 1, "18:00", 6, "Inne", "Emma Wahlberg", "Barnstolar behövs"),
  makeActive("sample-a9",  R.ekstedt,       1, "19:30", 2, "Inne", "David Ek"),
  makeActive("sample-a10", R.teatern,       1, "17:00", 5, "Inne/Ute", "Sara Lindén"),
  // Om 2 dagar
  makeActive("sample-a11", R.oaxen,         2, "18:00", 2, "Inne", "Henrik Strand"),
  makeActive("sample-a12", R.kontrast,      2, "19:00", 3, "Inne", "Lina Persson"),
  makeActive("sample-a13", R.indioKitchen,  2, "18:30", 4, "Inne", "Pontus Engström"),
  makeActive("sample-a14", R.leosMatsalar,  2, "12:00", 2, "Inne", "Annika Johansson"),
  makeActive("sample-a15", R.tacoBar,       2, "20:00", 4, "Inne/Ute", "Filip Magnusson"),
  // Om 3 dagar
  makeActive("sample-a16", R.gastrologik,   3, "18:00", 4, "Inne", "Maja Hellström"),
  makeActive("sample-a17", R.shibumi,       3, "20:00", 2, "Inne", "Oscar Rydén"),
  makeActive("sample-a18", R.babette,       3, "19:00", 2, "Inne", "Julia Nordin"),
  // Om 4 dagar
  makeActive("sample-a19", R.ekstedt,       4, "18:30", 2, "Inne", "Viktor Sjöberg"),
  makeActive("sample-a20", R.agrikultur,    4, "19:30", 3, "Inne", "Hanna Lindblom"),
  // Om 5 dagar
  makeActive("sample-a21", R.leMoule,       5, "20:00", 2, "Inne", "Tobias Engel"),
  makeActive("sample-a22", R.oaxen,         5, "18:00", 4, "Inne", "Cecilia Strand", "Jubileumsbokning"),
];

// ─── Exempelbokningar (mina upplagda) ───────────────────────────────────────

export const SAMPLE_SUBMITTED_RESERVATIONS: Reservation[] = [
  {
    id: "sample-sub-1", restaurantId: "sample-r1",
    submitterPhone: "__sample__", submitterFirstName: "Anna", submitterLastName: "Lindgren",
    reservationDate: offsetDate(3), reservationTime: "19:30:00",
    partySize: 2, seatType: "Inne", nameOnReservation: "Lindgren", status: "active",
    claimerPhone: null, cancelFee: null, prepaidAmount: null, verificationLink: null,
    extraInfo: "Fönsterbord önskas", cancellationWindowHours: 24,
    claimedAt: null, gracePeriodEndsAt: null, creditStatus: "none", serviceFee: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    restaurant: R.gastrologik,
  },
  {
    id: "sample-sub-2", restaurantId: "sample-r3",
    submitterPhone: "__sample__", submitterFirstName: "Anna", submitterLastName: "Lindgren",
    reservationDate: offsetDate(5), reservationTime: "18:00:00",
    partySize: 4, seatType: "Inne", nameOnReservation: "Lindgren", status: "claimed",
    claimerPhone: "+46701234567", cancelFee: null, prepaidAmount: null, verificationLink: null,
    extraInfo: null, cancellationWindowHours: 12,
    claimedAt: new Date().toISOString(), gracePeriodEndsAt: null, creditStatus: "awarded", serviceFee: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    restaurant: R.leMoule,
  },
  {
    id: "sample-sub-3", restaurantId: "sample-r4",
    submitterPhone: "__sample__", submitterFirstName: "Anna", submitterLastName: "Lindgren",
    reservationDate: offsetDate(-2), reservationTime: "20:00:00",
    partySize: 3, seatType: "Inne", nameOnReservation: "Lindgren", status: "completed",
    claimerPhone: "+46709876543", cancelFee: null, prepaidAmount: null, verificationLink: null,
    extraInfo: null, cancellationWindowHours: 6,
    claimedAt: new Date().toISOString(), gracePeriodEndsAt: null, creditStatus: "awarded", serviceFee: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    restaurant: R.trattoriaRoma,
  },
];

// ─── Exempelbokningar (övertagna) ────────────────────────────────────────────

export const SAMPLE_CLAIMED_RESERVATIONS: Reservation[] = [
  {
    id: "sample-cl-1", restaurantId: "sample-r2",
    submitterPhone: "+46709999111", submitterFirstName: "Erik", submitterLastName: "Svensson",
    reservationDate: offsetDate(2), reservationTime: "19:00:00",
    partySize: 2, seatType: "Inne", nameOnReservation: "Svensson", status: "claimed",
    claimerPhone: "__sample__", cancelFee: null, prepaidAmount: null, verificationLink: null,
    extraInfo: null, cancellationWindowHours: 24,
    claimedAt: new Date().toISOString(), gracePeriodEndsAt: null, creditStatus: "none", serviceFee: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    restaurant: R.shibumi,
  },
  {
    id: "sample-cl-2", restaurantId: "sample-r5",
    submitterPhone: "+46702223344", submitterFirstName: "Maria", submitterLastName: "Bergström",
    reservationDate: offsetDate(-3), reservationTime: "17:30:00",
    partySize: 5, seatType: "Inne", nameOnReservation: "Bergström", status: "completed",
    claimerPhone: "__sample__", cancelFee: null, prepaidAmount: null, verificationLink: null,
    extraInfo: "Födelsedag", cancellationWindowHours: 12,
    claimedAt: new Date().toISOString(), gracePeriodEndsAt: null, creditStatus: "awarded", serviceFee: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    restaurant: R.pelikan,
    feedback: { id: "sample-fb-1", worked: true, comment: "Fungerade perfekt!", createdAt: new Date().toISOString() },
  },
];

export const SAMPLE_ALL_RESERVATIONS: Reservation[] = [
  ...SAMPLE_SUBMITTED_RESERVATIONS,
  ...SAMPLE_CLAIMED_RESERVATIONS,
];

// ─── Exempelaktivitetsnotiser ────────────────────────────────────────────────

export const SAMPLE_ACTIVITY_ALERTS: ActivityAlert[] = [
  {
    id: "sample-act-1", userPhone: "__sample__", type: "claim",
    title: "Ditt bord är övertaget! 🎉",
    message: "Någon tog över din bokning på Le Moule. Du har fått +2 credits.",
    read: false, restaurantId: "sample-r3", createdAt: new Date().toISOString(),
  },
  {
    id: "sample-act-2", userPhone: "__sample__", type: "credit",
    title: "+2 credits",
    message: "Du fick credits för att du lade upp ett bord på Trattoria Roma. Tack!",
    read: true, restaurantId: "sample-r4", createdAt: new Date().toISOString(),
  },
  {
    id: "sample-act-3", userPhone: "__sample__", type: "drop",
    title: "Nytt bord hos Gastrologik",
    message: "Ett bord för 2 är tillgängligt. Agera snabbt!",
    read: true, restaurantId: "sample-r1", createdAt: new Date().toISOString(),
  },
];

// ─── Exempelrestaurangbevakningar ────────────────────────────────────────────

export const SAMPLE_RESTAURANT_ALERTS: RestaurantAlertWithRestaurant[] = [
  { id: "sample-ra-1", userPhone: "__sample__", restaurantId: "sample-r1", enabled: true, createdAt: new Date().toISOString(), restaurant: R.gastrologik },
  { id: "sample-ra-2", userPhone: "__sample__", restaurantId: "sample-r2", enabled: true, createdAt: new Date().toISOString(), restaurant: R.shibumi },
  { id: "sample-ra-3", userPhone: "__sample__", restaurantId: "sample-r5", enabled: true, createdAt: new Date().toISOString(), restaurant: R.pelikan },
];

// ─── Exempelbevakningar (watches) ────────────────────────────────────────────

export const SAMPLE_WATCHES: Watch[] = [
  {
    id: "sample-w1", userPhone: "__sample__", restaurantId: "sample-r1",
    date: offsetDate(6), partySize: 2, notes: "Helst fönsterbord",
    filterOptions: JSON.stringify({ timeRange: ["18:00", "21:00"], weekdays: [5, 6], partySize: 2 }),
    createdAt: new Date().toISOString(), restaurant: R.gastrologik,
  },
  {
    id: "sample-w2", userPhone: "__sample__", restaurantId: "sample-r2",
    date: offsetDate(7), partySize: 2, notes: null,
    filterOptions: JSON.stringify({ timeRange: ["19:00", "22:00"], weekdays: [5], partySize: 2 }),
    createdAt: new Date().toISOString(), restaurant: R.shibumi,
  },
  {
    id: "sample-w3", userPhone: "__sample__", restaurantId: null,
    date: null, partySize: 4, notes: "Söker bord för 4 på lördag",
    filterOptions: JSON.stringify({ timeRange: ["17:00", "20:00"], weekdays: [6], partySize: 4 }),
    createdAt: new Date().toISOString(), restaurant: null,
  },
];

// ─── Merge-helpers ────────────────────────────────────────────────────────────

export function withSampleReservations(
  real: Reservation[],
  phone: string | null | undefined
): Reservation[] {
  if (!SHOW_SAMPLE_DATA) return real;
  if (real.length > 0) return real;
  const p = phone || "__sample__";
  return SAMPLE_ALL_RESERVATIONS.map((r) => ({
    ...r,
    submitterPhone: r.submitterPhone === "__sample__" ? p : r.submitterPhone,
    claimerPhone: r.claimerPhone === "__sample__" ? p : r.claimerPhone,
  }));
}

export function withSampleActiveReservations(real: Reservation[]): Reservation[] {
  if (!SHOW_SAMPLE_DATA) return real;
  if (real.length > 0) return real;
  return SAMPLE_ACTIVE_RESERVATIONS;
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
