import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Artist } from "@/lib/types";
import { updateArtist } from "../../../actions";

export default async function EditArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single<Artist>();

  if (!artist) notFound();

  return (
    <div className="max-w-md">
      <Link href="/admin/artists" className="text-sm text-neutral-500 hover:underline">
        ← Back to artists
      </Link>
      <h1 className="mt-2 text-xl font-semibold">Edit artist</h1>

      <form
        action={updateArtist.bind(null, artist.id)}
        className="mt-4 space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        {artist.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.avatar_url}
            alt={artist.name}
            className="h-20 w-20 rounded-full object-cover"
          />
        )}
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
          {artist.avatar_url ? "Replace profile photo (optional)" : "Profile photo (optional)"}
          <input type="file" name="avatar" accept="image/*" className="mt-1 w-full text-sm" />
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          Bio for About Us page (optional)
          <textarea
            name="bio"
            rows={4}
            defaultValue={artist.bio ?? ""}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          Email (optional, shown on Reach Us)
          <input
            name="email"
            type="email"
            defaultValue={artist.email ?? ""}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          WhatsApp number (optional)
          <input
            name="whatsapp_number"
            defaultValue={artist.whatsapp_number ?? ""}
            placeholder="Digits only with country code, e.g. 919876543210"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          Address (optional)
          <input
            name="address"
            defaultValue={artist.address ?? ""}
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
