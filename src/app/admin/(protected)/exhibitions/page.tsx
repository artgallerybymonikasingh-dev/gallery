import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Artist, Exhibition } from "@/lib/types";
import { createExhibition, deleteExhibition, updateExhibition } from "../actions";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";

function ArtistCheckboxes({
  artists,
  selectedArtistIds,
}: {
  artists: Artist[];
  selectedArtistIds: string[];
}) {
  if (artists.length === 0) return null;
  return (
    <div>
      <p className="text-xs text-neutral-500">Artists (optional — leave all unchecked for a group show)</p>
      <div className="mt-1 max-h-32 space-y-1 overflow-y-auto rounded-md border border-neutral-300 p-2">
        {artists.map((artist) => (
          <label key={artist.id} className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              name="artist_ids"
              value={artist.id}
              defaultChecked={selectedArtistIds.includes(artist.id)}
            />
            {artist.name}
          </label>
        ))}
      </div>
    </div>
  );
}

export default async function AdminExhibitionsPage() {
  const supabase = await createClient();

  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .order("name")
    .returns<Artist[]>();

  const { data: exhibitions } = await supabase
    .from("exhibitions")
    .select("*")
    .order("start_date", { ascending: true, nullsFirst: false })
    .returns<Exhibition[]>();

  const { data: links } = await supabase
    .from("exhibition_artists")
    .select("exhibition_id, artist_id")
    .in("exhibition_id", (exhibitions ?? []).map((e) => e.id));

  const artistIdsByExhibition = new Map<string, string[]>();
  for (const link of links ?? []) {
    const list = artistIdsByExhibition.get(link.exhibition_id) ?? [];
    list.push(link.artist_id);
    artistIdsByExhibition.set(link.exhibition_id, list);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Exhibitions</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Shown on the public &quot;Next Exhibition&quot; page. Add more than one if artists are
          showing at different locations at the same time.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-medium text-neutral-700">Add exhibition</h2>
        <form
          action={createExhibition}
          className="mt-2 max-w-md space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
        >
          <input
            name="title"
            required
            placeholder="Exhibition title"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <ArtistCheckboxes artists={artists ?? []} selectedArtistIds={[]} />
          <input
            name="location"
            placeholder="Location (optional)"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-3">
            <label className="block flex-1 text-xs text-neutral-500">
              Start date (optional)
              <input
                name="start_date"
                type="date"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block flex-1 text-xs text-neutral-500">
              End date (optional)
              <input
                name="end_date"
                type="date"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <textarea
            name="description"
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Add exhibition
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium text-neutral-700">
          Current exhibitions ({exhibitions?.length ?? 0})
        </h2>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          {(exhibitions ?? []).map((ex) => (
            <div key={ex.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              {ex.slug && (
                <Link
                  href={`/exhibitions/${ex.slug}`}
                  target="_blank"
                  className="mb-2 inline-block text-xs text-neutral-500 hover:underline"
                >
                  View public page →
                </Link>
              )}
              <form action={updateExhibition.bind(null, ex.id)} className="space-y-2">
                <input
                  name="title"
                  required
                  defaultValue={ex.title}
                  placeholder="Title"
                  className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                />
                <ArtistCheckboxes
                  artists={artists ?? []}
                  selectedArtistIds={artistIdsByExhibition.get(ex.id) ?? []}
                />
                <input
                  name="location"
                  defaultValue={ex.location ?? ""}
                  placeholder="Location"
                  className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                />
                <div className="flex gap-2">
                  <input
                    name="start_date"
                    type="date"
                    defaultValue={ex.start_date ?? ""}
                    className="w-1/2 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    name="end_date"
                    type="date"
                    defaultValue={ex.end_date ?? ""}
                    className="w-1/2 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <textarea
                  name="description"
                  defaultValue={ex.description ?? ""}
                  placeholder="Description"
                  rows={2}
                  className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                >
                  Save
                </button>
              </form>
              <form action={deleteExhibition.bind(null, ex.id)} className="mt-2">
                <ConfirmSubmitButton
                  confirmMessage="Delete this exhibition?"
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </div>
          ))}
          {(!exhibitions || exhibitions.length === 0) && (
            <p className="text-sm text-neutral-500">No exhibitions yet — add one above.</p>
          )}
        </div>
      </section>
    </div>
  );
}
