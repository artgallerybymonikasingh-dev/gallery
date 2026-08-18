import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShareButton from "@/components/ShareButton";
import JsonLd from "@/components/JsonLd";
import AppreciationBox from "@/components/AppreciationBox";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import ProtectedImage from "@/components/ProtectedImage";
import { SITE_URL } from "@/lib/site";
import { getSiteWhatsappNumber } from "@/lib/siteSettings";
import { whatsappEnquiryLink } from "@/lib/whatsapp";
import { submitArtworkAppreciation } from "../../../actions";
import type { Artist, ArtworkWithAppreciations, GalleryWithArtist } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = { available: "Available", reserved: "Reserved", sold: "Sold" };

type RawArtwork = Omit<ArtworkWithAppreciations, "artists"> & {
  artwork_artists: { artist: Artist }[];
};

const getGallery = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("galleries")
    .select("*, artist:artists(*)")
    .eq("slug", slug)
    .single<GalleryWithArtist>();
  return data;
});

const getArtwork = cache(async (galleryId: string, artworkSlug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("artworks")
    .select("*, appreciations(*), artwork_artists(artist:artists(*))")
    .eq("gallery_id", galleryId)
    .eq("slug", artworkSlug)
    .single<RawArtwork>();
  if (!data) return null;
  const { artwork_artists, ...rest } = data;
  return { ...rest, artists: artwork_artists.map((link) => link.artist) } satisfies ArtworkWithAppreciations;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; artworkSlug: string }>;
}): Promise<Metadata> {
  const { slug, artworkSlug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) return {};
  const artwork = await getArtwork(gallery.id, artworkSlug);
  if (!artwork) return {};

  const artistNames = (artwork.artists.length > 0 ? artwork.artists : [gallery.artist]).map((a) => a.name).join(", ");
  const title = artwork.title;
  const description = artwork.description ?? `Artwork by ${artistNames} on Chitrashala.`;
  const images = [artwork.image_url];

  return {
    title,
    description,
    openGraph: { title, description, images },
    twitter: { title, description, images },
  };
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ slug: string; artworkSlug: string }>;
}) {
  const { slug, artworkSlug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) notFound();

  const artwork = await getArtwork(gallery.id, artworkSlug);
  if (!artwork) notFound();

  const artists = artwork.artists.length > 0 ? artwork.artists : [gallery.artist];
  const artistNames = artists.map((a) => a.name).join(", ");
  const hasDimensions = artwork.width_cm && artwork.height_cm;
  const permalink = `${SITE_URL}/galleries/${gallery.slug}/${artwork.slug}`;
  const siteDefaultWhatsapp = await getSiteWhatsappNumber();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "VisualArtwork",
          name: artwork.title,
          description: artwork.description ?? undefined,
          image: artwork.image_url,
          url: permalink,
          creator: artists.map((a) => ({ "@type": "Person", name: a.name })),
        }}
      />
      <Breadcrumbs
        items={[
          { label: gallery.artist.name, href: `/artists/${gallery.artist.slug}` },
          { label: gallery.title, href: `/galleries/${gallery.slug}` },
          { label: artwork.title },
        ]}
      />

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
        <div className="overflow-hidden rounded-lg border border-royal-gold/20 bg-royal-cream-deep">
          <ProtectedImage
            src={artwork.image_url}
            alt={artwork.title}
            className="h-full w-full select-none object-contain [-webkit-touch-callout:none]"
          />
        </div>

        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-royal-maroon sm:text-3xl">
                {artwork.title}
              </h1>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  artwork.status === "sold"
                    ? "bg-royal-maroon text-white"
                    : artwork.status === "reserved"
                      ? "bg-royal-teal text-white"
                      : "bg-royal-cream-deep text-neutral-600"
                }`}
              >
                {STATUS_LABEL[artwork.status]}
              </span>
            </div>
            <ShareButton
              url={permalink}
              title={artwork.title}
              text={`"${artwork.title}" by ${artistNames} on Chitrashala`}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-royal-gold/40 px-3 py-1.5 text-xs font-medium text-royal-maroon transition-colors hover:bg-royal-cream-deep"
            />
          </div>

          <p className="mt-1 text-sm text-neutral-500 sm:text-base">
            by{" "}
            {artists.map((a, i) => (
              <span key={a.id}>
                {i > 0 && ", "}
                <Link href={`/artists/${a.slug}`} className="text-royal-teal hover:underline">
                  {a.name}
                </Link>
              </span>
            ))}
          </p>

          {hasDimensions && (
            <p className="mt-3 text-sm text-neutral-600">
              {artwork.width_cm} × {artwork.height_cm} cm
            </p>
          )}

          {artwork.price && <p className="mt-1 text-sm font-medium text-royal-ink">{artwork.price}</p>}

          {artwork.description && (
            <p className="mt-3 whitespace-pre-line text-neutral-700">{artwork.description}</p>
          )}

          <a
            href={whatsappEnquiryLink(
              artwork.title,
              artistNames,
              artwork.whatsapp_number ?? gallery.whatsapp_number,
              siteDefaultWhatsapp
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
          >
            <svg viewBox="0 0 32 32" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.42.71 4.673 1.933 6.566L4 29l7.617-1.897A11.94 11.94 0 0 0 16.001 27C22.63 27 28 21.627 28 15S22.63 3 16.001 3Zm6.997 16.982c-.297.836-1.47 1.53-2.404 1.727-.64.135-1.475.243-4.287-.921-3.598-1.487-5.913-5.14-6.094-5.38-.176-.24-1.464-1.948-1.464-3.716 0-1.767.925-2.635 1.253-2.997.298-.328.65-.41.867-.41.216 0 .434.002.623.011.2.01.469-.076.734.56.297.712.945 2.284 1.028 2.45.083.166.14.36.028.577-.111.216-.166.35-.325.539-.166.187-.343.417-.49.56-.166.166-.34.346-.146.68.194.335.862 1.42 1.851 2.301 1.271 1.135 2.342 1.487 2.677 1.653.335.166.529.14.723-.083.2-.222.834-.972 1.056-1.306.222-.335.446-.279.75-.166.305.111 1.93.909 2.263 1.075.334.166.556.25.639.39.083.14.083.804-.213 1.641Z" />
            </svg>
            Enquire on WhatsApp
          </a>

          <Link
            href={`/galleries/${gallery.slug}`}
            className="mt-4 block text-sm text-neutral-500 hover:underline"
          >
            ← Back to {gallery.title}
          </Link>
        </div>
      </div>

      <AppreciationBox
        targetId={artwork.id}
        appreciations={artwork.appreciations}
        submitAction={submitArtworkAppreciation}
        heading="Appreciations for this painting"
        ctaLabel="Appreciate this painting"
        placeholder="Say something about this painting…"
        emptyText="Be the first to share your thoughts on this painting."
      />

      <WhatsAppFloatingButton phoneNumber={artwork.whatsapp_number ?? gallery.whatsapp_number} siteDefault={siteDefaultWhatsapp} />
    </div>
  );
}
