import { createClient } from "@/lib/supabase/server";
import GalleryCard from "@/components/GalleryCard";
import type { GalleryWithArtist } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: galleries } = await supabase
    .from("galleries")
    .select("*, artist:artists(*)")
    .order("created_at", { ascending: false })
    .returns<GalleryWithArtist[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Galleries</h1>
        <p className="mt-1 text-sm text-neutral-500 sm:text-base">
          Original artwork by Monika Singh and associated artists.
        </p>
      </div>

      {!galleries || galleries.length === 0 ? (
        <p className="text-neutral-500">No galleries have been published yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {galleries.map((gallery) => (
            <GalleryCard key={gallery.id} gallery={gallery} />
          ))}
        </div>
      )}
    </div>
  );
}
