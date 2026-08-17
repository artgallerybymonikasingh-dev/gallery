// One-time backfill: generates a slug for every artist/gallery row that
// doesn't have one yet (i.e. rows created before migration 007_slugs.sql).
// Safe to re-run — rows that already have a slug are skipped.
//
// Usage: node --env-file=.env.local scripts/backfill-slugs.mjs

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with: node --env-file=.env.local scripts/backfill-slugs.mjs"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugify(text) {
  const base = text
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "item";
}

async function ensureUniqueSlug(table, base) {
  const baseSlug = slugify(base);
  let candidate = baseSlug;
  let attempt = 2;

  while (true) {
    const { data } = await supabase.from(table).select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${baseSlug}-${attempt}`;
    attempt += 1;
  }
}

async function backfill(table, nameColumn) {
  const { data: rows, error } = await supabase.from(table).select(`id, ${nameColumn}`).is("slug", null);
  if (error) throw new Error(`Failed to read ${table}: ${error.message}`);

  for (const row of rows ?? []) {
    const slug = await ensureUniqueSlug(table, row[nameColumn]);
    const { error: updateError } = await supabase.from(table).update({ slug }).eq("id", row.id);
    if (updateError) {
      console.error(`Failed to set slug for ${table} "${row[nameColumn]}": ${updateError.message}`);
      continue;
    }
    console.log(`${table}: "${row[nameColumn]}" -> ${slug}`);
  }

  if (!rows || rows.length === 0) {
    console.log(`${table}: nothing to backfill.`);
  }
}

async function main() {
  await backfill("artists", "name");
  await backfill("galleries", "title");
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
