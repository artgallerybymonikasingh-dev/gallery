import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Artwork, GalleryWithArtist } from "@/lib/types";
import {
  bulkCreateArtworks,
  createArtwork,
  deleteArtwork,
  moveArtwork,
  setArtistAvatar,
  setArtistCover,
  setGalleryCover,
  updateArtwork,
  updateGallery,
} from "../../actions";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import ArtworkForm from "@/components/admin/ArtworkForm";

export default async function ManageGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: gallery } = await supabase
    .from("galleries")
    .select("*, artist:artists(*)")
    .eq("id", id)
    .single<GalleryWithArtist>();

  if (!gallery) notFound();

  const { data: artworks } = await supabase
    .from("artworks")
    .select("*")
    .eq("gallery_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Artwork[]>();

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/galleries" className="text-sm text-neutral-500 hover:underline">
          ← Back to galleries
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{gallery.title}</h1>
        <p className="text-sm text-neutral-500">
          by{" "}
          <Link href={`/admin/artists/${gallery.artist.id}/edit`} className="text-blue-600 hover:underline">
            {gallery.artist.name}
          </Link>
        </p>
      </div>

      <section>
        <h2 className="text-sm font-medium text-neutral-700">Gallery details</h2>
        <form
          action={updateGallery.bind(null, gallery.id)}
          className="mt-2 max-w-md space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
        >
          <label className="block text-sm font-medium text-neutral-700">
            Title
            <input
              name="title"
              required
              defaultValue={gallery.title}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Description (optional)
            <textarea
              name="description"
              rows={3}
              defaultValue={gallery.description ?? ""}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            WhatsApp number override (optional)
            <input
              name="whatsapp_number"
              defaultValue={gallery.whatsapp_number ?? ""}
              placeholder="Leave blank to use the site-wide number"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <span className="mt-1 block text-xs text-neutral-500">
              Digits only, country code first, e.g. 919876543210 for +91 98765 43210.
            </span>
          </label>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Save changes
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium text-neutral-700">Add a photo</h2>
        <div className="mt-2 max-w-md rounded-lg border border-neutral-200 bg-white p-4">
          <ArtworkForm
            action={createArtwork.bind(null, gallery.id)}
            submitLabel="Upload photo"
            requireImage
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-neutral-700">Bulk upload</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Upload several photos at once — each is saved as &quot;Untitled&quot; with no
          description; edit the details individually afterward.
        </p>
        <form
          action={bulkCreateArtworks.bind(null, gallery.id)}
          className="mt-2 max-w-md space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
        >
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            required
            className="w-full text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Upload photos
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium text-neutral-700">
          Photos ({artworks?.length ?? 0})
        </h2>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          {(artworks ?? []).map((artwork, index) => {
            const isGalleryCover = gallery.cover_image_url === artwork.image_url;
            const isArtistCover = gallery.artist.cover_image_url === artwork.image_url;
            const isArtistAvatar = gallery.artist.avatar_url === artwork.image_url;
            const isFirst = index === 0;
            const isLast = index === (artworks?.length ?? 1) - 1;
            return (
              <div
                key={artwork.id}
                className="overflow-hidden rounded-lg border border-neutral-200 bg-white"
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="h-48 w-full object-cover"
                  />
                  {(isGalleryCover || isArtistCover || isArtistAvatar) && (
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                      {isGalleryCover && (
                        <span className="rounded-full bg-neutral-900/80 px-2 py-0.5 text-[10px] font-medium text-white">
                          Gallery cover
                        </span>
                      )}
                      {isArtistCover && (
                        <span className="rounded-full bg-neutral-900/80 px-2 py-0.5 text-[10px] font-medium text-white">
                          Artist cover
                        </span>
                      )}
                      {isArtistAvatar && (
                        <span className="rounded-full bg-neutral-900/80 px-2 py-0.5 text-[10px] font-medium text-white">
                          Profile photo
                        </span>
                      )}
                    </div>
                  )}
                  <div className="absolute right-2 top-2 flex gap-1">
                    <form action={moveArtwork.bind(null, artwork.id, gallery.id, "up")}>
                      <button
                        type="submit"
                        disabled={isFirst}
                        aria-label="Move photo earlier"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow disabled:opacity-40"
                      >
                        ↑
                      </button>
                    </form>
                    <form action={moveArtwork.bind(null, artwork.id, gallery.id, "down")}>
                      <button
                        type="submit"
                        disabled={isLast}
                        aria-label="Move photo later"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow disabled:opacity-40"
                      >
                        ↓
                      </button>
                    </form>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-b border-neutral-100 px-3 py-2">
                  <form action={setGalleryCover.bind(null, gallery.id, artwork.image_url)}>
                    <button
                      type="submit"
                      disabled={isGalleryCover}
                      className="text-xs text-blue-600 hover:underline disabled:text-neutral-400 disabled:no-underline"
                    >
                      Set as gallery cover
                    </button>
                  </form>
                  <span className="text-neutral-300">·</span>
                  <form action={setArtistCover.bind(null, gallery.artist.id, gallery.id, artwork.image_url)}>
                    <button
                      type="submit"
                      disabled={isArtistCover}
                      className="text-xs text-blue-600 hover:underline disabled:text-neutral-400 disabled:no-underline"
                    >
                      Set as artist cover
                    </button>
                  </form>
                  <span className="text-neutral-300">·</span>
                  <form action={setArtistAvatar.bind(null, gallery.artist.id, gallery.id, artwork.image_url)}>
                    <button
                      type="submit"
                      disabled={isArtistAvatar}
                      className="text-xs text-blue-600 hover:underline disabled:text-neutral-400 disabled:no-underline"
                    >
                      Set as profile photo
                    </button>
                  </form>
                </div>
                <div className="p-3">
                  <ArtworkForm
                    action={updateArtwork.bind(null, artwork.id, gallery.id)}
                    artwork={artwork}
                    submitLabel="Save"
                    requireImage={false}
                  />
                </div>
                <form action={deleteArtwork.bind(null, artwork.id, gallery.id)} className="px-3 pb-3">
                  <ConfirmSubmitButton
                    confirmMessage={`Delete this photo? This cannot be undone.`}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete photo
                  </ConfirmSubmitButton>
                </form>
              </div>
            );
          })}
          {(!artworks || artworks.length === 0) && (
            <p className="text-sm text-neutral-500">No photos yet — add one above.</p>
          )}
        </div>
      </section>
    </div>
  );
}
