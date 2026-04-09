import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { city, neighborhood, date } = req.query;

  let query = supabase
    .from("Reservation")
    .select("*, Restaurant:restaurantId(id, name, city, address, latitude, longitude, image, neighborhood, cuisine, rating, priceLevel, vibeTags)")
    .eq("status", "active");

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: { message: error.message } });

  let filtered = data || [];
  if (city) filtered = filtered.filter((r: any) => r.Restaurant?.city === city);
  if (neighborhood && neighborhood !== "Alla") filtered = filtered.filter((r: any) => r.Restaurant?.neighborhood === neighborhood);
  if (date) filtered = filtered.filter((r: any) => r.reservationDate === date);

  return res.status(200).json({ data: filtered });
}
