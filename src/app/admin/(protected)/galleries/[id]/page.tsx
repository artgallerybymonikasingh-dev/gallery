import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Artwork, GalleryWithArtist } from "@/lib/types";
import { createArtwork, deleteArtwork, updateArtwork, updateGallery } from "../../actions";
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
    .order("created_at", { ascending: true })
    .returns<Artwork[]>();

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{gallery.title}</h1>
        <p className="text-sm text-neutral-500">by {gallery.artist.name}</p>
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
        <h2 className="text-sm font-medium text-neutral-700">
          Photos ({artworks?.length ?? 0})
        </h2>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          {(artworks ?? []).map((artwork) => (
            <div
              key={artwork.id}
              className="overflow-hidden rounded-lg border border-neutral-200 bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="h-48 w-full object-cover"
              />
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
          ))}
          {(!artworks || artworks.length === 0) && (
            <p className="text-sm text-neutral-500">No photos yet — add one above.</p>
          )}
        </div>
      </section>
    </div>
  );
}
