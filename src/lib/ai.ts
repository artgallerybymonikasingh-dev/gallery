import "server-only";

// Uses the Google Gemini API's free tier (ai.google.dev) for image
// captioning — the only vision-capable AI API with a genuine no-cost tier,
// which matters since this whole project is meant to run at $0. Requires
// GEMINI_API_KEY; callers should treat a missing key as "feature disabled",
// not an error, so the rest of the app works without it.
// Verified working against this project's API key. Google periodically
// retires model versions (this replaced "gemini-2.0-flash", which started
// 404ing) — if this one stops working, list currently available models with:
//   node --env-file=.env.local -e "fetch('https://generativelanguage.googleapis.com/v1beta/models?key='+process.env.GEMINI_API_KEY).then(r=>r.json()).then(d=>d.models.forEach(m=>console.log(m.name)))"
// and update GEMINI_MODEL (env var) or this default.
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

export function isAiDescriptionConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function suggestDescription(imageBuffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AI descriptions aren't set up yet. Add a free GEMINI_API_KEY from https://aistudio.google.com/apikey to enable this."
    );
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt =
    "Write a short, tasteful gallery-style description of this artwork for a website, " +
    "in 2-3 sentences and no more than 100 words. Describe the subject, style, mood, and " +
    "notable colors or technique. Do not guess a title, price, or the artist's name. " +
    "Plain text only, no markdown.";

  const body = JSON.stringify({
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: imageBuffer.toString("base64") } },
        ],
      },
    ],
  });

  // The free tier occasionally returns 503 "high demand" — one quick retry
  // clears most of them without making the admin wait too long.
  let response: Response;
  for (let attempt = 1; attempt <= 2; attempt++) {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (response.ok || response.status !== 503 || attempt === 2) break;
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  if (!response!.ok) {
    const detail = await response!.text().catch(() => "");
    throw new Error(
      `AI description request failed (${response!.status}). ${detail.slice(0, 200)}`
    );
  }

  const data = await response!.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("AI description request returned no text.");

  return capAtWords(text.trim(), 100);
}

function capAtWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
}
