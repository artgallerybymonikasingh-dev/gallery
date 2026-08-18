import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "") // also strips leftover combining marks from NFKD-decomposed accents
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "item";
}

// Appends -2, -3, ... until it finds a slug not already used in `table`.
export async function ensureUniqueSlug(
  admin: SupabaseClient,
  table: "artists" | "galleries" | "exhibitions" | "artworks",
  base: string
): Promise<string> {
  const baseSlug = slugify(base);
  let candidate = baseSlug;
  let attempt = 2;

  while (true) {
    const { data } = await admin.from(table).select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${baseSlug}-${attempt}`;
    attempt += 1;
  }
}
