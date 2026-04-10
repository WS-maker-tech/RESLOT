import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  const { id } = req.query;
  const token = req.headers.authorization?.replace("Bearer ", "");
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
  const { worked, comment } = req.body || {};
  const { data, error } = await supabase.from("ReservationFeedback")
    .insert([{ reservationId: id, userId: user?.id, worked, comment }]).select("id, worked").single();
  if (error) return res.status(500).json({ error: { message: error.message } });
  return res.status(200).json({ data });
}
