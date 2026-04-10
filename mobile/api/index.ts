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
    return res.status(200).json({ data });
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

  // GET /api/reservations/:id
  const reservationIdMatch = path.match(/^reservations\/([^/]+)$/);
  if (reservationIdMatch && req.method === "GET") {
    const id = reservationIdMatch[1];
    const { data, error } = await supabase.from("Reservation")
      .select("*, Restaurant:restaurantId(*)").eq("id", id).single();
    if (error) return res.status(404).json({ error: { message: error.message } });
    return res.status(200).json({ data });
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
    return res.status(200).json({ data: { ...restaurant, reservations: reservations || [] } });
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

  // Stub routes (not yet implemented)
  const stubs = ["alerts", "alerts/read", "alerts/restaurant-alerts", "saved-restaurants", "support", "referral/code", "referral/use", "credits/card-status", "credits/purchase", "credits/setup-card"];
  if (stubs.some(s => path === s || path.startsWith(s + "/"))) {
    return res.status(200).json({ data: Array.isArray([]) ? [] : { success: true } });
  }

  return res.status(404).json({ error: { message: `Route not found: ${path}` } });
}
