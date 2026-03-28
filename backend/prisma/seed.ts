import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.activityAlert.deleteMany();
  await db.restaurantAlert.deleteMany();
  await db.reservation.deleteMany();
  await db.userProfile.deleteMany();
  await db.restaurant.deleteMany();

  const restaurants = [
    {
      name: "Frantzén",
      address: "Klara Norra Kyrkogata 26, 111 22 Stockholm",
      cuisine: "New Nordic",
      neighborhood: "City",
      rating: 4.9,
      reviewCount: 1243,
      priceLevel: 4,
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
      description: "Three Michelin-starred restaurant offering a unique multi-sensory dining experience. Chef Björn Frantzén combines Nordic traditions with Asian influences in an intimate setting spread across three floors.",
      tags: JSON.stringify(["Fine Dining", "Michelin Star", "Tasting Menu"]),
      timesBookedOnReslot: 87,
      seatType: "Inomhus",
      instagram: "@restaurantfrantzen",
      website: "https://frantzen.com",
      vibeTags: JSON.stringify(["Intimate", "Elegant", "World-class"]),
      goodForTags: JSON.stringify(["Special Occasions", "Date Night", "Business Dinner"]),
      foodTags: JSON.stringify(["Nordic", "Japanese", "Tasting Menu", "Seasonal"]),
      latitude: 59.3345,
      longitude: 18.0632,
      isExclusive: true,
      city: "Stockholm",
    },
    {
      name: "Babette",
      address: "Roslagsgatan 6, 113 55 Stockholm",
      cuisine: "French-Nordic",
      neighborhood: "Östermalm",
      rating: 4.7,
      reviewCount: 856,
      priceLevel: 3,
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
      description: "A beloved neighborhood bistro blending French technique with Nordic ingredients. Known for its warm atmosphere, natural wines, and seasonal menus that celebrate local produce.",
      tags: JSON.stringify(["Bistro", "Natural Wine", "Seasonal"]),
      timesBookedOnReslot: 62,
      seatType: "Båda",
      instagram: "@babettestockholm",
      website: "https://babette.se",
      vibeTags: JSON.stringify(["Cozy", "Relaxed", "Charming"]),
      goodForTags: JSON.stringify(["Date Night", "Friends Dinner", "Casual Evening"]),
      foodTags: JSON.stringify(["French", "Nordic", "Bistro", "Natural Wine"]),
      latitude: 59.3462,
      longitude: 18.0615,
      isExclusive: false,
      city: "Stockholm",
    },
    {
      name: "Punk Royale",
      address: "Folkungagatan 128, 116 30 Stockholm",
      cuisine: "Avant-garde",
      neighborhood: "Södermalm",
      rating: 4.6,
      reviewCount: 734,
      priceLevel: 4,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      description: "Stockholm's most provocative dining experience. Punk Royale breaks every rule of fine dining with theatrical presentations, unexpected flavor combinations, and a rock'n'roll atmosphere.",
      tags: JSON.stringify(["Avant-garde", "Theatrical", "Experience Dining"]),
      timesBookedOnReslot: 54,
      seatType: "Inomhus",
      instagram: "@punkroyale",
      website: "https://punkroyale.se",
      vibeTags: JSON.stringify(["Wild", "Theatrical", "Unforgettable"]),
      goodForTags: JSON.stringify(["Special Occasions", "Group Dinner", "Birthday"]),
      foodTags: JSON.stringify(["Avant-garde", "Creative", "Tasting Menu"]),
      latitude: 59.3153,
      longitude: 18.0874,
      isExclusive: true,
      city: "Stockholm",
    },
    {
      name: "Ekstedt",
      address: "Humlegårdsgatan 17, 114 46 Stockholm",
      cuisine: "Fire-cooked Nordic",
      neighborhood: "Östermalm",
      rating: 4.8,
      reviewCount: 1087,
      priceLevel: 4,
      image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800",
      description: "Michelin-starred restaurant where all cooking is done over open fire, wood oven, and smoke. Chef Niklas Ekstedt brings ancient Scandinavian cooking techniques to modern fine dining.",
      tags: JSON.stringify(["Michelin Star", "Open Fire", "Nordic"]),
      timesBookedOnReslot: 73,
      seatType: "Inomhus",
      instagram: "@ekstedtrestaurant",
      website: "https://ekstedt.nu",
      vibeTags: JSON.stringify(["Rustic Elegant", "Warm", "Authentic"]),
      goodForTags: JSON.stringify(["Date Night", "Special Occasions", "Food Enthusiasts"]),
      foodTags: JSON.stringify(["Nordic", "Fire-cooked", "Seasonal", "Smoke"]),
      latitude: 59.3400,
      longitude: 18.0750,
      isExclusive: false,
      city: "Stockholm",
    },
    {
      name: "Oaxen Krog",
      address: "Beckholmsvägen 26, 115 21 Stockholm",
      cuisine: "Modern Swedish",
      neighborhood: "City",
      rating: 4.8,
      reviewCount: 968,
      priceLevel: 4,
      image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800",
      description: "Two Michelin-starred waterfront restaurant on Djurgården. Chef Magnus Ek creates extraordinary dishes from foraged ingredients and the finest Swedish produce in a stunning maritime setting.",
      tags: JSON.stringify(["Michelin Star", "Waterfront", "Foraging"]),
      timesBookedOnReslot: 65,
      seatType: "Båda",
      instagram: "@oaxen",
      website: "https://oaxen.com",
      vibeTags: JSON.stringify(["Serene", "Waterfront", "Refined"]),
      goodForTags: JSON.stringify(["Special Occasions", "Anniversary", "Business Dinner"]),
      foodTags: JSON.stringify(["Modern Swedish", "Foraged", "Tasting Menu", "Seafood"]),
      latitude: 59.3240,
      longitude: 18.1120,
      isExclusive: false,
      city: "Stockholm",
    },
    {
      name: "Gastrologik",
      address: "Artillerigatan 14, 114 51 Stockholm",
      cuisine: "Seasonal Tasting",
      neighborhood: "Östermalm",
      rating: 4.7,
      reviewCount: 812,
      priceLevel: 4,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
      description: "A no-menu restaurant where every dish is created from the day's best ingredients. Chefs Anton Bjuhr and Jacob Holmström craft surprise tasting menus that celebrate Swedish terroir.",
      tags: JSON.stringify(["No Menu", "Tasting Menu", "Seasonal"]),
      timesBookedOnReslot: 48,
      seatType: "Inomhus",
      instagram: "@gastrologik",
      website: "https://gastrologik.se",
      vibeTags: JSON.stringify(["Minimalist", "Sophisticated", "Surprising"]),
      goodForTags: JSON.stringify(["Date Night", "Food Enthusiasts", "Special Occasions"]),
      foodTags: JSON.stringify(["Seasonal", "Swedish", "Tasting Menu", "Surprise"]),
      latitude: 59.3380,
      longitude: 18.0800,
      isExclusive: true,
      city: "Stockholm",
    },
    {
      name: "Taverna Brillo",
      address: "Sturegatan 6, 114 35 Stockholm",
      cuisine: "Italian-Nordic",
      neighborhood: "Östermalm",
      rating: 4.4,
      reviewCount: 1456,
      priceLevel: 2,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
      description: "A vibrant all-day restaurant and bar in the heart of Stureplan. Serving Italian-inspired dishes with Nordic touches, fresh pasta, wood-fired pizzas, and creative cocktails in a buzzing atmosphere.",
      tags: JSON.stringify(["Italian", "Cocktails", "All-day"]),
      timesBookedOnReslot: 112,
      seatType: "Båda",
      instagram: "@tavernabrillo",
      website: "https://tavernabrillo.se",
      vibeTags: JSON.stringify(["Buzzing", "Social", "Trendy"]),
      goodForTags: JSON.stringify(["After Work", "Friends Dinner", "Casual Date"]),
      foodTags: JSON.stringify(["Italian", "Pasta", "Pizza", "Cocktails"]),
      latitude: 59.3380,
      longitude: 18.0730,
      isExclusive: false,
      city: "Stockholm",
    },
    {
      name: "Sushi Sho",
      address: "Upplandsgatan 45, 113 28 Stockholm",
      cuisine: "Omakase",
      neighborhood: "Vasastan",
      rating: 4.9,
      reviewCount: 687,
      priceLevel: 4,
      image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800",
      description: "Stockholm's premier omakase experience. Master sushi chef Carl Ishizaki serves an intimate 20-course omakase using the finest fish flown in from Tokyo's Tsukiji market, paired with rare sake.",
      tags: JSON.stringify(["Omakase", "Sushi", "Intimate"]),
      timesBookedOnReslot: 93,
      seatType: "Inomhus",
      instagram: "@sushisho",
      website: "https://sushisho.se",
      vibeTags: JSON.stringify(["Intimate", "Zen", "Authentic"]),
      goodForTags: JSON.stringify(["Date Night", "Special Occasions", "Sushi Lovers"]),
      foodTags: JSON.stringify(["Japanese", "Omakase", "Sushi", "Sake"]),
      latitude: 59.3440,
      longitude: 18.0530,
      isExclusive: true,
      city: "Stockholm",
    },
  ];

  const createdRestaurants = [];
  for (const r of restaurants) {
    const created = await db.restaurant.create({ data: r });
    createdRestaurants.push(created);
    console.log(`Created restaurant: ${created.name}`);
  }

  // Seed sample reservations
  const now = new Date();
  const reservationData = [
    { restaurantIndex: 0, time: "19:00", partySize: 2, daysFromNow: 1 },
    { restaurantIndex: 0, time: "20:30", partySize: 4, daysFromNow: 3 },
    { restaurantIndex: 1, time: "18:30", partySize: 2, daysFromNow: 1 },
    { restaurantIndex: 1, time: "19:00", partySize: 6, daysFromNow: 2 },
    { restaurantIndex: 2, time: "19:30", partySize: 4, daysFromNow: 2 },
    { restaurantIndex: 2, time: "20:00", partySize: 2, daysFromNow: 4 },
    { restaurantIndex: 3, time: "18:00", partySize: 2, daysFromNow: 1 },
    { restaurantIndex: 3, time: "19:00", partySize: 3, daysFromNow: 3 },
    { restaurantIndex: 4, time: "19:00", partySize: 2, daysFromNow: 2 },
    { restaurantIndex: 4, time: "20:00", partySize: 4, daysFromNow: 5 },
    { restaurantIndex: 5, time: "19:30", partySize: 2, daysFromNow: 1 },
    { restaurantIndex: 5, time: "20:00", partySize: 2, daysFromNow: 3 },
    { restaurantIndex: 6, time: "18:00", partySize: 4, daysFromNow: 1 },
    { restaurantIndex: 6, time: "19:30", partySize: 6, daysFromNow: 2 },
    { restaurantIndex: 6, time: "20:00", partySize: 2, daysFromNow: 4 },
    { restaurantIndex: 7, time: "18:00", partySize: 2, daysFromNow: 1 },
    { restaurantIndex: 7, time: "19:00", partySize: 2, daysFromNow: 2 },
  ];

  const firstNames = ["Erik", "Anna", "Lars", "Sofia", "Johan", "Maria", "Oscar", "Emma", "Karl", "Linnea"];
  const lastNames = ["Svensson", "Johansson", "Lindberg", "Nilsson", "Bergström", "Andersson", "Pettersson"];

  for (let i = 0; i < reservationData.length; i++) {
    const rd = reservationData[i]!;
    const restaurant = createdRestaurants[rd.restaurantIndex]!;
    const date = new Date(now);
    date.setDate(date.getDate() + rd.daysFromNow);
    date.setHours(0, 0, 0, 0);

    const firstName = firstNames[i % firstNames.length] ?? "Erik";
    const lastName = lastNames[i % lastNames.length] ?? "Svensson";

    await db.reservation.create({
      data: {
        restaurantId: restaurant.id,
        submitterPhone: `+4670${String(1000000 + i).slice(1)}`,
        submitterFirstName: firstName,
        submitterLastName: lastName,
        reservationDate: date,
        reservationTime: rd.time,
        partySize: rd.partySize,
        seatType: restaurant.seatType,
        nameOnReservation: `${firstName} ${lastName}`,
        status: "active",
        cancelFee: Math.random() > 0.5 ? Math.round(Math.random() * 500 + 200) : null,
        prepaidAmount: Math.random() > 0.7 ? Math.round(Math.random() * 1000 + 500) : null,
      },
    });
  }

  console.log(`Created ${reservationData.length} sample reservations`);
  console.log("Seed complete!");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
