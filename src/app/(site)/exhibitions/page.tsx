import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShareButton from "@/components/ShareButton";
import { SITE_URL } from "@/lib/site";
import { getExhibitionPhase } from "@/lib/exhibitionPhase";
import type { Artist, ExhibitionWithArtists } from "@/lib/types";

export const metadata: Metadata = {
  title: "Next Exhibition",
  description: "Upcoming shows by Chitrashala's artists.",
};

function formatDateRange(start: string | null, end: string | null): string | null {
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  if (end) return fmt(end);
  return null;
}

type RawExhibition = Omit<ExhibitionWithArtists, "artists"> & {
  exhibition_artists: { artist: Artist }[];
};

export default async function ExhibitionsPage() {
  const supabase = await createClient();
  const { data: rawExhibitions } = await supabase
    .from("exhibitions")
    .select("*, exhibition_artists(artist:artists(*))")
    .order("start_date", { ascending: true, nullsFirst: false })
    .returns<RawExhibition[]>();

  const exhibitions: ExhibitionWithArtists[] = (rawExhibitions ?? [])
    .map((ex) => ({
      ...ex,
      artists: ex.exhibition_artists.map((link) => link.artist),
    }))
    .filter((ex) => getExhibitionPhase(ex.start_date, ex.end_date) === "upcoming");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Breadcrumbs items={[{ label: "Next Exhibition" }]} />
      <div className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-royal-maroon sm:text-3xl">
            Next Exhibition
          </h1>
          <p className="mt-1 text-sm text-neutral-500 sm:text-base">
            Upcoming shows across locations.
          </p>
        </div>
        <ShareButton
          url={`${SITE_URL}/exhibitions`}
          title="Next Exhibition on Chitrashala"
          text="Upcoming exhibitions on Chitrashala"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-royal-gold/40 px-3 py-1.5 text-xs font-medium text-royal-maroon transition-colors hover:bg-royal-cream-deep"
        />
      </div>

      {!exhibitions || exhibitions.length === 0 ? (
        <p className="text-neutral-500">No upcoming exhibitions have been announced yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {exhibitions.map((ex, index) => {
            const dateRange = formatDateRange(ex.start_date, ex.end_date);
            return (
              <Link
                key={ex.id}
                href={`/exhibitions/${ex.slug}`}
                style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
                className="card-hover-float animate-card-in block overflow-hidden rounded-lg border border-royal-gold/25 bg-white shadow-sm transition-all duration-300 ease-out hover:border-royal-gold/70 hover:shadow-lg hover:shadow-royal-maroon/15 active:scale-[0.98]"
              >
                {ex.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ex.cover_image_url}
                    alt={ex.title}
                    loading="lazy"
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="p-4 sm:p-5">
                  <h2 className="font-serif text-lg font-medium text-royal-maroon">{ex.title}</h2>
                  {ex.artists.length > 0 && (
                    <p className="mt-0.5 text-sm text-neutral-500">
                      by {ex.artists.map((a) => a.name).join(", ")}
                    </p>
                  )}
                  <div className="mt-2 space-y-0.5 text-sm text-neutral-600">
                    {ex.location && <p>📍 {ex.location}</p>}
                    {dateRange && <p>🗓️ {dateRange}</p>}
                  </div>
                  {ex.description && (
                    <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">{ex.description}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
