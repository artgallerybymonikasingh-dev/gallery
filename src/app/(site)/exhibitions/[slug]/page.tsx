import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PhotoGrid, { type ArtworkWithPermalink } from "@/components/PhotoGrid";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShareButton from "@/components/ShareButton";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import { getSiteWhatsappNumber } from "@/lib/siteSettings";
import type { Artist, ArtworkWithAppreciations, ExhibitionWithArtists } from "@/lib/types";

type RawExhibition = Omit<ExhibitionWithArtists, "artists"> & {
  exhibition_artists: { artist: Artist }[];
};

type RawArtwork = Omit<ArtworkWithAppreciations, "artists"> & {
  artwork_artists: { artist: Artist }[];
};

const getExhibition = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exhibitions")
    .select("*, exhibition_artists(artist:artists(*))")
    .eq("slug", slug)
    .single<RawExhibition>();
  if (!data) return null;
  const { exhibition_artists, ...rest } = data;
  return { ...rest, artists: exhibition_artists.map((link) => link.artist) } satisfies ExhibitionWithArtists;
});

// A photo counts as part of an exhibition either by being individually
// tagged (artwork_exhibitions) or by belonging to a gallery that's
// standing-linked to the exhibition (gallery_exhibitions) — union the two,
// deduped by artwork id since a photo can qualify both ways at once.
const getExhibitionArtworks = cache(async (exhibitionId: string) => {
  const supabase = await createClient();
  const [{ data: taggedLinks }, { data: galleryLinks }] = await Promise.all([
    supabase
      .from("artwork_exhibitions")
      .select("artwork:artworks(*, appreciations(*), artwork_artists(artist:artists(*)))")
      .eq("exhibition_id", exhibitionId)
      .returns<{ artwork: RawArtwork }[]>(),
    supabase.from("gallery_exhibitions").select("gallery_id").eq("exhibition_id", exhibitionId),
  ]);

  const galleryIds = (galleryLinks ?? []).map((l) => l.gallery_id);
  let galleryArtworks: RawArtwork[] = [];
  if (galleryIds.length > 0) {
    const { data } = await supabase
      .from("artworks")
      .select("*, appreciations(*), artwork_artists(artist:artists(*))")
      .in("gallery_id", galleryIds)
      .returns<RawArtwork[]>();
    galleryArtworks = data ?? [];
  }

  const taggedArtworks = (taggedLinks ?? [])
    .map((l) => l.artwork)
    .filter((a): a is RawArtwork => a !== null);

  const byId = new Map<string, RawArtwork>();
  for (const artwork of [...taggedArtworks, ...galleryArtworks]) byId.set(artwork.id, artwork);

  const combined = [...byId.values()];
  const distinctGalleryIds = [...new Set(combined.map((a) => a.gallery_id))];
  const { data: galleries } = await supabase
    .from("galleries")
    .select("id, slug")
    .in("id", distinctGalleryIds.length > 0 ? distinctGalleryIds : [""]);
  const gallerySlugById = new Map((galleries ?? []).map((g) => [g.id, g.slug]));

  return combined
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((a): ArtworkWithPermalink => {
      const { artwork_artists, ...rest } = a;
      const gallerySlug = gallerySlugById.get(a.gallery_id);
      return {
        ...rest,
        artists: artwork_artists.map((link) => link.artist),
        permalink: `${SITE_URL}/galleries/${gallerySlug}/${a.slug}`,
      };
    });
});

function formatDateRange(start: string | null, end: string | null): string | null {
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  if (end) return fmt(end);
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exhibition = await getExhibition(slug);
  if (!exhibition) return {};

  const title = exhibition.title;
  const artistNames = exhibition.artists.map((a) => a.name).join(", ");
  const description =
    exhibition.description ??
    (artistNames ? `An exhibition by ${artistNames} on Chitrashala.` : "An exhibition on Chitrashala.");
  const artworks = await getExhibitionArtworks(exhibition.id);
  const coverImage = exhibition.cover_image_url ?? artworks[0]?.image_url;
  const images = coverImage ? [coverImage] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images },
    twitter: { title, description, images },
  };
}

export default async function ExhibitionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exhibition = await getExhibition(slug);

  if (!exhibition) notFound();

  const artworks = await getExhibitionArtworks(exhibition.id);

  const exhibitionUrl = `${SITE_URL}/exhibitions/${exhibition.slug}`;
  const dateRange = formatDateRange(exhibition.start_date, exhibition.end_date);
  const siteDefaultWhatsapp = await getSiteWhatsappNumber();
  const coverImage = exhibition.cover_image_url ?? artworks[0]?.image_url ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ExhibitionEvent",
          name: exhibition.title,
          description: exhibition.description ?? undefined,
          startDate: exhibition.start_date ?? undefined,
          endDate: exhibition.end_date ?? undefined,
          location: exhibition.location ? { "@type": "Place", name: exhibition.location } : undefined,
          performer: exhibition.artists.map((a) => ({ "@type": "Person", name: a.name })),
          image: coverImage ?? undefined,
          url: exhibitionUrl,
        }}
      />
      <Breadcrumbs
        items={[
          { label: "Next Exhibition", href: "/exhibitions" },
          { label: exhibition.title },
        ]}
      />

      {coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage}
          alt={exhibition.title}
          className="mb-6 h-48 w-full rounded-lg object-cover sm:mb-8 sm:h-64"
        />
      )}

      <div className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-royal-maroon sm:text-3xl">
            {exhibition.title}
          </h1>
          {exhibition.artists.length > 0 && (
            <p className="mt-1 text-sm text-neutral-500 sm:text-base">
              by {exhibition.artists.map((a) => a.name).join(", ")}
            </p>
          )}
          <div className="mt-2 space-y-0.5 text-sm text-neutral-600">
            {exhibition.location && <p>📍 {exhibition.location}</p>}
            {dateRange && <p>🗓️ {dateRange}</p>}
          </div>
          {exhibition.description && (
            <p className="mt-3 max-w-2xl whitespace-pre-line text-neutral-700">
              {exhibition.description}
            </p>
          )}
        </div>
        <ShareButton
          url={exhibitionUrl}
          title={exhibition.title}
          text={`${exhibition.title} on Chitrashala`}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-royal-gold/40 px-3 py-1.5 text-xs font-medium text-royal-maroon transition-colors hover:bg-royal-cream-deep"
        />
      </div>

      <PhotoGrid
        artworks={artworks}
        fallbackArtistName={exhibition.artists.map((a) => a.name).join(", ") || "the artists"}
        siteDefaultWhatsapp={siteDefaultWhatsapp}
        emptyText="No photos have been tagged to this exhibition yet."
      />

      <WhatsAppFloatingButton siteDefault={siteDefaultWhatsapp} />
    </div>
  );
}
