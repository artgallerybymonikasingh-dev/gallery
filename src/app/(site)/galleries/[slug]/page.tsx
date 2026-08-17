import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PhotoGrid from "@/components/PhotoGrid";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import Breadcrumbs from "@/components/Breadcrumbs";
import AppreciationBox from "@/components/AppreciationBox";
import ShareButton from "@/components/ShareButton";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import { getSiteWhatsappNumber } from "@/lib/siteSettings";
import { submitGalleryAppreciation } from "../../actions";
import type { Appreciation, ArtworkWithAppreciations, GalleryWithArtist } from "@/lib/types";

const getGallery = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("galleries")
    .select("*, artist:artists(*), appreciations(*)")
    .eq("slug", slug)
    .single<GalleryWithArtist & { appreciations: Appreciation[] }>();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) return {};

  const title = gallery.title;
  const description =
    gallery.description ?? `A gallery of artwork by ${gallery.artist.name} on Chitrashala.`;
  const images = gallery.cover_image_url ? [gallery.cover_image_url] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images },
    twitter: { title, description, images },
  };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gallery = await getGallery(slug);

  if (!gallery) notFound();

  const supabase = await createClient();
  const { data: artworks } = await supabase
    .from("artworks")
    .select("*, appreciations(*)")
    .eq("gallery_id", gallery.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<ArtworkWithAppreciations[]>();

  const galleryUrl = `${SITE_URL}/galleries/${gallery.slug}`;
  const siteDefaultWhatsapp = await getSiteWhatsappNumber();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: gallery.title,
          description: gallery.description ?? undefined,
          url: galleryUrl,
          about: { "@type": "Person", name: gallery.artist.name },
          hasPart: (artworks ?? []).map((a) => ({
            "@type": "VisualArtwork",
            name: a.title,
            image: a.image_url,
            description: a.description ?? undefined,
            creator: { "@type": "Person", name: gallery.artist.name },
          })),
        }}
      />
      <Breadcrumbs
        items={[
          { label: gallery.artist.name, href: `/artists/${gallery.artist.slug}` },
          { label: gallery.title },
        ]}
      />
      <div className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-royal-maroon sm:text-3xl">
            {gallery.title}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 sm:text-base">by {gallery.artist.name}</p>
          {gallery.description && (
            <p className="mt-3 max-w-2xl whitespace-pre-line text-neutral-700">
              {gallery.description}
            </p>
          )}
        </div>
        <ShareButton
          url={galleryUrl}
          title={gallery.title}
          text={`${gallery.title} by ${gallery.artist.name} on Chitrashala`}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-royal-gold/40 px-3 py-1.5 text-xs font-medium text-royal-maroon transition-colors hover:bg-royal-cream-deep"
        />
      </div>

      <PhotoGrid
        artworks={artworks ?? []}
        artistName={gallery.artist.name}
        whatsappNumber={gallery.whatsapp_number}
        siteDefaultWhatsapp={siteDefaultWhatsapp}
        shareUrl={galleryUrl}
      />

      <AppreciationBox
        targetId={gallery.id}
        appreciations={gallery.appreciations}
        submitAction={submitGalleryAppreciation}
        heading="Appreciations for this gallery"
        ctaLabel="Appreciate this gallery"
        placeholder="Say something about this gallery…"
        emptyText="Be the first to share your thoughts on this gallery."
      />

      <WhatsAppFloatingButton phoneNumber={gallery.whatsapp_number} siteDefault={siteDefaultWhatsapp} />
    </div>
  );
}
