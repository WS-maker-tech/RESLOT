import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;

  const { data: restaurant, error: rErr } = await supabase
    .from("Restaurant").select("*").eq("id", id).single();
  if (rErr) return res.status(404).json({ error: { message: rErr.message } });

  const { data: reservations } = await supabase
    .from("Reservation").select("*").eq("restaurantId", id).eq("status", "active");

  return res.status(200).json({ data: { ...restaurant, reservations: reservations || [] } });
}
