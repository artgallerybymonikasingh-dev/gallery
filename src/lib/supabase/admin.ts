import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for privileged writes (admin CRUD, image uploads).
// Bypasses Row Level Security entirely, so it must only ever be used inside
// 'use server' Server Actions AFTER verifying the caller has an authenticated
// admin session (see requireAdmin in lib/auth.ts). Never import this from a
// Client Component or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
