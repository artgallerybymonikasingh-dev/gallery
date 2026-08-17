import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// The site-wide WhatsApp default lives in the database (editable from
// /admin/settings) rather than only as an env var, since NEXT_PUBLIC_* env
// vars are baked in at build time and can't be changed without a redeploy.
// The env var still works as a bootstrap value before anyone has set one
// in the admin panel.
export const getSiteWhatsappNumber = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("whatsapp_number")
    .eq("id", "default")
    .maybeSingle();
  return data?.whatsapp_number ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
});
