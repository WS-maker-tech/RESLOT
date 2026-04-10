import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { data, error } = await supabase
    .from("Restaurant")
    .select("*")
    .order("createdAt", { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: { message: error.message } });
  return res.status(200).json({ data: data || [] });
}
