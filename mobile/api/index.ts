import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUser(token?: string) {
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const path = (req.query.path as string) || "";
  const token = req.headers.authorization?.replace("Bearer ", "");

  // Helper: normalize Reservation (PascalCase -> camelCase for frontend)
  function normalize(r: any) {
    if (!r) return r;
    const { Restaurant, ...rest } = r;
    return { ...rest, restaurant: Restaurant ?? null };
  }

  // GET /api/reservations
  if (path === "reservations" && req.method === "GET") {
    const { city, neighborhood, date } = req.query;
    const { data, error } = await supabase
      .from("Reservation")
      .select("*, Restaurant:restaurantId(id, name, city, address, latitude, longitude, image, neighborhood, cuisine, rating, priceLevel, vibeTags)")
      .eq("status", "active");
    if (error) return res.status(500).json({ error: { message: error.message } });
    let filtered = (data || []).map(normalize);
    if (city) filtered = filtered.filter((r: any) => r.restaurant?.city === city);
    if (neighborhood && neighborhood !== "Alla") filtered = filtered.filter((r: any) => r.restaurant?.neighborhood === neighborhood);
    if (date) filtered = filtered.filter((r: any) => r.reservationDate === date);
    return res.status(200).json({ data: filtered });
  }

  // POST /api/reservations — create new reservation
  if (path === "reservations" && req.method === "POST") {
    const body = req.body || {};
    const { data, error } = await supabase
      .from("Reservation")
      .insert([{ ...body, status: "active" }])
      .select("*, Restaurant:restaurantId(*)")
      .single();
    if (error) return res.status(500).json({ error: { message: error.message } });
    return res.status(200).json({ data: normalize(data) });
  }

  // POST /api/admin/seed-future-reservations — generate 20 future-dated active reservations
  // Protected by ?key=<SEED_KEY env or fallback>
  if (path === "admin/seed-future-reservations" && req.method === "POST") {
    const provided = (req.query.key as string) || (req.body && req.body.key) || "";
    const expected = process.env.SEED_KEY || "reslot-cofounder-demo-2026";
    if (provided !== expected) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    const { data: restaurants, error: rErr } = await supabase
      .from("Restaurant")
      .select("id, name");
    if (rErr || !restaurants || restaurants.length === 0) {
      return res.status(500).json({ error: { message: rErr?.message || "No restaurants found" } });
    }

    const times = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
    const seatTypes = ["indoor", "outdoor", "bar"];
    const firstNames = ["Anna", "Erik", "Sara", "Johan", "Emma", "Oscar", "Linnea", "Filip", "Astrid", "Lars", "Maja", "Viktor", "Wilma", "Hugo"];
    const lastNames = ["Andersson", "Svensson", "Lindberg", "Nilsson", "Karlsson", "Johansson", "Eriksson", "Larsson", "Olsson", "Persson"];

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const rows = Array.from({ length: 20 }, (_, i) => {
      const restaurant = restaurants[i % restaurants.length];
      const daysAhead = 1 + Math.floor(i * 1.1);
      const d = new Date(today.getTime() + daysAhead * 86400000);
      const dateStr = d.toISOString().split("T")[0] + "T00:00:00";
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[i % lastNames.length];
      return {
        restaurantId: restaurant.id,
        submitterPhone: `+467${String(10000000 + i * 137).slice(-8)}`,
        submitterFirstName: fn,
        submitterLastName: ln,
        reservationDate: dateStr,
        reservationTime: times[i % times.length],
        partySize: 2 + (i % 5),
        seatType: seatTypes[i % seatTypes.length],
        nameOnReservation: `${fn} ${ln}`,
        status: "active",
        creditCost: 1 + (i % 3),
      };
    });

    const { data: inserted, error: iErr } = await supabase
      .from("Reservation")
      .insert(rows)
      .select("id, restaurantId, reservationDate, reservationTime, status");
    if (iErr) return res.status(500).json({ error: { message: iErr.message } });

    return res.status(200).json({
      data: inserted,
      count: inserted?.length || 0,
      message: `Seeded ${inserted?.length || 0} future reservations`,
    });
  }

  // GET /api/reservations/missed
  if (path === "reservations/missed" && req.method === "GET") {
    const { city } = req.query;
    const { data } = await supabase.from("Reservation")
      .select("*, Restaurant:restaurantId(id, name, city, image, neighborhood)")
      .eq("status", "claimed").order("claimedAt", { ascending: false }).limit(5);
    let filtered = (data || []).map(normalize);
    if (city) filtered = filtered.filter((r: any) => r.restaurant?.city === city);
    return res.status(200).json({ data: filtered });
  }

  // GET /api/reservations/mine
  if (path === "reservations/mine" && req.method === "GET") {
    const user = await getUser(token);
    if (!user) return res.status(200).json({ data: [] });
    const phone = user.phone;
    const { data } = await supabase.from("Reservation")
      .select("*, Restaurant:restaurantId(id, name, city, address, image, neighborhood, latitude, longitude)")
      .or(phone ? `submitterPhone.eq.${phone},claimerPhone.eq.${phone}` : `id.eq.none`);
    return res.status(200).json({ data: (data || []).map(normalize) });
  }

  // POST /api/reservations/:id/claim
  const claimMatch = path.match(/^reservations\/([^/]+)\/claim$/);
  if (claimMatch && req.method === "POST") {
    const id = claimMatch[1];
    const user = await getUser(token);
    if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });
    const { data, error } = await supabase.from("Reservation")
      .update({ claimerPhone: user.phone, status: "claimed", claimedAt: new Date().toISOString() })
      .eq("id", id).select("*, Restaurant:restaurantId(*)").single();
    if (error) return res.status(500).json({ error: { message: error.message } });
    return res.status(200).json({ data: normalize(data) });
  }

  // PATCH /api/reservations/:id/cancel
  const cancelMatch = path.match(/^reservations\/([^/]+)\/cancel$/);
  if (cancelMatch && (req.method === "PATCH" || req.method === "POST")) {
    const id = cancelMatch[1];
    const { data, error } = await supabase.from("Reservation")
      .update({ status: "cancelled" }).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: { message: error.message } });
    return res.status(200).json({ data });
  }

  // POST /api/reservations/:id/cancel-claim
  const cancelClaimMatch = path.match(/^reservations\/([^/]+)\/cancel-claim$/);
  if (cancelClaimMatch && req.method === "POST") {
    const id = cancelClaimMatch[1];
    const { data, error } = await supabase.from("Reservation")
      .update({ claimerPhone: null, status: "active", claimedAt: null }).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: { message: error.message } });
    return res.status(200).json({ data });
  }

  // POST /api/reservations/:id/feedback
  const feedbackMatch = path.match(/^reservations\/([^/]+)\/feedback$/);
  if (feedbackMatch && req.method === "POST") {
    const id = feedbackMatch[1];
    const user = await getUser(token);
    const { worked, comment } = req.body || {};
    const { data, error } = await supabase.from("ReservationFeedback")
      .insert([{ reservationId: id, userId: user?.id, worked, comment }]).select("id, worked").single();
    if (error) return res.status(500).json({ error: { message: error.message } });
    return res.status(200).json({ data });
  }

  // GET /api/reservations/:id (also handles restaurant-id fallback)
  const reservationIdMatch = path.match(/^reservations\/([^/]+)$/);
  if (reservationIdMatch && req.method === "GET") {
    const id = reservationIdMatch[1];
    // Try as reservation ID first
    const { data, error } = await supabase.from("Reservation")
      .select("*, Restaurant:restaurantId(*)").eq("id", id).single();
    if (!error && data) return res.status(200).json({ data: normalize(data) });
    // Fallback: try as restaurant ID — find first active reservation for it
    const { data: byRestaurant } = await supabase.from("Reservation")
      .select("*, Restaurant:restaurantId(*)").eq("restaurantId", id).eq("status", "active").order("reservationDate", { ascending: true }).limit(1);
    if (byRestaurant && byRestaurant.length > 0) return res.status(200).json({ data: normalize(byRestaurant[0]) });
    // Fallback: return restaurant as pseudo-reservation
    const { data: restaurant } = await supabase.from("Restaurant").select("*").eq("id", id).single();
    if (restaurant) return res.status(200).json({ data: { id, restaurant, status: "info_only" } });
    return res.status(404).json({ error: { message: "Not found" } });
  }

  // GET /api/restaurants/new-on-reslot
  if (path === "restaurants/new-on-reslot" && req.method === "GET") {
    const { data } = await supabase.from("Restaurant").select("*").order("createdAt", { ascending: false }).limit(10);
    return res.status(200).json({ data: data || [] });
  }

  // GET /api/restaurants/:id
  const restaurantIdMatch = path.match(/^restaurants\/([^/]+)$/);
  if (restaurantIdMatch && req.method === "GET") {
    const id = restaurantIdMatch[1];
    const { data: restaurant, error } = await supabase.from("Restaurant").select("*").eq("id", id).single();
    if (error) return res.status(404).json({ error: { message: error.message } });
    const { data: reservations } = await supabase.from("Reservation").select("*").eq("restaurantId", id).eq("status", "active");
    // Normalize reservations and map to frontend-expected field names
    const normalizedReservations = (reservations || []).map((r: any) => ({
      ...r,
      restaurant: restaurant,
    }));
    return res.status(200).json({ data: { ...restaurant, reservations: normalizedReservations } });
  }

  // GET /api/restaurants
  if (path === "restaurants" && req.method === "GET") {
    const { city, neighborhood, search } = req.query;
    let query = supabase.from("Restaurant").select("*");
    if (city) query = query.eq("city", city);
    if (neighborhood && neighborhood !== "Alla") query = query.eq("neighborhood", neighborhood);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: { message: error.message } });
    return res.status(200).json({ data: data || [] });
  }

  // GET/PUT /api/profile
  if (path === "profile" && req.method === "GET") {
    const user = await getUser(token);
    if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });
    const { data, error } = await supabase.from("UserProfile").select("*").eq("id", user.id).single();
    if (error) return res.status(404).json({ error: { message: error.message } });
    return res.status(200).json({ data });
  }
  if (path === "profile" && (req.method === "PUT" || req.method === "PATCH")) {
    const user = await getUser(token);
    if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });
    const { data, error } = await supabase.from("UserProfile").update(req.body).eq("id", user.id).select().single();
    if (error) return res.status(500).json({ error: { message: error.message } });
    return res.status(200).json({ data });
  }

  // POST /api/profile/push-token
  if (path === "profile/push-token" && req.method === "POST") {
    const user = await getUser(token);
    if (user) await supabase.from("UserProfile").update({ pushToken: req.body?.token }).eq("id", user.id);
    return res.status(200).json({ data: { success: true } });
  }

  // GET /api/auth/me
  if (path === "auth/me" && req.method === "GET") {
    const user = await getUser(token);
    if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });
    const { data } = await supabase.from("UserProfile").select("*").eq("id", user.id).single();
    return res.status(200).json({ data: data || { id: user.id } });
  }

  // GET/POST /api/watches
  if (path === "watches") {
    const user = await getUser(token);
    if (!user) return res.status(200).json({ data: [] });
    if (req.method === "GET") {
      const { data } = await supabase.from("Watch").select("*, Restaurant:restaurantId(id, name, city, image)").eq("userPhone", user.phone ?? user.id);
      return res.status(200).json({ data: data || [] });
    }
    if (req.method === "POST") {
      const { data, error } = await supabase.from("Watch").insert([{ ...req.body, userPhone: user.phone ?? user.id }]).select().single();
      if (error) return res.status(500).json({ error: { message: error.message } });
      return res.status(200).json({ data });
    }
  }

  // DELETE /api/watches/:id
  const watchIdMatch = path.match(/^watches\/([^/]+)$/);
  if (watchIdMatch && req.method === "DELETE") {
    await supabase.from("Watch").delete().eq("id", watchIdMatch[1]);
    return res.status(200).json({ data: { success: true } });
  }

    // POST /api/reservations — skapa ny bokning (submit-flödet)
  if (path === "reservations" && req.method === "POST") {
    const { nanoid } = await import("nanoid");
    const body = req.body;
    const id = nanoid();
    const { data, error } = await supabase.from("Reservation").insert([{
      id,
      restaurantId: body.restaurantId,
      submitterPhone: body.submitterPhone,
      submitterFirstName: body.submitterFirstName,
      submitterLastName: body.submitterLastName,
      reservationDate: body.reservationDate,
      reservationTime: body.reservationTime,
      partySize: body.partySize,
      seatType: body.seatType,
      nameOnReservation: body.nameOnReservation,
      status: "active",
      cancelFee: body.cancelFee ?? null,
      prepaidAmount: body.prepaidAmount ?? null,
      extraInfo: body.extraInfo ?? null,
      creditCost: 2,
    }]).select().single();
    if (error) return res.status(500).json({ error: { message: error.message } });
    return res.status(201).json({ data });
  }

  // GET /api/admin/seed-reservations — sätter upp exempeldata (temporärt, ta bort efter test)
  if (path === "admin/seed-reservations" && req.method === "GET") {
    const { nanoid } = await import("nanoid");
    function offsetDate(days: number): string {
      const d = new Date();
      d.setDate(d.getDate() + days);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    // Hämta restaurang-IDs
    const { data: rests } = await supabase.from("Restaurant").select("id, name").eq("city", "Stockholm").limit(10);
    if (!rests || rests.length === 0) return res.status(500).json({ error: { message: "Inga restauranger hittades" } });

    const bookings = [
      { ri: 0, days: 0, time: "18:30", party: 2, fn: "Anna", ln: "Lindgren" },
      { ri: 1, days: 0, time: "19:00", party: 4, fn: "Erik", ln: "Svensson" },
      { ri: 2, days: 0, time: "20:00", party: 2, fn: "Maria", ln: "Bergöström" },
      { ri: 3, days: 0, time: "19:30", party: 3, fn: "Johan", ln: "Lindqvist" },
      { ri: 4, days: 0, time: "17:30", party: 2, fn: "Sofia", ln: "Karlsson" },
      { ri: 0, days: 1, time: "19:00", party: 2, fn: "Anders", ln: "Nilsson" },
      { ri: 1, days: 1, time: "18:30", party: 2, fn: "Klara", ln: "Björk" },
      { ri: 2, days: 1, time: "20:00", party: 4, fn: "Marcus", ln: "Holm" },
      { ri: 5, days: 1, time: "19:30", party: 2, fn: "Emma", ln: "Wahlberg" },
      { ri: 6, days: 1, time: "20:30", party: 3, fn: "David", ln: "Ek" },
      { ri: 7, days: 2, time: "19:00", party: 2, fn: "Sara", ln: "Lindén" },
      { ri: 8, days: 2, time: "20:00", party: 2, fn: "Henrik", ln: "Strand" },
      { ri: 9, days: 2, time: "18:00", party: 4, fn: "Lina", ln: "Persson" },
      { ri: 3, days: 2, time: "19:00", party: 2, fn: "Pontus", ln: "Engström" },
      { ri: 4, days: 3, time: "19:30", party: 2, fn: "Maja", ln: "Hellström" },
      { ri: 0, days: 3, time: "18:30", party: 3, fn: "Oscar", ln: "Rydén" },
      { ri: 1, days: 3, time: "20:00", party: 2, fn: "Julia", ln: "Nordin" },
      { ri: 5, days: 4, time: "19:00", party: 4, fn: "Viktor", ln: "Sjöberg" },
      { ri: 6, days: 4, time: "18:30", party: 2, fn: "Hanna", ln: "Lindblom" },
      { ri: 7, days: 4, time: "20:00", party: 2, fn: "Tobias", ln: "Engel" },
      { ri: 8, days: 5, time: "19:30", party: 2, fn: "Cecilia", ln: "Strand" },
      { ri: 9, days: 5, time: "18:00", party: 4, fn: "Filip", ln: "Magnusson" },
      { ri: 2, days: 5, time: "20:30", party: 2, fn: "Annika", ln: "Johansson" },
    ];

    const created = [];
    const errors = [];
    for (const b of bookings) {
      const rest = rests[b.ri % rests.length];
      if (!rest) continue;
      const { data, error } = await supabase.from("Reservation").insert([{
        id: nanoid(),
        restaurantId: rest.id,
        submitterPhone: "+46709000099",
        submitterFirstName: b.fn,
        submitterLastName: b.ln,
        reservationDate: offsetDate(b.days),
        reservationTime: b.time,
        partySize: b.party,
        seatType: "Inne",
        nameOnReservation: b.ln,
        status: "active",
        creditCost: 2,
      }]).select("id").single();
      if (error) errors.push(error.message);
      else created.push(data?.id);
    }
    return res.status(200).json({ data: { created: created.length, errors } });
  }

  // Stub routes (not yet implemented)
  const stubs = ["alerts", "alerts/read", "alerts/restaurant-alerts", "saved-restaurants", "support", "referral/code", "referral/use", "credits/card-status", "credits/purchase", "credits/setup-card"];
  if (stubs.some(s => path === s || path.startsWith(s + "/"))) {
    return res.status(200).json({ data: Array.isArray([]) ? [] : { success: true } });
  }

  return res.status(404).json({ error: { message: `Route not found: ${path}` } });
}
