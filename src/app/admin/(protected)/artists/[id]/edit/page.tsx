import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Artist } from "@/lib/types";
import { updateArtist } from "../../../actions";

export default async function EditArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .single<Artist>();

  if (!artist) notFound();

  return (
    <div className="max-w-md">
      <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-xl font-semibold">Edit artist</h1>

      <form
        action={updateArtist.bind(null, artist.id)}
        className="mt-4 space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <label className="block text-sm font-medium text-neutral-700">
          Name
          <input
            name="name"
            required
            defaultValue={artist.name}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          Bio (optional)
          <textarea
            name="bio"
            rows={4}
            defaultValue={artist.bio ?? ""}
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
    </div>
  );
}
