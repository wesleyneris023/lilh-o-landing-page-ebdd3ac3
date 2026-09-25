import { createClient } from "@supabase/supabase-js";

const SUPABASE_PROJECT_URL = "https://vcqiggjfozzbqcrzisqc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_h9nYFmLSEeTpqKa1Cu1crw_6fjD1EeY";

export const SUPABASE_URL = SUPABASE_PROJECT_URL;
export const ORDER_FUNCTION_URL = `${SUPABASE_PROJECT_URL}/functions/v1/criar-pedido`;

export const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
