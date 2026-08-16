import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PhotoGrid from "@/components/PhotoGrid";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import Breadcrumbs from "@/components/Breadcrumbs";
import AppreciationBox from "@/components/AppreciationBox";
import { submitGalleryAppreciation } from "../../actions";
import type { Appreciation, ArtworkWithAppreciations, GalleryWithArtist } from "@/lib/types";

const getGallery = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("galleries")
    .select("*, artist:artists(*), appreciations(*)")
    .eq("id", id)
    .single<GalleryWithArtist & { appreciations: Appreciation[] }>();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const gallery = await getGallery(id);
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
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gallery = await getGallery(id);

  if (!gallery) notFound();

  const supabase = await createClient();
  const { data: artworks } = await supabase
    .from("artworks")
    .select("*, appreciations(*)")
    .eq("gallery_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<ArtworkWithAppreciations[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Breadcrumbs
        items={[
          { label: gallery.artist.name, href: `/artists/${gallery.artist.id}` },
          { label: gallery.title },
        ]}
      />
      <div className="mb-6 sm:mb-8">
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

      <PhotoGrid
        artworks={artworks ?? []}
        artistName={gallery.artist.name}
        whatsappNumber={gallery.whatsapp_number}
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

      <WhatsAppFloatingButton phoneNumber={gallery.whatsapp_number} />
    </div>
  );
}
