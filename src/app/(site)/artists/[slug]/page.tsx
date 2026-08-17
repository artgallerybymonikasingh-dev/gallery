import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import GalleryCard from "@/components/GalleryCard";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import Breadcrumbs from "@/components/Breadcrumbs";
import AppreciationBox from "@/components/AppreciationBox";
import SearchGrid from "@/components/SearchGrid";
import ShareButton from "@/components/ShareButton";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import { submitArtistAppreciation } from "../../actions";
import type { Appreciation, Artist, GalleryWithArtist } from "@/lib/types";

const getArtist = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("artists")
    .select("*, appreciations(*)")
    .eq("slug", slug)
    .single<Artist & { appreciations: Appreciation[] }>();
  return data;
});

const getArtistGalleries = cache(async (artistId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("galleries")
    .select("*, artist:artists(*), appreciations(count)")
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false })
    .returns<(GalleryWithArtist & { appreciations: { count: number }[] })[]>();
  return data ?? [];
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtist(slug);
  if (!artist) return {};

  const title = artist.name;
  const description = artist.bio ?? `Artwork by ${artist.name} on Chitrashala.`;
  const galleries = await getArtistGalleries(artist.id);
  const collectionImage = galleries.find((g) => g.cover_image_url)?.cover_image_url;
  const image = artist.cover_image_url ?? artist.avatar_url ?? collectionImage;
  const images = image ? [image] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images },
    twitter: { title, description, images },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist = await getArtist(slug);

  if (!artist) notFound();

  const galleries = await getArtistGalleries(artist.id);

  const artistUrl = `${SITE_URL}/artists/${artist.slug}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: artist.name,
          description: artist.bio ?? undefined,
          image: artist.avatar_url ?? artist.cover_image_url ?? undefined,
          url: artistUrl,
        }}
      />
      <Breadcrumbs items={[{ label: artist.name }]} />
      <div className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
        <div className="flex items-center gap-4">
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
        <ShareButton
          url={artistUrl}
          title={artist.name}
          text={`${artist.name} on Chitrashala`}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-royal-gold/40 px-3 py-1.5 text-xs font-medium text-royal-maroon transition-colors hover:bg-royal-cream-deep"
        />
      </div>

      <SearchGrid
        entries={(galleries ?? []).map((gallery) => ({
          key: gallery.id,
          searchText: gallery.title,
          node: <GalleryCard gallery={gallery} appreciationCount={gallery.appreciations[0]?.count ?? 0} />,
        }))}
        placeholder="Search galleries…"
        emptyText="No galleries have been published yet."
        noResultsText="No galleries match your search."
      />

      <AppreciationBox
        targetId={artist.id}
        appreciations={artist.appreciations}
        submitAction={submitArtistAppreciation}
        heading="Appreciations for this artist"
        ctaLabel="Appreciate this artist"
        placeholder="Say something about this artist's work…"
        emptyText="Be the first to share your thoughts on this artist."
      />

      <WhatsAppFloatingButton phoneNumber={artist.whatsapp_number} />
    </div>
  );
}
