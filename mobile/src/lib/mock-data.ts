export interface TagWithCount {
  label: string;
  count: number;
}

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
  reservationTime: string;
  reservationDate: string;
  partySize: number;
  claimedBy: string | null;
  isExclusive: boolean;
  submittedBy: string;
  submittedAt: string;
  description: string;
  tags: string[];
  timesBookedOnReslot: number;
  seatType: "Inomhus" | "Utomhus" | "Båda";
  instagram?: string;
  website?: string;
  vibeTags: TagWithCount[];
  goodForTags: TagWithCount[];
  foodTags: TagWithCount[];
  latitude?: number;
  longitude?: number;
}

export interface MyReservation {
  id: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantCuisine: string;
  restaurantRating: number;
  restaurantImage: string;
  date: string;
  time: string;
  partySize: number;
  location: "Inomhus" | "Utomhus";
  nameOnReservation: string;
  status: "active" | "claimed" | "expired" | "cancelled";
  type: "submitted" | "claimed";
  submittedAt: string;
}

export interface RestaurantAlert {
  id: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantCuisine: string;
  restaurantRating: number;
  restaurantImage: string;
  enabled: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  tokens: number;
  isPremium: boolean;
  reservationsClaimed: number;
  reservationsSubmitted: number;
  rewardsAvailable: number;
  memberSince: string;
  referralCode: string;
}

export interface Alert {
  id: string;
  type: "claim" | "drop" | "token" | "premium";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  restaurantId?: string;
}

export const REWARD_MILESTONES = [5, 10, 15, 20, 25, 30] as const;

export const MOCK_USER: UserProfile = {
  id: "u1",
  name: "Erik Lindström",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  tokens: 12,
  isPremium: false,
  reservationsClaimed: 8,
  reservationsSubmitted: 3,
  rewardsAvailable: 1,
  memberSince: "Jan 2026",
  referralCode: "ERIK2026",
};

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: "r1",
    name: "Frantzén",
    address: "Klara Norra Kyrkogata 26, Norrmalm",
    cuisine: "New Nordic",
    neighborhood: "City",
    rating: 4.9,
    reviewCount: 842,
    priceLevel: 4,
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    reservationTime: "20:00",
    reservationDate: "Ikväll",
    partySize: 2,
    claimedBy: null,
    isExclusive: true,
    submittedBy: "Anna K.",
    submittedAt: "12 min sedan",
    description: "Trestjärnig Michelin-upplevelse i hjärtat av Stockholm.",
    tags: ["Michelin", "Fine Dining", "Dejtkväll"],
    timesBookedOnReslot: 47,
    seatType: "Inomhus",
    instagram: "frantzenrestaurant",
    website: "frantzen.com",
    vibeTags: [{ label: "Exklusiv upplevelse", count: 12 }, { label: "Intim atmosfär", count: 9 }, { label: "Lyxigt", count: 8 }],
    goodForTags: [{ label: "Dejtkväll", count: 11 }, { label: "Stor firande", count: 7 }, { label: "Affärsmiddag", count: 5 }],
    foodTags: [{ label: "Innovativ mat", count: 10 }, { label: "Säsongsbetonat", count: 8 }, { label: "Vegetariska alternativ", count: 4 }],
    latitude: 59.3345,
    longitude: 18.0638,
  },
  {
    id: "r2",
    name: "Babette",
    address: "Rosendalsvägen 14, Rosendal",
    cuisine: "French-Nordic",
    neighborhood: "Östermalm",
    rating: 4.7,
    reviewCount: 614,
    priceLevel: 3,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
    reservationTime: "19:30",
    reservationDate: "Ikväll",
    partySize: 4,
    claimedBy: null,
    isExclusive: false,
    submittedBy: "Marcus L.",
    submittedAt: "28 min sedan",
    description: "Varmt, intimt bistro med en säsongsbetonad fransk-nordisk meny.",
    tags: ["Bistro", "Romantiskt", "Säsongsmeny"],
    timesBookedOnReslot: 128,
    seatType: "Inomhus",
    instagram: "babettestockholm",
    website: "babette.se",
    vibeTags: [{ label: "Intim miljö", count: 9 }, { label: "Romantiskt", count: 8 }, { label: "Avslappnat elegant", count: 6 }],
    goodForTags: [{ label: "Dejtkväll", count: 10 }, { label: "Ta med föräldrarna", count: 5 }, { label: "Jubileum", count: 4 }],
    foodTags: [{ label: "Bra vinlista", count: 7 }, { label: "God pasta", count: 6 }, { label: "Säsongsbetonat", count: 5 }],
    latitude: 59.3267,
    longitude: 18.1033,
  },
  {
    id: "r3",
    name: "Punk Royale",
    address: "Folkungagatan 128, Södermalm",
    cuisine: "Avant-garde",
    neighborhood: "Södermalm",
    rating: 4.6,
    reviewCount: 523,
    priceLevel: 4,
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    reservationTime: "21:00",
    reservationDate: "Ikväll",
    partySize: 2,
    claimedBy: null,
    isExclusive: true,
    submittedBy: "Sofia R.",
    submittedAt: "45 min sedan",
    description: "Stockholms mest rebelliska fine dining — förvänta dig det oväntade.",
    tags: ["Upplevelse", "Kreativt", "Fine Dining"],
    timesBookedOnReslot: 89,
    seatType: "Inomhus",
    instagram: "punkroyale_sthlm",
    website: "punkroyale.se",
    vibeTags: [{ label: "Edgy & Rebellisk", count: 14 }, { label: "Festlig", count: 9 }, { label: "Unik upplevelse", count: 8 }],
    goodForTags: [{ label: "Födelsedag", count: 8 }, { label: "Fredagsafter", count: 7 }, { label: "Imponera någon", count: 6 }],
    foodTags: [{ label: "Kreativ mat", count: 11 }, { label: "Provmeny", count: 9 }, { label: "Vegetariska alternativ", count: 3 }],
    latitude: 59.3148,
    longitude: 18.0724,
  },
  {
    id: "r4",
    name: "Ekstedt",
    address: "Humlegårdsgatan 17, Östermalm",
    cuisine: "Fire-cooked Nordic",
    neighborhood: "Östermalm",
    rating: 4.8,
    reviewCount: 731,
    priceLevel: 4,
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop",
    reservationTime: "18:30",
    reservationDate: "Imorgon",
    partySize: 3,
    claimedBy: null,
    isExclusive: false,
    submittedBy: "Johan B.",
    submittedAt: "1 tim sedan",
    description: "Unik eldlagad mat med skandinaviska råvaror.",
    tags: ["Eldlagat", "Nordiskt", "Michelin"],
    timesBookedOnReslot: 203,
    seatType: "Inomhus",
    instagram: "ekstedtrestaurant",
    website: "ekstedt.nu",
    vibeTags: [{ label: "Dramatisk atmosfär", count: 11 }, { label: "Rustikt", count: 7 }, { label: "Exklusivt", count: 6 }],
    goodForTags: [{ label: "Affärsmiddag", count: 9 }, { label: "Dejtkväll", count: 8 }, { label: "Firande", count: 5 }],
    foodTags: [{ label: "Eldlagat", count: 12 }, { label: "Nordiska råvaror", count: 10 }, { label: "Kött i världsklass", count: 7 }],
    latitude: 59.3381,
    longitude: 18.0738,
  },
  {
    id: "r5",
    name: "Oaxen Krog",
    address: "Beckholmsvägen 26, Djurgården",
    cuisine: "Modern Swedish",
    neighborhood: "City",
    rating: 4.8,
    reviewCount: 689,
    priceLevel: 4,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop",
    reservationTime: "19:00",
    reservationDate: "Ikväll",
    partySize: 2,
    claimedBy: null,
    isExclusive: false,
    submittedBy: "Lena W.",
    submittedAt: "2 tim sedan",
    description: "Två Michelin-stjärnor vid vattnet på Djurgården.",
    tags: ["Michelin", "Vattenfront", "Säsongsmeny"],
    timesBookedOnReslot: 156,
    seatType: "Båda",
    instagram: "oaxenkrog",
    website: "oaxen.com",
    vibeTags: [{ label: "Naturskön utsikt", count: 13 }, { label: "Avslappnat lyxigt", count: 9 }, { label: "Romantiskt", count: 8 }],
    goodForTags: [{ label: "Dejtkväll", count: 11 }, { label: "Sommarmiddag", count: 8 }, { label: "Jubileum", count: 6 }],
    foodTags: [{ label: "Fisk & skaldjur", count: 10 }, { label: "Säsongsbetonat", count: 9 }, { label: "Vegetariska alternativ", count: 5 }],
    latitude: 59.3247,
    longitude: 18.0989,
  },
  {
    id: "r6",
    name: "Gastrologik",
    address: "Artillerigatan 14, Östermalm",
    cuisine: "Seasonal Tasting",
    neighborhood: "Östermalm",
    rating: 4.7,
    reviewCount: 412,
    priceLevel: 4,
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&h=400&fit=crop",
    reservationTime: "20:30",
    reservationDate: "Imorgon",
    partySize: 2,
    claimedBy: null,
    isExclusive: true,
    submittedBy: "Karl N.",
    submittedAt: "3 tim sedan",
    description: "Inget fast meny — kocken bestämmer utifrån vad som är färskt idag.",
    tags: ["Provmeny", "Överraskning", "Fine Dining"],
    timesBookedOnReslot: 67,
    seatType: "Inomhus",
    instagram: "gastrologik",
    website: "gastrologik.se",
    vibeTags: [{ label: "Minimalistisk", count: 8 }, { label: "Intim", count: 7 }, { label: "Sofistikerad", count: 6 }],
    goodForTags: [{ label: "Mat-entusiaster", count: 9 }, { label: "Dejtkväll", count: 7 }, { label: "Affärsmiddag", count: 4 }],
    foodTags: [{ label: "Provmeny", count: 12 }, { label: "Säsongsbetonat", count: 11 }, { label: "Vegetarisk provmeny", count: 6 }],
    latitude: 59.3356,
    longitude: 18.0801,
  },
  {
    id: "r7",
    name: "Taverna Brillo",
    address: "Sturegatan 6, Stureplan",
    cuisine: "Italian-Nordic",
    neighborhood: "Östermalm",
    rating: 4.4,
    reviewCount: 1203,
    priceLevel: 2,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
    reservationTime: "19:00",
    reservationDate: "Ikväll",
    partySize: 6,
    claimedBy: null,
    isExclusive: false,
    submittedBy: "Maja S.",
    submittedAt: "15 min sedan",
    description: "Livfull italiensk-inspirerad restaurang i hjärtat av Stureplan.",
    tags: ["Italienskt", "Stor Grupp", "Livfullt"],
    timesBookedOnReslot: 341,
    seatType: "Båda",
    instagram: "tavernabrillo",
    website: "tavernabrillo.se",
    vibeTags: [{ label: "Livlig & Social", count: 15 }, { label: "Trendig", count: 11 }, { label: "Snygg miljö", count: 9 }],
    goodForTags: [{ label: "Stor grupp", count: 13 }, { label: "Fredagsafter", count: 10 }, { label: "After work", count: 8 }],
    foodTags: [{ label: "God pasta", count: 12 }, { label: "Bra pizza", count: 9 }, { label: "Vegetariska alternativ", count: 6 }],
    latitude: 59.3365,
    longitude: 18.0755,
  },
  {
    id: "r8",
    name: "Sushi Sho",
    address: "Upplandsgatan 45, Vasastan",
    cuisine: "Omakase",
    neighborhood: "Vasastan",
    rating: 4.9,
    reviewCount: 298,
    priceLevel: 4,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop",
    reservationTime: "18:00",
    reservationDate: "Ikväll",
    partySize: 2,
    claimedBy: null,
    isExclusive: true,
    submittedBy: "Yuki T.",
    submittedAt: "8 min sedan",
    description: "Stockholms mest eftertraktade omakase — 14 platser, en servering per kväll.",
    tags: ["Omakase", "Exklusivt", "Japanskt"],
    timesBookedOnReslot: 52,
    seatType: "Inomhus",
    instagram: "sushisho_sthlm",
    website: "sushisho.se",
    vibeTags: [{ label: "Ultraexklusivt", count: 9 }, { label: "Stilla & fokuserat", count: 7 }, { label: "Autentiskt", count: 6 }],
    goodForTags: [{ label: "Sushi-älskare", count: 10 }, { label: "Dejtkväll", count: 8 }, { label: "Stor firande", count: 4 }],
    foodTags: [{ label: "Omakase", count: 12 }, { label: "Råa råvaror", count: 9 }, { label: "Skaldjur", count: 7 }],
    latitude: 59.3466,
    longitude: 18.0518,
  },
];

export const MOCK_MY_RESERVATIONS: MyReservation[] = [
  {
    id: "mr1",
    restaurantName: "Ekstedt",
    restaurantAddress: "Humlegårdsgatan 17, Östermalm",
    restaurantCuisine: "Fire-cooked Nordic",
    restaurantRating: 4.8,
    restaurantImage: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop",
    date: "Måndag, 16 mar",
    time: "18:30",
    partySize: 2,
    location: "Inomhus",
    nameOnReservation: "Erik Lindström",
    status: "active",
    type: "submitted",
    submittedAt: "2 tim sedan",
  },
  {
    id: "mr2",
    restaurantName: "Babette",
    restaurantAddress: "Rosendalsvägen 14, Rosendal",
    restaurantCuisine: "French-Nordic",
    restaurantRating: 4.7,
    restaurantImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
    date: "Tisdag, 17 mar",
    time: "19:30",
    partySize: 4,
    location: "Inomhus",
    nameOnReservation: "Erik Lindström",
    status: "claimed",
    type: "claimed",
    submittedAt: "1 dag sedan",
  },
  {
    id: "mr3",
    restaurantName: "Oaxen Krog",
    restaurantAddress: "Beckholmsvägen 26, Djurgården",
    restaurantCuisine: "Modern Swedish",
    restaurantRating: 4.8,
    restaurantImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop",
    date: "Lördag, 14 mar",
    time: "19:00",
    partySize: 2,
    location: "Inomhus",
    nameOnReservation: "Erik Lindström",
    status: "expired",
    type: "submitted",
    submittedAt: "3 dagar sedan",
  },
];

export const MOCK_RESTAURANT_ALERTS: RestaurantAlert[] = [
  {
    id: "ra1",
    restaurantName: "Frantzén",
    restaurantAddress: "Klara Norra Kyrkogata 26, Norrmalm",
    restaurantCuisine: "New Nordic",
    restaurantRating: 4.9,
    restaurantImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    enabled: true,
  },
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: "a1",
    type: "drop",
    title: "Ny Drop: Frantzén",
    message: "Ett sällsynt bord för 2 har dykt upp ikväll kl 20:00.",
    timestamp: "12 min sedan",
    read: false,
    restaurantId: "r1",
  },
  {
    id: "a2",
    type: "claim",
    title: "Bokning Övertagen",
    message: "Din Babette-bokning övertogs av en annan användare.",
    timestamp: "1 tim sedan",
    read: false,
  },
  {
    id: "a3",
    type: "token",
    title: "+2 Tokens Intjänade",
    message: "Du tjänade 2 tokens för att ha lagt upp din Ekstedt-bokning.",
    timestamp: "3 tim sedan",
    read: true,
  },
  {
    id: "a4",
    type: "drop",
    title: "Ny Drop: Punk Royale",
    message: "En avant-garde-middag för 2 har blivit tillgänglig.",
    timestamp: "Igår",
    read: true,
    restaurantId: "r3",
  },
];

export const CUISINE_FILTERS = [
  "Alla", "Franskt", "Italienskt", "Japanskt", "Ny Nordisk", "Asiatiskt",
  "Brunch", "Pasta", "Sushi", "Hamburgare", "Pizza", "Vegetariskt", "Avsmakningsmeny",
] as const;

export const NEIGHBORHOODS = [
  "Alla Områden",
  "Norrmalm",
  "Södermalm",
  "Östermalm",
  "Djurgården",
  "Vasastan",
  "Stureplan",
  "Rosendal",
] as const;

export const SEARCHABLE_RESTAURANTS = [
  { name: "Frantzén", address: "Klara Norra Kyrkogata 26, Norrmalm" },
  { name: "Babette", address: "Rosendalsvägen 14, Rosendal" },
  { name: "Punk Royale", address: "Folkungagatan 128, Södermalm" },
  { name: "Ekstedt", address: "Humlegårdsgatan 17, Östermalm" },
  { name: "Oaxen Krog", address: "Beckholmsvägen 26, Djurgården" },
  { name: "Gastrologik", address: "Artillerigatan 14, Östermalm" },
  { name: "Taverna Brillo", address: "Sturegatan 6, Stureplan" },
  { name: "Sushi Sho", address: "Upplandsgatan 45, Vasastan" },
  { name: "Operakällaren", address: "Karl XII:s Torg, Norrmalm" },
  { name: "Sturehof", address: "Stureplan 2, Östermalm" },
  { name: "Rolfs Kök", address: "Tegnérgatan 41, Vasastan" },
  { name: "AG", address: "Kronobergsgatan 37, Kungsholmen" },
  { name: "Lilla Ego", address: "Västmannagatan 69, Vasastan" },
  { name: "Portal", address: "St Eriksgatan 77, Vasastan" },
] as const;
