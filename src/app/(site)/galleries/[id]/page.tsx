import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PhotoGrid from "@/components/PhotoGrid";
import type { Artwork, GalleryWithArtist } from "@/lib/types";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: gallery } = await supabase
    .from("galleries")
    .select("*, artist:artists(*)")
    .eq("id", id)
    .single<GalleryWithArtist>();

  if (!gallery) notFound();

  const { data: artworks } = await supabase
    .from("artworks")
    .select("*")
    .eq("gallery_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Artwork[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{gallery.title}</h1>
        <p className="mt-1 text-sm text-neutral-500 sm:text-base">by {gallery.artist.name}</p>
        {gallery.description && (
          <p className="mt-3 max-w-2xl whitespace-pre-line text-neutral-700">
            {gallery.description}
          </p>
        )}
      </div>

      <PhotoGrid artworks={artworks ?? []} artistName={gallery.artist.name} />
    </div>
  );
}
