import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  const { city, neighborhood, search } = req.query;
  let query = supabase.from("Restaurant").select("*");
  if (city) query = query.eq("city", city);
  if (neighborhood && neighborhood !== "Alla") query = query.eq("neighborhood", neighborhood);
  if (search) query = query.ilike("name", `%${search}%`);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: { message: error.message } });
  return res.status(200).json({ data: data || [] });
}
