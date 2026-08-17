import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Artist } from "@/lib/types";
import { createArtist, deleteArtist } from "../actions";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";

export default async function AdminArtistsPage() {
  const supabase = await createClient();

  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .order("name")
    .returns<Artist[]>();

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Artists</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Add Monika Singh and any associated artists here before creating their galleries.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {(artists ?? []).map((artist) => (
          <div key={artist.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="font-medium">{artist.name}</p>
            {artist.bio && <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{artist.bio}</p>}
            <div className="mt-3 flex items-center gap-3 text-sm">
              <Link href={`/artists/${artist.slug}`} target="_blank" className="text-neutral-500 hover:underline">
                View
              </Link>
              <Link href={`/admin/artists/${artist.id}/edit`} className="text-blue-600 hover:underline">
                Edit
              </Link>
              <form action={deleteArtist.bind(null, artist.id)}>
                <ConfirmSubmitButton
                  confirmMessage={`Delete artist "${artist.name}" and all their galleries and photos? This cannot be undone.`}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        ))}
        {(!artists || artists.length === 0) && (
          <p className="text-sm text-neutral-500">No artists yet — add one below.</p>
        )}
      </div>

      <form
        action={createArtist}
        className="mt-5 max-w-md space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <h2 className="text-sm font-medium">Add artist</h2>
        <input
          name="name"
          required
          placeholder="Artist name"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <label className="block text-xs text-neutral-500">
          Profile photo (optional, shown on About Us)
          <input type="file" name="avatar" accept="image/*" className="mt-1 w-full text-sm" />
        </label>
        <textarea
          name="bio"
          placeholder="Bio for About Us page (optional)"
          rows={2}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          placeholder="Email (optional, shown on Reach Us)"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          name="whatsapp_number"
          placeholder="WhatsApp number (optional, e.g. 919876543210)"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          name="address"
          placeholder="Address (optional)"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Add artist
        </button>
      </form>
    </div>
  );
}
