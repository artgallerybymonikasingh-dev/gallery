import "server-only";
import { createClient } from "@/lib/supabase/server";

// Every Server Action that writes data must call this first — proxy.ts
// protects page navigation, but Server Actions are independently reachable
// POST endpoints and must authenticate themselves (see Next.js Data
// Security guide).
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized: admin login required");
  }

  return user;
}
