import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { ExhibitionWithArtist } from "@/lib/types";

export const metadata: Metadata = {
  title: "Next Exhibition",
  description: "Upcoming and current shows by Chitrashala's artists.",
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

export default async function ExhibitionsPage() {
  const supabase = await createClient();
  const { data: exhibitions } = await supabase
    .from("exhibitions")
    .select("*, artist:artists(*)")
    .order("start_date", { ascending: true, nullsFirst: false })
    .returns<ExhibitionWithArtist[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Breadcrumbs items={[{ label: "Next Exhibition" }]} />
      <div className="mb-6 sm:mb-8">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-royal-maroon sm:text-3xl">
          Next Exhibition
        </h1>
        <p className="mt-1 text-sm text-neutral-500 sm:text-base">
          Upcoming and current shows across locations.
        </p>
      </div>

      {!exhibitions || exhibitions.length === 0 ? (
        <p className="text-neutral-500">No upcoming exhibitions have been announced yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {exhibitions.map((ex) => {
            const dateRange = formatDateRange(ex.start_date, ex.end_date);
            return (
              <div
                key={ex.id}
                className="rounded-lg border border-royal-gold/25 bg-white p-4 shadow-sm sm:p-5"
              >
                <h2 className="font-serif text-lg font-medium text-royal-maroon">{ex.title}</h2>
                {ex.artist && <p className="mt-0.5 text-sm text-neutral-500">by {ex.artist.name}</p>}
                <div className="mt-2 space-y-0.5 text-sm text-neutral-600">
                  {ex.location && <p>📍 {ex.location}</p>}
                  {dateRange && <p>🗓️ {dateRange}</p>}
                </div>
                {ex.description && (
                  <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">{ex.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
