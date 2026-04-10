import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(200).json({ data: [] });
  const { data: { user } } = await supabase.auth.getUser(token);
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
  return res.status(405).end();
}
