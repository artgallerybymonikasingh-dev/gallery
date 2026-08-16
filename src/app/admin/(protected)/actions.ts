"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { toWebp } from "@/lib/webp";
import { suggestDescription } from "@/lib/ai";

const BUCKET = "artwork-images";

function readOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readOptionalNumber(formData: FormData, key: string): number | null {
  const value = readOptionalString(formData, key);
  if (value === null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function uploadImage(file: File, pathPrefix: string) {
  const arrayBuffer = await file.arrayBuffer();
  const webpBuffer = await toWebp(Buffer.from(arrayBuffer));
  const path = `${pathPrefix}/${crypto.randomUUID()}.webp`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, webpBuffer, {
    contentType: "image/webp",
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: pub.publicUrl };
}

async function uploadArtworkImage(file: File, galleryId: string) {
  return uploadImage(file, galleryId);
}

// ---------- AI description ----------

export async function suggestArtworkDescription(
  formData: FormData
): Promise<{ description: string } | { error: string }> {
  await requireAdmin();

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo first." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const description = await suggestDescription(buffer, file.type || "image/jpeg");
    return { description };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to generate a description." };
  }
}

// ---------- Artists ----------

export async function createArtist(formData: FormData) {
  await requireAdmin();
  const name = readOptionalString(formData, "name");
  if (!name) throw new Error("Artist name is required");
  const bio = readOptionalString(formData, "bio");
  const email = readOptionalString(formData, "email");
  const whatsappNumber = readOptionalString(formData, "whatsapp_number");
  const address = readOptionalString(formData, "address");

  let avatarUrl: string | null = null;
  const avatarFile = formData.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    avatarUrl = (await uploadImage(avatarFile, "avatars")).publicUrl;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("artists")
    .insert({ name, bio, email, whatsapp_number: whatsappNumber, address, avatar_url: avatarUrl });
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/about");
  revalidatePath("/contact");
}

export async function updateArtist(artistId: string, formData: FormData) {
  await requireAdmin();
  const name = readOptionalString(formData, "name");
  if (!name) throw new Error("Artist name is required");
  const bio = readOptionalString(formData, "bio");
  const email = readOptionalString(formData, "email");
  const whatsappNumber = readOptionalString(formData, "whatsapp_number");
  const address = readOptionalString(formData, "address");

  const admin = createAdminClient();
  const updates: Record<string, unknown> = {
    name,
    bio,
    email,
    whatsapp_number: whatsappNumber,
    address,
  };

  const avatarFile = formData.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const { data: existing } = await admin
      .from("artists")
      .select("avatar_url")
      .eq("id", artistId)
      .single();

    updates.avatar_url = (await uploadImage(avatarFile, "avatars")).publicUrl;

    if (existing?.avatar_url) {
      const oldPath = existing.avatar_url.split("/artwork-images/")[1];
      if (oldPath) await admin.storage.from(BUCKET).remove([oldPath]);
    }
  }

  const { error } = await admin.from("artists").update(updates).eq("id", artistId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
}

export async function deleteArtist(artistId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: galleries } = await admin
    .from("galleries")
    .select("id")
    .eq("artist_id", artistId);

  for (const gallery of galleries ?? []) {
    await deleteGalleryStorageObjects(gallery.id);
  }

  const { error } = await admin.from("artists").delete().eq("id", artistId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/exhibitions");
}

// ---------- Galleries ----------

export async function createGallery(formData: FormData) {
  await requireAdmin();
  const title = readOptionalString(formData, "title");
  const artistId = readOptionalString(formData, "artist_id");
  if (!title) throw new Error("Gallery title is required");
  if (!artistId) throw new Error("An artist must be selected");
  const description = readOptionalString(formData, "description");
  const whatsappNumber = readOptionalString(formData, "whatsapp_number");

  const admin = createAdminClient();
  const { error } = await admin
    .from("galleries")
    .insert({ title, artist_id: artistId, description, whatsapp_number: whatsappNumber });
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateGallery(galleryId: string, formData: FormData) {
  await requireAdmin();
  const title = readOptionalString(formData, "title");
  if (!title) throw new Error("Gallery title is required");
  const description = readOptionalString(formData, "description");
  const whatsappNumber = readOptionalString(formData, "whatsapp_number");

  const admin = createAdminClient();
  const { error } = await admin
    .from("galleries")
    .update({ title, description, whatsapp_number: whatsappNumber })
    .eq("id", galleryId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath(`/galleries/${galleryId}`);
  revalidatePath("/");
}

async function deleteGalleryStorageObjects(galleryId: string) {
  const admin = createAdminClient();
  const { data: artworks } = await admin
    .from("artworks")
    .select("storage_path")
    .eq("gallery_id", galleryId);

  const paths = (artworks ?? []).map((a) => a.storage_path).filter(Boolean);
  if (paths.length > 0) {
    await admin.storage.from(BUCKET).remove(paths);
  }
}

export async function deleteGallery(galleryId: string) {
  await requireAdmin();
  await deleteGalleryStorageObjects(galleryId);

  const admin = createAdminClient();
  const { error } = await admin.from("galleries").delete().eq("id", galleryId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/");
}

// ---------- Artworks ----------

export async function createArtwork(galleryId: string, formData: FormData) {
  await requireAdmin();

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("A photo is required");
  }

  const title = readOptionalString(formData, "title") ?? "Untitled";
  const description = readOptionalString(formData, "description");
  const widthCm = readOptionalNumber(formData, "width_cm");
  const heightCm = readOptionalNumber(formData, "height_cm");

  const { path, publicUrl } = await uploadArtworkImage(file, galleryId);

  const admin = createAdminClient();
  const { error: insertError } = await admin.from("artworks").insert({
    gallery_id: galleryId,
    title,
    description,
    width_cm: widthCm,
    height_cm: heightCm,
    image_url: publicUrl,
    storage_path: path,
  });
  if (insertError) throw new Error(insertError.message);

  const { data: gallery } = await admin
    .from("galleries")
    .select("cover_image_url")
    .eq("id", galleryId)
    .single();
  if (gallery && !gallery.cover_image_url) {
    await admin.from("galleries").update({ cover_image_url: publicUrl }).eq("id", galleryId);
  }

  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath(`/galleries/${galleryId}`);
  revalidatePath("/");
}

export async function updateArtwork(artworkId: string, galleryId: string, formData: FormData) {
  await requireAdmin();

  const title = readOptionalString(formData, "title") ?? "Untitled";
  const description = readOptionalString(formData, "description");
  const widthCm = readOptionalNumber(formData, "width_cm");
  const heightCm = readOptionalNumber(formData, "height_cm");

  const admin = createAdminClient();
  const updates: Record<string, unknown> = {
    title,
    description,
    width_cm: widthCm,
    height_cm: heightCm,
  };

  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const { data: existing } = await admin
      .from("artworks")
      .select("storage_path")
      .eq("id", artworkId)
      .single();

    const { path, publicUrl } = await uploadArtworkImage(file, galleryId);
    updates.image_url = publicUrl;
    updates.storage_path = path;

    if (existing?.storage_path) {
      await admin.storage.from(BUCKET).remove([existing.storage_path]);
    }
  }

  const { error } = await admin.from("artworks").update(updates).eq("id", artworkId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath(`/galleries/${galleryId}`);
  revalidatePath("/");
}

// ---------- Exhibitions ----------

export async function createExhibition(formData: FormData) {
  await requireAdmin();
  const title = readOptionalString(formData, "title");
  if (!title) throw new Error("Exhibition title is required");

  const admin = createAdminClient();
  const { error } = await admin.from("exhibitions").insert({
    title,
    artist_id: readOptionalString(formData, "artist_id"),
    location: readOptionalString(formData, "location"),
    description: readOptionalString(formData, "description"),
    start_date: readOptionalString(formData, "start_date"),
    end_date: readOptionalString(formData, "end_date"),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/exhibitions");
  revalidatePath("/exhibitions");
}

export async function updateExhibition(exhibitionId: string, formData: FormData) {
  await requireAdmin();
  const title = readOptionalString(formData, "title");
  if (!title) throw new Error("Exhibition title is required");

  const admin = createAdminClient();
  const { error } = await admin
    .from("exhibitions")
    .update({
      title,
      artist_id: readOptionalString(formData, "artist_id"),
      location: readOptionalString(formData, "location"),
      description: readOptionalString(formData, "description"),
      start_date: readOptionalString(formData, "start_date"),
      end_date: readOptionalString(formData, "end_date"),
    })
    .eq("id", exhibitionId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/exhibitions");
  revalidatePath("/exhibitions");
}

export async function deleteExhibition(exhibitionId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("exhibitions").delete().eq("id", exhibitionId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/exhibitions");
  revalidatePath("/exhibitions");
}

export async function deleteArtwork(artworkId: string, galleryId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("artworks")
    .select("storage_path")
    .eq("id", artworkId)
    .single();

  if (existing?.storage_path) {
    await admin.storage.from(BUCKET).remove([existing.storage_path]);
  }

  const { error } = await admin.from("artworks").delete().eq("id", artworkId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath(`/galleries/${galleryId}`);
  revalidatePath("/");
}

// ---------- Cover images ----------

export async function setGalleryCover(galleryId: string, imageUrl: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: gallery, error } = await admin
    .from("galleries")
    .update({ cover_image_url: imageUrl })
    .eq("id", galleryId)
    .select("artist_id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath(`/galleries/${galleryId}`);
  revalidatePath("/");
  if (gallery?.artist_id) revalidatePath(`/artists/${gallery.artist_id}`);
}

export async function setArtistCover(artistId: string, galleryId: string, imageUrl: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("artists")
    .update({ cover_image_url: imageUrl })
    .eq("id", artistId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath("/");
  revalidatePath(`/artists/${artistId}`);
}

export async function setArtistAvatar(artistId: string, galleryId: string, imageUrl: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("artists")
    .update({ avatar_url: imageUrl })
    .eq("id", artistId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath(`/artists/${artistId}`);
}

// ---------- Appreciations ----------

export async function approveAppreciation(appreciationId: string, galleryId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("appreciations")
    .update({ approved: true })
    .eq("id", appreciationId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/appreciations");
  revalidatePath(`/galleries/${galleryId}`);
}

export async function deleteAppreciation(appreciationId: string, galleryId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("appreciations").delete().eq("id", appreciationId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/appreciations");
  revalidatePath(`/galleries/${galleryId}`);
}
