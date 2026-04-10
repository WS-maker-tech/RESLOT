import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(200).json({ data: { success: true } });
  const { data: { user } } = await supabase.auth.getUser(token);
  if (user) await supabase.from("UserProfile").update({ pushToken: req.body?.token }).eq("id", user.id);
  return res.status(200).json({ data: { success: true } });
}
