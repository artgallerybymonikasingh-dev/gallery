import Link from "next/link";
import type { GalleryWithArtist } from "@/lib/types";

export default function GalleryCard({ gallery }: { gallery: GalleryWithArtist }) {
  return (
    <Link
      href={`/galleries/${gallery.id}`}
      className="group block overflow-hidden rounded-lg border border-royal-gold/25 bg-white shadow-sm transition-shadow hover:shadow-md hover:shadow-royal-gold/20"
    >
      <div className="aspect-square w-full overflow-hidden bg-royal-cream-deep">
        {gallery.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gallery.cover_image_url}
            alt={gallery.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
            No photos yet
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h2 className="truncate text-base font-medium sm:text-lg">{gallery.title}</h2>
        <p className="truncate text-sm text-neutral-500">{gallery.artist.name}</p>
      </div>
    </Link>
  );
}
