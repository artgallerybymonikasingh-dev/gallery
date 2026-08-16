"use server";

import { createClient } from "@/lib/supabase/server";

// Public-facing — anyone can call these, so they deliberately use the
// anon-key client (respects RLS) rather than the service-role admin
// client. The "appreciations" INSERT policy only allows approved=false
// rows, so a visitor can never make their own message go live; only the
// admin (service role, in admin/actions.ts) can approve or delete one.

function validateMessage(formData: FormData): { name: string | null; message: string } | { error: string } {
  const message = String(formData.get("message") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!message) return { error: "Please write a short message." };
  if (message.length > 500) return { error: "Please keep it under 500 characters." };
  if (name.length > 80) return { error: "Name is too long." };

  return { name: name || null, message };
}

export async function submitArtworkAppreciation(
  artworkId: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = validateMessage(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("appreciations").insert({
    artwork_id: artworkId,
    name: parsed.name,
    message: parsed.message,
  });

  if (error) return { error: "Something went wrong. Please try again." };
  return { success: true };
}

export async function submitGalleryAppreciation(
  galleryId: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = validateMessage(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("appreciations").insert({
    gallery_id: galleryId,
    name: parsed.name,
    message: parsed.message,
  });

  if (error) return { error: "Something went wrong. Please try again." };
  return { success: true };
}

export async function submitArtistAppreciation(
  artistId: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = validateMessage(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("appreciations").insert({
    artist_id: artistId,
    name: parsed.name,
    message: parsed.message,
  });

  if (error) return { error: "Something went wrong. Please try again." };
  return { success: true };
}
