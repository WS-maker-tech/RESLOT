import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  const { id } = req.query;
  const { data, error } = await supabase.from("Reservation")
    .update({ claimerPhone: null, status: "active", claimedAt: null }).eq("id", id).select().single();
  if (error) return res.status(500).json({ error: { message: error.message } });
  return res.status(200).json({ data });
}
