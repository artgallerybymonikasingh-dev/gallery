import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PhotoGrid from "@/components/PhotoGrid";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import Breadcrumbs from "@/components/Breadcrumbs";
import GalleryAppreciationSection from "@/components/GalleryAppreciationSection";
import type { Appreciation, ArtworkWithAppreciations, GalleryWithArtist } from "@/lib/types";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: gallery } = await supabase
    .from("galleries")
    .select("*, artist:artists(*), appreciations(*)")
    .eq("id", id)
    .single<GalleryWithArtist & { appreciations: Appreciation[] }>();

  if (!gallery) notFound();

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

      <GalleryAppreciationSection galleryId={gallery.id} appreciations={gallery.appreciations} />

      <WhatsAppFloatingButton phoneNumber={gallery.whatsapp_number} />
    </div>
  );
}
