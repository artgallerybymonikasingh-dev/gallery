import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GalleryCard from "@/components/GalleryCard";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Artist, GalleryWithArtist } from "@/lib/types";

export default async function ArtistPage({
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

  const { data: galleries } = await supabase
    .from("galleries")
    .select("*, artist:artists(*)")
    .eq("artist_id", id)
    .order("created_at", { ascending: false })
    .returns<GalleryWithArtist[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Breadcrumbs items={[{ label: artist.name }]} />
      <div className="mb-6 flex items-center gap-4 sm:mb-8">
        {artist.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.avatar_url}
            alt={artist.name}
            className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-20 sm:w-20"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-royal-cream-deep text-xl font-semibold text-royal-maroon/60 sm:h-20 sm:w-20">
            {artist.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-royal-maroon sm:text-3xl">
            {artist.name}
          </h1>
          {artist.bio && (
            <p className="mt-1 line-clamp-2 max-w-lg text-sm text-neutral-600">{artist.bio}</p>
          )}
        </div>
      </div>

      {!galleries || galleries.length === 0 ? (
        <p className="text-neutral-500">No galleries have been published yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {galleries.map((gallery) => (
            <GalleryCard key={gallery.id} gallery={gallery} />
          ))}
        </div>
      )}
      <WhatsAppFloatingButton phoneNumber={artist.whatsapp_number} />
    </div>
  );
}
