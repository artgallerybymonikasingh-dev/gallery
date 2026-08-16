// Creates a sample "Test Artist" with a sample gallery and a few generated
// placeholder images, purely so the site has second-artist content to look
// at and test the "browse by artist" flow with. Everything this script
// creates is clearly labeled as sample data and can be edited or deleted
// from the admin panel at any time.
//
// Usage: node --env-file=.env.local scripts/create-test-artist.mjs

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { randomUUID } from "node:crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with: node --env-file=.env.local scripts/create-test-artist.mjs"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "artwork-images";
const ARTIST_NAME = "Test Artist";
const GALLERY_TITLE = "Sample Gallery (Test Data)";

const PLACEHOLDER_COLORS = [
  { bg: "#F4D9C6", fg: "#7A4A2B", label: "Sample Artwork 1" },
  { bg: "#D6E4E5", fg: "#2C4A4C", label: "Sample Artwork 2" },
  { bg: "#EAD9F0", fg: "#5A3A66", label: "Sample Artwork 3" },
  { bg: "#DDEBD3", fg: "#3D5A2C", label: "Sample Artwork 4" },
];

async function makePlaceholderWebp({ bg, fg, label }) {
  const size = 1200;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bg}" />
      <rect x="60" y="60" width="${size - 120}" height="${size - 120}" fill="none" stroke="${fg}" stroke-width="4" stroke-dasharray="14 10" />
      <text x="50%" y="48%" text-anchor="middle" font-family="sans-serif" font-size="56" fill="${fg}">${label}</text>
      <text x="50%" y="56%" text-anchor="middle" font-family="sans-serif" font-size="28" fill="${fg}">Replace me from the admin panel</text>
    </svg>
  `;
  return sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer();
}

async function ensureArtist() {
  const { data: existing } = await supabase
    .from("artists")
    .select("id")
    .eq("name", ARTIST_NAME)
    .maybeSingle();

  if (existing) {
    console.log(`"${ARTIST_NAME}" already exists, reusing it.`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("artists")
    .insert({
      name: ARTIST_NAME,
      bio: "This is a sample artist profile created for testing. Replace this bio, photo, and contact details from the admin panel, or delete this artist entirely.",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create test artist: ${error.message}`);
  console.log(`Created artist "${ARTIST_NAME}"`);
  return data.id;
}

async function ensureGallery(artistId) {
  const { data: existing } = await supabase
    .from("galleries")
    .select("id")
    .eq("title", GALLERY_TITLE)
    .maybeSingle();

  if (existing) {
    console.log(`"${GALLERY_TITLE}" already exists, reusing it.`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("galleries")
    .insert({
      artist_id: artistId,
      title: GALLERY_TITLE,
      description: "Sample gallery with placeholder images. Replace the photos or delete this gallery from the admin panel.",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create sample gallery: ${error.message}`);
  console.log(`Created gallery "${GALLERY_TITLE}"`);
  return data.id;
}

async function main() {
  const artistId = await ensureArtist();
  const galleryId = await ensureGallery(artistId);

  const { count } = await supabase
    .from("artworks")
    .select("*", { count: "exact", head: true })
    .eq("gallery_id", galleryId);

  if (count && count > 0) {
    console.log(`Gallery already has ${count} photo(s) — skipping image generation.`);
    console.log("Done.");
    return;
  }

  let coverUrl = null;

  for (const [index, spec] of PLACEHOLDER_COLORS.entries()) {
    const webpBuffer = await makePlaceholderWebp(spec);
    const storagePath = `${galleryId}/${randomUUID()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, webpBuffer, { contentType: "image/webp" });
    if (uploadError) {
      console.error(`Failed to upload placeholder ${index + 1}: ${uploadError.message}`);
      continue;
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    const { error: insertError } = await supabase.from("artworks").insert({
      gallery_id: galleryId,
      title: spec.label,
      description: "Placeholder image — replace or delete from the admin panel.",
      image_url: pub.publicUrl,
      storage_path: storagePath,
      sort_order: index,
    });
    if (insertError) {
      console.error(`Failed to save placeholder ${index + 1}: ${insertError.message}`);
      continue;
    }

    if (!coverUrl) coverUrl = pub.publicUrl;
    console.log(`Added ${spec.label}`);
  }

  if (coverUrl) {
    await supabase.from("galleries").update({ cover_image_url: coverUrl }).eq("id", galleryId);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
