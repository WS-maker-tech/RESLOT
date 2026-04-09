import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: { message: "Unauthorized" } });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: { message: "Unauthorized" } });

  if (req.method === "GET") {
    const { data, error } = await supabase.from("UserProfile").select("*").eq("id", user.id).single();
    if (error) return res.status(404).json({ error: { message: error.message } });
    return res.status(200).json({ data });
  }

  if (req.method === "PUT") {
    const { data, error } = await supabase.from("UserProfile").update(req.body).eq("id", user.id).select().single();
    if (error) return res.status(500).json({ error: { message: error.message } });
    return res.status(200).json({ data });
  }

  return res.status(405).end();
}
