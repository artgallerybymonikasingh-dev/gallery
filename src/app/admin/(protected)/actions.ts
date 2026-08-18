"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { toWebp } from "@/lib/webp";
import { suggestDescription } from "@/lib/ai";
import { ensureUniqueSlug } from "@/lib/slug";

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

function readArtworkStatus(formData: FormData): "available" | "reserved" | "sold" {
  const value = formData.get("status");
  return value === "reserved" || value === "sold" ? value : "available";
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
  const instagramUrl = readOptionalString(formData, "instagram_url");
  const websiteUrl = readOptionalString(formData, "website_url");

  let avatarUrl: string | null = null;
  const avatarFile = formData.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    avatarUrl = (await uploadImage(avatarFile, "avatars")).publicUrl;
  }

  const admin = createAdminClient();
  const slug = await ensureUniqueSlug(admin, "artists", name);
  const { error } = await admin.from("artists").insert({
    name,
    slug,
    bio,
    email,
    whatsapp_number: whatsappNumber,
    address,
    instagram_url: instagramUrl,
    website_url: websiteUrl,
    avatar_url: avatarUrl,
  });
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
  const instagramUrl = readOptionalString(formData, "instagram_url");
  const websiteUrl = readOptionalString(formData, "website_url");

  const admin = createAdminClient();
  const updates: Record<string, unknown> = {
    name,
    bio,
    email,
    whatsapp_number: whatsappNumber,
    address,
    instagram_url: instagramUrl,
    website_url: websiteUrl,
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
  const slug = await ensureUniqueSlug(admin, "galleries", title);
  const { error } = await admin.from("galleries").insert({
    title,
    slug,
    artist_id: artistId,
    description,
    whatsapp_number: whatsappNumber,
  });
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
  const { data: gallery, error } = await admin
    .from("galleries")
    .update({ title, description, whatsapp_number: whatsappNumber })
    .eq("id", galleryId)
    .select("slug")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  if (gallery?.slug) {
    revalidatePath(`/admin/galleries/${gallery.slug}`);
    revalidatePath(`/galleries/${gallery.slug}`);
  }
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

async function nextSortOrder(admin: ReturnType<typeof createAdminClient>, galleryId: string) {
  const { count } = await admin
    .from("artworks")
    .select("*", { count: "exact", head: true })
    .eq("gallery_id", galleryId);
  return count ?? 0;
}

async function syncArtworkExhibitions(
  admin: ReturnType<typeof createAdminClient>,
  artworkId: string,
  formData: FormData
) {
  const exhibitionIds = formData
    .getAll("exhibition_ids")
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  await admin.from("artwork_exhibitions").delete().eq("artwork_id", artworkId);
  if (exhibitionIds.length > 0) {
    await admin
      .from("artwork_exhibitions")
      .insert(exhibitionIds.map((exhibitionId) => ({ artwork_id: artworkId, exhibition_id: exhibitionId })));
  }
}

// A photo's own artist credit(s) — independent of its gallery's or any
// exhibition's artist list, so checking multiple artists on a gallery or
// exhibition never silently reattributes every photo in it.
async function syncArtworkArtists(
  admin: ReturnType<typeof createAdminClient>,
  artworkId: string,
  formData: FormData
) {
  const artistIds = formData
    .getAll("artist_ids")
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  await admin.from("artwork_artists").delete().eq("artwork_id", artworkId);
  if (artistIds.length > 0) {
    await admin
      .from("artwork_artists")
      .insert(artistIds.map((artistId) => ({ artwork_id: artworkId, artist_id: artistId })));
  }
}

// Explicit, opt-in bulk action: adds the checked artist(s) to every photo
// currently in the gallery. Unlike syncArtworkArtists this only ADDS —
// it never removes an artist a photo already has — and it's a one-time
// apply, not a standing rule, so it must be run again for photos added
// later. Checking an artist on the gallery itself never does this
// automatically.
export async function addArtistToGalleryArtworks(galleryId: string, formData: FormData) {
  await requireAdmin();
  const artistIds = formData
    .getAll("artist_ids")
    .filter((v): v is string => typeof v === "string" && v.length > 0);
  if (artistIds.length === 0) throw new Error("Choose at least one artist");

  const admin = createAdminClient();
  const { data: artworks } = await admin.from("artworks").select("id").eq("gallery_id", galleryId);
  const artworkIds = (artworks ?? []).map((a) => a.id);

  if (artworkIds.length > 0) {
    const rows = artworkIds.flatMap((artworkId) =>
      artistIds.map((artistId) => ({ artwork_id: artworkId, artist_id: artistId }))
    );
    const { error } = await admin
      .from("artwork_artists")
      .upsert(rows, { onConflict: "artwork_id,artist_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }

  const { data: gallery } = await admin.from("galleries").select("slug").eq("id", galleryId).single();
  if (gallery?.slug) {
    revalidatePath(`/admin/galleries/${gallery.slug}`);
    revalidatePath(`/galleries/${gallery.slug}`);
  }
  revalidatePath("/exhibitions");
  revalidatePath("/");
}

// Standing link between a gallery and zero, one, or more exhibitions —
// every photo in a linked gallery (including ones added later) counts as
// part of the exhibition, on top of any individually-tagged photos from
// syncArtworkExhibitions above. Sync pattern: replace the full set each
// save, same as syncArtworkExhibitions / syncExhibitionArtists.
export async function updateGalleryExhibitions(galleryId: string, formData: FormData) {
  await requireAdmin();
  const exhibitionIds = formData
    .getAll("exhibition_ids")
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  const admin = createAdminClient();
  await admin.from("gallery_exhibitions").delete().eq("gallery_id", galleryId);
  if (exhibitionIds.length > 0) {
    const { error } = await admin
      .from("gallery_exhibitions")
      .insert(exhibitionIds.map((exhibitionId) => ({ gallery_id: galleryId, exhibition_id: exhibitionId })));
    if (error) throw new Error(error.message);
  }

  const [{ data: exhibitions }, { data: gallery }] = await Promise.all([
    admin.from("exhibitions").select("slug").in("id", exhibitionIds),
    admin.from("galleries").select("slug").eq("id", galleryId).single(),
  ]);

  if (gallery?.slug) revalidatePath(`/admin/galleries/${gallery.slug}`);
  revalidatePath("/exhibitions");
  revalidatePath("/");
  for (const exhibition of exhibitions ?? []) {
    if (exhibition.slug) revalidatePath(`/exhibitions/${exhibition.slug}`);
  }
}

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
  const price = readOptionalString(formData, "price");
  const status = readArtworkStatus(formData);
  const whatsappNumber = readOptionalString(formData, "whatsapp_number");

  const { path, publicUrl } = await uploadArtworkImage(file, galleryId);

  const admin = createAdminClient();
  const sortOrder = await nextSortOrder(admin, galleryId);
  const slug = await ensureUniqueSlug(admin, "artworks", title);
  const { data: inserted, error: insertError } = await admin
    .from("artworks")
    .insert({
      gallery_id: galleryId,
      slug,
      title,
      description,
      width_cm: widthCm,
      height_cm: heightCm,
      price,
      image_url: publicUrl,
      storage_path: path,
      sort_order: sortOrder,
      status,
      whatsapp_number: whatsappNumber,
    })
    .select("id")
    .single();
  if (insertError) throw new Error(insertError.message);

  await syncArtworkExhibitions(admin, inserted.id, formData);
  await syncArtworkArtists(admin, inserted.id, formData);

  const { data: gallery } = await admin
    .from("galleries")
    .select("cover_image_url, slug")
    .eq("id", galleryId)
    .single();
  if (gallery && !gallery.cover_image_url) {
    await admin.from("galleries").update({ cover_image_url: publicUrl }).eq("id", galleryId);
  }

  if (gallery?.slug) {
    revalidatePath(`/admin/galleries/${gallery.slug}`);
    revalidatePath(`/galleries/${gallery.slug}`);
  }
  revalidatePath("/");
  revalidatePath("/exhibitions");
}

export async function bulkCreateArtworks(galleryId: string, formData: FormData) {
  await requireAdmin();

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) throw new Error("Choose at least one photo");

  const admin = createAdminClient();
  let sortOrder = await nextSortOrder(admin, galleryId);
  let firstPublicUrl: string | null = null;

  for (const file of files) {
    const { path, publicUrl } = await uploadArtworkImage(file, galleryId);
    const slug = await ensureUniqueSlug(admin, "artworks", "Untitled");
    const { error } = await admin.from("artworks").insert({
      gallery_id: galleryId,
      slug,
      title: "Untitled",
      image_url: publicUrl,
      storage_path: path,
      sort_order: sortOrder,
    });
    if (error) throw new Error(error.message);
    firstPublicUrl ??= publicUrl;
    sortOrder += 1;
  }

  const { data: gallery } = await admin
    .from("galleries")
    .select("cover_image_url, slug")
    .eq("id", galleryId)
    .single();
  if (gallery && !gallery.cover_image_url && firstPublicUrl) {
    await admin.from("galleries").update({ cover_image_url: firstPublicUrl }).eq("id", galleryId);
  }

  if (gallery?.slug) {
    revalidatePath(`/admin/galleries/${gallery.slug}`);
    revalidatePath(`/galleries/${gallery.slug}`);
  }
  revalidatePath("/");
}

export async function moveArtwork(
  artworkId: string,
  galleryId: string,
  direction: "up" | "down"
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: artworks } = await admin
    .from("artworks")
    .select("id, sort_order")
    .eq("gallery_id", galleryId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!artworks) return;

  const index = artworks.findIndex((a) => a.id === artworkId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= artworks.length) return;

  const current = artworks[index];
  const swapWith = artworks[swapIndex];

  await admin.from("artworks").update({ sort_order: swapWith.sort_order }).eq("id", current.id);
  await admin.from("artworks").update({ sort_order: current.sort_order }).eq("id", swapWith.id);

  const { data: gallery } = await admin.from("galleries").select("slug").eq("id", galleryId).single();

  if (gallery?.slug) {
    revalidatePath(`/admin/galleries/${gallery.slug}`);
    revalidatePath(`/galleries/${gallery.slug}`);
  }
}

export async function updateArtwork(artworkId: string, galleryId: string, formData: FormData) {
  await requireAdmin();

  const title = readOptionalString(formData, "title") ?? "Untitled";
  const description = readOptionalString(formData, "description");
  const widthCm = readOptionalNumber(formData, "width_cm");
  const heightCm = readOptionalNumber(formData, "height_cm");
  const price = readOptionalString(formData, "price");
  const status = readArtworkStatus(formData);
  const whatsappNumber = readOptionalString(formData, "whatsapp_number");

  const admin = createAdminClient();
  const updates: Record<string, unknown> = {
    title,
    description,
    width_cm: widthCm,
    height_cm: heightCm,
    price,
    status,
    whatsapp_number: whatsappNumber,
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

  await syncArtworkExhibitions(admin, artworkId, formData);
  await syncArtworkArtists(admin, artworkId, formData);

  const [{ data: gallery }, { data: artworkRow }] = await Promise.all([
    admin.from("galleries").select("slug").eq("id", galleryId).single(),
    admin.from("artworks").select("slug").eq("id", artworkId).single(),
  ]);

  if (gallery?.slug) {
    revalidatePath(`/admin/galleries/${gallery.slug}`);
    revalidatePath(`/galleries/${gallery.slug}`);
    if (artworkRow?.slug) revalidatePath(`/galleries/${gallery.slug}/${artworkRow.slug}`);
  }
  revalidatePath("/");
  revalidatePath("/exhibitions");
}

// ---------- Exhibitions ----------

async function syncExhibitionArtists(
  admin: ReturnType<typeof createAdminClient>,
  exhibitionId: string,
  formData: FormData
) {
  const artistIds = formData
    .getAll("artist_ids")
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  await admin.from("exhibition_artists").delete().eq("exhibition_id", exhibitionId);
  if (artistIds.length > 0) {
    await admin
      .from("exhibition_artists")
      .insert(artistIds.map((artistId) => ({ exhibition_id: exhibitionId, artist_id: artistId })));
  }
}

export async function createExhibition(formData: FormData) {
  await requireAdmin();
  const title = readOptionalString(formData, "title");
  if (!title) throw new Error("Exhibition title is required");

  const admin = createAdminClient();
  const slug = await ensureUniqueSlug(admin, "exhibitions", title);
  const { data: inserted, error } = await admin
    .from("exhibitions")
    .insert({
      title,
      slug,
      location: readOptionalString(formData, "location"),
      description: readOptionalString(formData, "description"),
      start_date: readOptionalString(formData, "start_date"),
      end_date: readOptionalString(formData, "end_date"),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await syncExhibitionArtists(admin, inserted.id, formData);

  revalidatePath("/admin/exhibitions");
  revalidatePath("/exhibitions");
  revalidatePath("/");
}

export async function updateExhibition(exhibitionId: string, formData: FormData) {
  await requireAdmin();
  const title = readOptionalString(formData, "title");
  if (!title) throw new Error("Exhibition title is required");

  const admin = createAdminClient();
  const { data: exhibition, error } = await admin
    .from("exhibitions")
    .update({
      title,
      location: readOptionalString(formData, "location"),
      description: readOptionalString(formData, "description"),
      start_date: readOptionalString(formData, "start_date"),
      end_date: readOptionalString(formData, "end_date"),
    })
    .eq("id", exhibitionId)
    .select("slug")
    .single();
  if (error) throw new Error(error.message);

  await syncExhibitionArtists(admin, exhibitionId, formData);

  revalidatePath("/admin/exhibitions");
  revalidatePath("/exhibitions");
  if (exhibition?.slug) revalidatePath(`/exhibitions/${exhibition.slug}`);
  revalidatePath("/");
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

  const { data: gallery } = await admin.from("galleries").select("slug").eq("id", galleryId).single();

  if (gallery?.slug) {
    revalidatePath(`/admin/galleries/${gallery.slug}`);
    revalidatePath(`/galleries/${gallery.slug}`);
  }
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
    .select("slug, artist:artists(slug)")
    .single<{ slug: string; artist: { slug: string } | null }>();
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/galleries/${gallery.slug}`);
  revalidatePath(`/galleries/${gallery.slug}`);
  revalidatePath("/");
  if (gallery?.artist?.slug) revalidatePath(`/artists/${gallery.artist.slug}`);
}

export async function setArtistCover(artistId: string, galleryId: string, imageUrl: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: artist, error }, { data: gallery }] = await Promise.all([
    admin.from("artists").update({ cover_image_url: imageUrl }).eq("id", artistId).select("slug").single(),
    admin.from("galleries").select("slug").eq("id", galleryId).single(),
  ]);
  if (error) throw new Error(error.message);

  if (gallery?.slug) revalidatePath(`/admin/galleries/${gallery.slug}`);
  revalidatePath("/");
  if (artist?.slug) revalidatePath(`/artists/${artist.slug}`);
}

export async function setArtistAvatar(artistId: string, galleryId: string, imageUrl: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: artist, error }, { data: gallery }] = await Promise.all([
    admin.from("artists").update({ avatar_url: imageUrl }).eq("id", artistId).select("slug").single(),
    admin.from("galleries").select("slug").eq("id", galleryId).single(),
  ]);
  if (error) throw new Error(error.message);

  if (gallery?.slug) revalidatePath(`/admin/galleries/${gallery.slug}`);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/about");
  if (artist?.slug) revalidatePath(`/artists/${artist.slug}`);
}

// ---------- Appreciations ----------
// `publicPath` is the page the appreciation will appear on once approved —
// /galleries/[slug] for painting- and gallery-level ones, /artists/[slug] for
// artist-level ones — so the caller passes whichever applies.

export async function approveAppreciation(appreciationId: string, publicPath: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("appreciations")
    .update({ approved: true })
    .eq("id", appreciationId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/appreciations");
  revalidatePath(publicPath);
}

export async function deleteAppreciation(appreciationId: string, publicPath: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("appreciations").delete().eq("id", appreciationId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/appreciations");
  revalidatePath(publicPath);
}

// ---------- Site settings ----------

export async function updateSiteSettings(formData: FormData) {
  await requireAdmin();
  const whatsappNumber = readOptionalString(formData, "whatsapp_number");

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_settings")
    .update({ whatsapp_number: whatsappNumber, updated_at: new Date().toISOString() })
    .eq("id", "default");
  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
