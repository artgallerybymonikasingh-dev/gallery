// Backfills AI-suggested descriptions (100 words max) for every artwork that
// doesn't have one yet — e.g. right after running the seed script, which
// leaves descriptions blank. Skips artworks that already have a description,
// so it's safe to run again after adding new photos.
//
// Usage:
//   node --env-file=.env.local scripts/generate-ai-descriptions.mjs

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with: node --env-file=.env.local scripts/generate-ai-descriptions.mjs"
  );
  process.exit(1);
}

if (!apiKey) {
  console.error(
    "Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey and add it to .env.local."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PROMPT =
  "Write a short, tasteful gallery-style description of this artwork for a website, " +
  "in 2-3 sentences and no more than 100 words. Describe the subject, style, mood, and " +
  "notable colors or technique. Do not guess a title, price, or the artist's name. " +
  "Plain text only, no markdown.";

function capAtWords(text, maxWords) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ") + "…";
}

async function describeImage(imageUrl) {
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Failed to fetch image (${imageRes.status})`);
  const buffer = Buffer.from(await imageRes.arrayBuffer());

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = JSON.stringify({
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: "image/webp", data: buffer.toString("base64") } },
        ],
      },
    ],
  });

  // The free tier occasionally returns 503 "high demand" — worth a couple
  // of retries before giving up on this photo.
  let res;
  for (let attempt = 1; attempt <= 3; attempt++) {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (res.ok || res.status !== 503 || attempt === 3) break;
    await sleep(5000 * attempt);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini request failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text.");
  return capAtWords(text, 100);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { data: artworks, error } = await supabase
    .from("artworks")
    .select("id, title, image_url")
    .or("description.is.null,description.eq.")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load artworks: ${error.message}`);
  if (!artworks || artworks.length === 0) {
    console.log("No artworks are missing a description. Nothing to do.");
    return;
  }

  console.log(`Generating descriptions for ${artworks.length} photo(s)...`);

  for (const [index, artwork] of artworks.entries()) {
    try {
      const description = await describeImage(artwork.image_url);
      const { error: updateError } = await supabase
        .from("artworks")
        .update({ description })
        .eq("id", artwork.id);

      if (updateError) throw new Error(updateError.message);
      console.log(`[${index + 1}/${artworks.length}] "${artwork.title}" -> ${description}`);
    } catch (err) {
      console.error(`[${index + 1}/${artworks.length}] "${artwork.title}" failed: ${err.message}`);
    }

    // Stay well under free-tier rate limits between requests.
    await sleep(4000);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
