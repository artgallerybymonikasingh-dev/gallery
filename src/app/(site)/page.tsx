import { createClient } from "@/lib/supabase/server";
import ArtistCard from "@/components/ArtistCard";
import ExhibitionCard from "@/components/ExhibitionCard";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import SearchGrid from "@/components/SearchGrid";
import HomeTabs from "@/components/HomeTabs";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import type { Artist, ExhibitionWithArtists, ExhibitionWithArtworks } from "@/lib/types";

type ArtistWithGalleries = Artist & {
  galleries: { cover_image_url: string | null }[];
  appreciations: { count: number }[];
};

type RawExhibition = Omit<ExhibitionWithArtists, "artists"> & {
  exhibition_artists: { artist: Artist }[];
  artwork_exhibitions: { artwork: { image_url: string } | null }[];
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const initialTab = view === "artists" ? "artists" : "exhibitions";

  const supabase = await createClient();

  const [{ data: artists }, { data: rawExhibitions }] = await Promise.all([
    supabase.from("artists").select("*, galleries(cover_image_url), appreciations(count)").order("name").returns<ArtistWithGalleries[]>(),
    supabase
      .from("exhibitions")
      .select("*, exhibition_artists(artist:artists(*)), artwork_exhibitions(artwork:artworks(image_url))")
      .order("start_date", { ascending: true, nullsFirst: false })
      .returns<RawExhibition[]>(),
  ]);

  const exhibitions: ExhibitionWithArtworks[] = (rawExhibitions ?? []).map((ex) => {
    const { exhibition_artists, artwork_exhibitions, ...rest } = ex;
    return {
      ...rest,
      artists: exhibition_artists.map((link) => link.artist),
      photoCount: artwork_exhibitions.length,
      coverImageUrl: artwork_exhibitions.find((link) => link.artwork)?.artwork?.image_url ?? null,
    };
  });

  const artistsGrid = (
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
  );

  const exhibitionsGrid = (
    <SearchGrid
      entries={exhibitions.map((exhibition) => ({
        key: exhibition.id,
        searchText: exhibition.title,
        node: <ExhibitionCard exhibition={exhibition} />,
      }))}
      placeholder="Search exhibitions…"
      emptyText="No exhibitions have been announced yet."
      noResultsText="No exhibitions match your search."
    />
  );

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
          Chitrashala
        </h1>
        <p className="mt-1 text-sm text-neutral-500 sm:text-base">
          Original artwork by Monika Singh and associated artists.
        </p>
      </div>

      <HomeTabs artistsContent={artistsGrid} exhibitionsContent={exhibitionsGrid} initialTab={initialTab} />

      <WhatsAppFloatingButton />
    </div>
  );
}
