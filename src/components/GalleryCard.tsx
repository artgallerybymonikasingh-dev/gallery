import Link from "next/link";
import type { GalleryWithArtist } from "@/lib/types";

export default function GalleryCard({ gallery }: { gallery: GalleryWithArtist }) {
  return (
    <Link
      href={`/galleries/${gallery.id}`}
      className="group block overflow-hidden rounded-lg border border-royal-gold/25 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-royal-gold/70 hover:shadow-xl hover:shadow-royal-maroon/15 active:translate-y-0 active:scale-[0.98] active:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-royal-cream-deep">
        {gallery.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gallery.cover_image_url}
            alt={gallery.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-active:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
            No photos yet
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-royal-maroon/50 via-royal-maroon/0 to-royal-maroon/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="p-3 sm:p-4">
        <h2 className="truncate text-base font-medium text-royal-ink transition-colors group-hover:text-royal-maroon sm:text-lg">
          {gallery.title}
        </h2>
        <p className="flex items-center gap-1 truncate text-sm text-neutral-500">
          {gallery.artist.name}
          <span className="inline-block -translate-x-1 text-royal-gold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            →
          </span>
        </p>
      </div>
    </Link>
  );
}
