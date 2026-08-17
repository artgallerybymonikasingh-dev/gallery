import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PhotoGrid from "@/components/PhotoGrid";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShareButton from "@/components/ShareButton";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import type { Artist, ArtworkWithAppreciations, ExhibitionWithArtists } from "@/lib/types";

type RawExhibition = Omit<ExhibitionWithArtists, "artists"> & {
  exhibition_artists: { artist: Artist }[];
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

const getExhibitionArtworks = cache(async (exhibitionId: string) => {
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("artwork_exhibitions")
    .select("artwork:artworks(*, appreciations(*))")
    .eq("exhibition_id", exhibitionId)
    .returns<{ artwork: ArtworkWithAppreciations }[]>();

  return (links ?? [])
    .map((l) => l.artwork)
    .filter((a): a is ArtworkWithAppreciations => a !== null)
    .sort((a, b) => a.sort_order - b.sort_order);
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
  const images = artworks[0] ? [artworks[0].image_url] : undefined;

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
          url: exhibitionUrl,
        }}
      />
      <Breadcrumbs
        items={[
          { label: "Next Exhibition", href: "/exhibitions" },
          { label: exhibition.title },
        ]}
      />

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
        artistName={exhibition.artists.map((a) => a.name).join(", ") || "the artists"}
        shareUrl={exhibitionUrl}
        emptyText="No photos have been tagged to this exhibition yet."
      />

      <WhatsAppFloatingButton />
    </div>
  );
}
