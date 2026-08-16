import Link from "next/link";
import type { Artist } from "@/lib/types";

export default function ArtistCard({
  artist,
  coverImageUrl,
  galleryCount,
}: {
  artist: Artist;
  coverImageUrl: string | null;
  galleryCount: number;
}) {
  return (
    <Link
      href={`/artists/${artist.id}`}
      className="group block overflow-hidden rounded-lg border border-royal-gold/25 bg-white shadow-sm transition-shadow hover:shadow-md hover:shadow-royal-gold/20"
    >
      <div className="aspect-square w-full overflow-hidden bg-royal-cream-deep">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={artist.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : artist.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.avatar_url}
            alt={artist.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-neutral-300">
            {artist.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h2 className="truncate text-base font-medium sm:text-lg">{artist.name}</h2>
        <p className="truncate text-sm text-neutral-500">
          {galleryCount} {galleryCount === 1 ? "gallery" : "galleries"}
        </p>
      </div>
    </Link>
  );
}
