import { createClient } from "@/lib/supabase/server";
import ArtistCard from "@/components/ArtistCard";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import type { Artist } from "@/lib/types";

type ArtistWithGalleries = Artist & { galleries: { cover_image_url: string | null }[] };

export default async function HomePage() {
  const supabase = await createClient();
  const { data: artists } = await supabase
    .from("artists")
    .select("*, galleries(cover_image_url)")
    .order("name")
    .returns<ArtistWithGalleries[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-royal-maroon sm:text-3xl">
          Artists
        </h1>
        <p className="mt-1 text-sm text-neutral-500 sm:text-base">
          Original artwork by Monika Singh and associated artists.
        </p>
      </div>

      {!artists || artists.length === 0 ? (
        <p className="text-neutral-500">No artists have been added yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {artists.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              coverImageUrl={
                artist.cover_image_url ??
                artist.galleries.find((g) => g.cover_image_url)?.cover_image_url ??
                null
              }
              galleryCount={artist.galleries.length}
            />
          ))}
        </div>
      )}
      <WhatsAppFloatingButton />
    </div>
  );
}
