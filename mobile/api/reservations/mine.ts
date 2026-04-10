import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(200).json({ data: [] });
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(200).json({ data: [] });
  const phone = user.phone;
  const { data, error } = await supabase
    .from("Reservation")
    .select("*, Restaurant:restaurantId(id, name, city, address, image, neighborhood, latitude, longitude)")
    .or(phone ? `submitterPhone.eq.${phone},claimerPhone.eq.${phone}` : `submitterPhone.eq.none`);
  return res.status(200).json({ data: data || [] });
}
