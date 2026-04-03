import { createClient } from "@supabase/supabase-js";
import { env } from "../env";

/**
 * Supabase admin client using service role key.
 * Used server-side to verify JWTs and manage auth.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
