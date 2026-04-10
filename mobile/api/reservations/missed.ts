import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { city } = req.query;

  let query = supabase
    .from("Reservation")
    .select("*, Restaurant:restaurantId(id, name, city, image, neighborhood)")
    .eq("status", "claimed")
    .order("claimedAt", { ascending: false })
    .limit(5);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: { message: error.message } });

  let filtered = data || [];
  if (city) filtered = filtered.filter((r: any) => r.Restaurant?.city === city);

  return res.status(200).json({ data: filtered });
}
