// One-time import of the photos already sitting in images/ into Supabase.
//
// Layout convention:
//   images/<file>.jpg          -> goes into a gallery called "Gallery 1"
//   images/<folder>/<file>.jpg -> each subfolder becomes its own gallery,
//                                 named from the folder (e.g. "gallery2" -> "Gallery 2")
//
// All photos are attributed to the artist "Monika Singh" (created if missing).
// Re-running skips any gallery whose title already exists, so it's safe to
// run again after adding a new subfolder.
//
// Usage (from the project root, after supabase/schema.sql has been run):
//   node --env-file=.env.local scripts/seed-existing-images.mjs

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const IMAGES_DIR = path.join(process.cwd(), "images");
const BUCKET = "artwork-images";
const ARTIST_NAME = "Monika Singh";
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with: node --env-file=.env.local scripts/seed-existing-images.mjs"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function prettifyFolderName(folderName) {
  return folderName
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function listImageFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && IMAGE_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort(naturalSort);
}

async function ensureArtist() {
  const { data: existing } = await supabase
    .from("artists")
    .select("id")
    .eq("name", ARTIST_NAME)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("artists")
    .insert({ name: ARTIST_NAME })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create artist: ${error.message}`);
  console.log(`Created artist "${ARTIST_NAME}"`);
  return data.id;
}

async function seedGallery({ title, artistId, folderPath }) {
  const { data: existing } = await supabase
    .from("galleries")
    .select("id")
    .eq("title", title)
    .maybeSingle();

  if (existing) {
    console.log(`Skipping "${title}" — a gallery with this title already exists.`);
    return;
  }

  const files = await listImageFiles(folderPath);
  if (files.length === 0) {
    console.log(`Skipping "${title}" — no image files found in ${folderPath}`);
    return;
  }

  const { data: gallery, error: galleryError } = await supabase
    .from("galleries")
    .insert({ title, artist_id: artistId })
    .select("id")
    .single();

  if (galleryError) throw new Error(`Failed to create gallery "${title}": ${galleryError.message}`);

  console.log(`Created gallery "${title}" (${files.length} photos)`);

  let coverUrl = null;

  for (const [index, fileName] of files.entries()) {
    const filePath = path.join(folderPath, fileName);
    const rawBuffer = await readFile(filePath);
    const webpBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const storagePath = `${gallery.id}/${randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, webpBuffer, { contentType: "image/webp" });

    if (uploadError) {
      console.error(`  Failed to upload ${fileName}: ${uploadError.message}`);
      continue;
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    const { error: insertError } = await supabase.from("artworks").insert({
      gallery_id: gallery.id,
      title: `Untitled ${index + 1}`,
      image_url: pub.publicUrl,
      storage_path: storagePath,
      sort_order: index,
    });

    if (insertError) {
      console.error(`  Failed to save "${fileName}" in the database: ${insertError.message}`);
      continue;
    }

    if (!coverUrl) coverUrl = pub.publicUrl;
    console.log(`  Uploaded ${fileName} -> Untitled ${index + 1}`);
  }

  if (coverUrl) {
    await supabase.from("galleries").update({ cover_image_url: coverUrl }).eq("id", gallery.id);
  }
}

async function main() {
  const artistId = await ensureArtist();
  const entries = await readdir(IMAGES_DIR, { withFileTypes: true });

  const rootFiles = await listImageFiles(IMAGES_DIR);
  if (rootFiles.length > 0) {
    await seedGallery({ title: "Gallery 1", artistId, folderPath: IMAGES_DIR });
  }

  const subfolders = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort(naturalSort);
  for (const folderName of subfolders) {
    const folderPath = path.join(IMAGES_DIR, folderName);
    if (!(await stat(folderPath)).isDirectory()) continue;
    await seedGallery({
      title: prettifyFolderName(folderName),
      artistId,
      folderPath,
    });
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
