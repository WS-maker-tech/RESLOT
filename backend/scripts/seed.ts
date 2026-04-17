import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const RESTAURANTS = [
  {
    name: "Ekstedt",
    address: "Humlegårdsgatan 17, 114 46 Stockholm",
    cuisine: "Nordisk",
    neighborhood: "Östermalm",
    city: "Stockholm",
    rating: 4.8,
    priceLevel: 4,
    seatType: "indoor",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
    description: "Prisbelönt krog med eldkokad nordisk mat i hjärtat av Stockholm.",
    tags: ["Romantisk", "Specialtillfälle", "Prisbelönt"],
    vibeTags: ["Mysig", "Exklusiv"],
    website: "https://ekstedt.nu",
    instagram: "@ekstedtrestaurant",
  },
  {
    name: "Oaxen Krog",
    address: "Beckholmsvägen 26, 115 21 Stockholm",
    cuisine: "Skandinavisk",
    neighborhood: "Djurgården",
    city: "Stockholm",
    rating: 4.7,
    priceLevel: 4,
    seatType: "indoor",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
    description: "Tvåstjärnig Michelin-restaurang med fokus på hållbarhet och säsongsbetonade råvaror.",
    tags: ["Michelin", "Hållbart", "Utsikt"],
    vibeTags: ["Avslappnad lyx", "Romantisk"],
    website: "https://oaxen.com",
    instagram: "@oaxenkrog",
  },
  {
    name: "Restaurang Jonas",
    address: "Österlånggatan 9, 111 31 Stockholm",
    cuisine: "Klassisk svensk",
    neighborhood: "Gamla Stan",
    city: "Stockholm",
    rating: 4.6,
    priceLevel: 3,
    seatType: "indoor",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
    description: "Husmanskost och klassisk svensk matlagning i Gamla Stans hjärta.",
    tags: ["Husmanskost", "Trivsam", "Historisk miljö"],
    vibeTags: ["Traditionell", "Varm"],
    website: null,
    instagram: "@restaurangjonas",
  },
  {
    name: "Sturehof",
    address: "Stureplan 2, 114 35 Stockholm",
    cuisine: "Fisk och skaldjur",
    neighborhood: "Östermalm",
    city: "Stockholm",
    rating: 4.5,
    priceLevel: 3,
    seatType: "indoor",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop",
    description: "Stockholms klassiska hak för fisk och skaldjur sedan 1897.",
    tags: ["Klassiker", "Skaldjur", "Stureplan"],
    vibeTags: ["Livlig", "Business"],
    website: "https://sturehof.com",
    instagram: "@sturehof",
  },
  {
    name: "Lux Dag för Dag",
    address: "Primusgatan 116, 112 67 Stockholm",
    cuisine: "Modern svensk",
    neighborhood: "Lilla Essingen",
    city: "Stockholm",
    rating: 4.7,
    priceLevel: 3,
    seatType: "indoor",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cfd6d0d7?w=800&h=600&fit=crop",
    description: "Säsongsbetonad matlagning med råvaror från hela Sverige.",
    tags: ["Säsongsbetonat", "Lokalt", "Romantisk"],
    vibeTags: ["Lugn", "Exklusiv"],
    website: "https://luxdagfordag.se",
    instagram: "@luxdagfordag",
  },
  {
    name: "Brasserie Astoria",
    address: "Birger Jarlsgatan 35, 111 45 Stockholm",
    cuisine: "Fransk",
    neighborhood: "Östermalm",
    city: "Stockholm",
    rating: 4.4,
    priceLevel: 3,
    seatType: "indoor",
    image: "https://images.unsplash.com/photo-1428515613728-6b4607e44363?w=800&h=600&fit=crop",
    description: "Parisisk bistromiljö mitt i Stockholm med klassisk fransk meny.",
    tags: ["Franskt", "Brasserie", "Centralt"],
    vibeTags: ["Elegant", "Livlig"],
    website: null,
    instagram: "@brasserieastoria",
  },
  {
    name: "Omakase by Ryoki",
    address: "Rådmansgatan 16, 113 25 Stockholm",
    cuisine: "Japanskt",
    neighborhood: "Vasastan",
    city: "Stockholm",
    rating: 4.9,
    priceLevel: 4,
    seatType: "indoor",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop",
    description: "Exklusiv omakase-upplevelse med säsongsbetonad japansk meny för max 8 gäster.",
    tags: ["Omakase", "Japanskt", "Exklusivt"],
    vibeTags: ["Intim", "Specialtillfälle"],
    website: null,
    instagram: "@omakasebyryoki",
  },
  {
    name: "Fotografiska Matsalen",
    address: "Stadsgårdshamnen 22, 116 45 Stockholm",
    cuisine: "Vegetarisk",
    neighborhood: "Södermalm",
    city: "Stockholm",
    rating: 4.6,
    priceLevel: 3,
    seatType: "indoor",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop",
    description: "Vegetarisk restaurang med utsikt över Stockholms inlopp.",
    tags: ["Vegetariskt", "Utsikt", "Konstupplevelse"],
    vibeTags: ["Kreativ", "Modern"],
    website: "https://fotografiska.com",
    instagram: "@fotografiska",
  },
  {
    name: "Pontus!",
    address: "Brunnsgränd 1, 111 30 Stockholm",
    cuisine: "Modern europeisk",
    neighborhood: "Gamla Stan",
    city: "Stockholm",
    rating: 4.5,
    priceLevel: 3,
    seatType: "indoor",
    image: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&h=600&fit=crop",
    description: "Pontus Frithiofs klassiker med modern europeisk mat i Gamla Stan.",
    tags: ["Klassiker", "Gamla Stan", "Europeiskt"],
    vibeTags: ["Elegant", "Romantisk"],
    website: "https://pontusfrithiof.com",
    instagram: "@pontusfrithiof",
  },
  {
    name: "Esperanto",
    address: "Kungstensgatan 2, 113 57 Stockholm",
    cuisine: "Asiatisk fusion",
    neighborhood: "Vasastan",
    city: "Stockholm",
    rating: 4.6,
    priceLevel: 3,
    seatType: "indoor",
    image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop",
    description: "Asiatisk fusion i modern tappning — en av Stockholms mest hyllade krogar.",
    tags: ["Asiatiskt", "Fusion", "Prisbelönt"],
    vibeTags: ["Modern", "Livlig"],
    website: null,
    instagram: "@esperantorestaurant",
  },
];

const TEST_USERS = [
  { phone: "+46701234567", firstName: "Anna", lastName: "Svensson", email: "anna@test.se", credits: 5, selectedCity: "Stockholm" },
  { phone: "+46709876543", firstName: "Erik", lastName: "Lindberg", email: "erik@test.se", credits: 2, selectedCity: "Stockholm" },
];

async function main() {
  console.log("🌱 Seeding database...");

  await db.reservation.deleteMany({});
  await db.savedRestaurant.deleteMany({});
  await db.activityAlert.deleteMany({});
  await db.watch.deleteMany({});
  await db.userProfile.deleteMany({ where: { phone: { in: TEST_USERS.map((u) => u.phone) } } });
  await db.restaurant.deleteMany({});

  console.log("🗑  Cleared existing seed data");

  const restaurants = await Promise.all(
    RESTAURANTS.map((r) =>
      db.restaurant.create({
        data: {
          name: r.name,
          address: r.address,
          cuisine: r.cuisine,
          neighborhood: r.neighborhood,
          city: r.city,
          rating: r.rating,
          priceLevel: r.priceLevel,
          seatType: r.seatType,
          image: r.image,
          description: r.description,
          tags: r.tags,
          vibeTags: r.vibeTags,
          website: r.website ?? null,
          instagram: r.instagram ?? null,
        },
      })
    )
  );

  console.log(`✅ Created ${restaurants.length} restaurants`);

  const users = await Promise.all(
    TEST_USERS.map((u) =>
      db.userProfile.create({
        data: {
          phone: u.phone,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          credits: u.credits,
          selectedCity: u.selectedCity,
          phoneVerified: true,
          emailVerified: false,
          trustScore: 5.0,
        },
      })
    )
  );

  console.log(`✅ Created ${users.length} test users`);

  const today = new Date();
  const reservationDefs = [
    { restaurantIdx: 0, dayOffset: 1, time: "19:00", party: 2, submitterIdx: 0, prepaidAmount: null, cancelFee: null },
    { restaurantIdx: 1, dayOffset: 2, time: "20:00", party: 4, submitterIdx: 1, prepaidAmount: 450, cancelFee: 450 },
    { restaurantIdx: 2, dayOffset: 2, time: "18:30", party: 2, submitterIdx: 0, prepaidAmount: null, cancelFee: null },
    { restaurantIdx: 3, dayOffset: 3, time: "19:30", party: 3, submitterIdx: 1, prepaidAmount: null, cancelFee: 150 },
    { restaurantIdx: 4, dayOffset: 3, time: "20:30", party: 2, submitterIdx: 0, prepaidAmount: 600, cancelFee: 600 },
    { restaurantIdx: 5, dayOffset: 4, time: "19:00", party: 5, submitterIdx: 1, prepaidAmount: null, cancelFee: null },
    { restaurantIdx: 6, dayOffset: 5, time: "20:00", party: 2, submitterIdx: 0, prepaidAmount: 1200, cancelFee: 1200 },
    { restaurantIdx: 7, dayOffset: 6, time: "18:00", party: 4, submitterIdx: 1, prepaidAmount: null, cancelFee: null },
    { restaurantIdx: 8, dayOffset: 7, time: "19:30", party: 2, submitterIdx: 0, prepaidAmount: null, cancelFee: 200 },
    { restaurantIdx: 9, dayOffset: 8, time: "20:00", party: 3, submitterIdx: 1, prepaidAmount: 750, cancelFee: 750 },
    { restaurantIdx: 0, dayOffset: 10, time: "19:00", party: 2, submitterIdx: 0, prepaidAmount: null, cancelFee: null },
    { restaurantIdx: 2, dayOffset: 12, time: "18:30", party: 6, submitterIdx: 1, prepaidAmount: null, cancelFee: null },
  ];

  for (const r of reservationDefs) {
    const date = new Date(today);
    date.setDate(today.getDate() + r.dayOffset);
    const submitter = TEST_USERS[r.submitterIdx];
    const restaurant = restaurants[r.restaurantIdx];

    await db.reservation.create({
      data: {
        restaurantId: restaurant.id,
        submitterPhone: submitter.phone,
        submitterFirstName: submitter.firstName,
        submitterLastName: submitter.lastName,
        reservationDate: date,
        reservationTime: r.time,
        partySize: r.party,
        seatType: "indoor",
        prepaidAmount: r.prepaidAmount,
        cancelFee: r.cancelFee,
        status: "active",
        nameOnReservation: `${submitter.firstName} ${submitter.lastName}`,
      },
    });
  }

  console.log(`✅ Created ${reservationDefs.length} active reservations`);
  console.log("\n🎉 Seed complete!");
  console.log("\nTest users:");
  TEST_USERS.forEach((u) => console.log(`  ${u.phone} — ${u.firstName} ${u.lastName} (${u.credits} credits)`));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
