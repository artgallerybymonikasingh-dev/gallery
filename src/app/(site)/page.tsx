import { createClient } from "@/lib/supabase/server";
import ArtistCard from "@/components/ArtistCard";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import SearchGrid from "@/components/SearchGrid";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import type { Artist } from "@/lib/types";

type ArtistWithGalleries = Artist & {
  galleries: { cover_image_url: string | null }[];
  appreciations: { count: number }[];
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: artists } = await supabase
    .from("artists")
    .select("*, galleries(cover_image_url), appreciations(count)")
    .order("name")
    .returns<ArtistWithGalleries[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Chitrashala",
          description: "Original artwork by Monika Singh and associated artists.",
          url: SITE_URL,
        }}
      />
      <div className="mb-6 sm:mb-8">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-royal-maroon sm:text-3xl">
          Artists
        </h1>
        <p className="mt-1 text-sm text-neutral-500 sm:text-base">
          Original artwork by Monika Singh and associated artists.
        </p>
      </div>

      <SearchGrid
        entries={(artists ?? []).map((artist) => ({
          key: artist.id,
          searchText: artist.name,
          node: (
            <ArtistCard
              artist={artist}
              coverImageUrl={
                artist.cover_image_url ??
                artist.galleries.find((g) => g.cover_image_url)?.cover_image_url ??
                null
              }
              galleryCount={artist.galleries.length}
              appreciationCount={artist.appreciations[0]?.count ?? 0}
            />
          ),
        }))}
        placeholder="Search artists…"
        emptyText="No artists have been added yet."
        noResultsText="No artists match your search."
      />

      <WhatsAppFloatingButton />
    </div>
  );
}
