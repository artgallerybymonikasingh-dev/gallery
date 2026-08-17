import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Artist, GalleryWithArtist } from "@/lib/types";
import { createGallery, deleteGallery } from "../actions";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";

export default async function AdminGalleriesPage() {
  const supabase = await createClient();

  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .order("name")
    .returns<Artist[]>();

  const { data: galleries } = await supabase
    .from("galleries")
    .select("*, artist:artists(*)")
    .order("created_at", { ascending: false })
    .returns<GalleryWithArtist[]>();

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Galleries</h1>
        <p className="mt-1 text-sm text-neutral-500">Create a gallery, then open it to add photos.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {(galleries ?? []).map((gallery) => (
          <div key={gallery.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="font-medium">{gallery.title}</p>
            <p className="text-sm text-neutral-500">{gallery.artist.name}</p>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <Link href={`/admin/galleries/${gallery.slug}`} className="text-blue-600 hover:underline">
                Manage
              </Link>
              <form action={deleteGallery.bind(null, gallery.id)}>
                <ConfirmSubmitButton
                  confirmMessage={`Delete gallery "${gallery.title}" and all its photos? This cannot be undone.`}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        ))}
        {(!galleries || galleries.length === 0) && (
          <p className="text-sm text-neutral-500">No galleries yet — create one below.</p>
        )}
      </div>

      <form
        action={createGallery}
        className="mt-5 max-w-md space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <h2 className="text-sm font-medium">Add gallery</h2>

        {(artists ?? []).length === 0 ? (
          <p className="rounded-md bg-royal-cream-deep px-3 py-2 text-sm text-neutral-700">
            You need an artist first.{" "}
            <Link href="/admin/artists" className="font-medium text-royal-teal hover:underline">
              Add one here →
            </Link>
          </p>
        ) : (
          <>
            <select
              name="artist_id"
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Select artist…</option>
              {(artists ?? []).map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
            <Link href="/admin/artists" className="block text-xs text-royal-teal hover:underline">
              Don&apos;t see the artist you need? Add one →
            </Link>
          </>
        )}

        <input
          name="title"
          required
          placeholder="Gallery title"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={2}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <label className="block text-xs text-neutral-500">
          WhatsApp number override (optional — digits only with country code, e.g. 919876543210)
          <input
            name="whatsapp_number"
            placeholder="Leave blank to use the site-wide number"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={(artists ?? []).length === 0}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          Add gallery
        </button>
      </form>
    </div>
  );
}
