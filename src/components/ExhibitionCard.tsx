import Link from "next/link";
import type { ExhibitionWithArtworks } from "@/lib/types";

function formatDateRange(start: string | null, end: string | null): string | null {
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  if (end) return fmt(end);
  return null;
}

export default function ExhibitionCard({ exhibition }: { exhibition: ExhibitionWithArtworks }) {
  const dateRange = formatDateRange(exhibition.start_date, exhibition.end_date);

  return (
    <Link
      href={`/exhibitions/${exhibition.slug}`}
      className="card-hover-float group block overflow-hidden rounded-lg border border-royal-gold/25 bg-white shadow-sm transition-all duration-300 ease-out hover:border-royal-gold/70 hover:shadow-xl hover:shadow-royal-maroon/15 active:scale-[0.98] active:shadow-md"
    >
      <div
        className={`relative aspect-square w-full overflow-hidden bg-royal-cream-deep ${
          exhibition.coverImageUrl ? "animate-pulse" : ""
        }`}
      >
        {exhibition.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exhibition.coverImageUrl}
            alt={exhibition.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-active:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
            No photos yet
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-royal-maroon/50 via-royal-maroon/0 to-royal-maroon/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {dateRange && (
          <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
            🗓️ {dateRange}
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h2 className="truncate text-base font-medium text-royal-ink transition-colors group-hover:text-royal-maroon sm:text-lg">
          {exhibition.title}
        </h2>
        <p className="flex items-center gap-1 truncate text-sm text-neutral-500">
          {exhibition.artist ? exhibition.artist.name : "Group show"}
          <span className="inline-block -translate-x-1 text-royal-gold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            →
          </span>
        </p>
      </div>
    </Link>
  );
}
