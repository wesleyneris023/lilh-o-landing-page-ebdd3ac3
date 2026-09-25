import { createClient } from "@supabase/supabase-js";

const url = import.meta.env['VITE_SUPABASE_URL'] || "https://vcqiggjfozzbqcrzisqc.supabase.co";
const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || "sb_publishable_h9nYFmLSEeTpqKa1Cu1crw_6fjD1EeY";

if (!key) {
  console.warn("Lilhão: VITE_SUPABASE_PUBLISHABLE_KEY não configurada. O app usará o fallback local quando disponível.");
}

export const supabase = createClient(url, key || "", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export const SUPABASE_URL = url;
export const ORDER_FUNCTION_URL = `${url}/functions/v1/criar-pedido`;
