import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Session-aware client for use in Server Components, Server Actions, and
// proxy.ts. Reads/writes the admin's auth cookies. Respects RLS (read-only
// for the public tables) — use lib/supabase/admin.ts for privileged writes.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render; ignored because
            // proxy.ts refreshes the session on navigation instead.
          }
        },
      },
    }
  );
}
