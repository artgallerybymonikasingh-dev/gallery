"use client";

import { useState } from "react";
import type { Artist } from "@/lib/types";

export default function ArtistTabs({ artists }: { artists: Artist[] }) {
  const [activeId, setActiveId] = useState(artists[0]?.id);
  const active = artists.find((a) => a.id === activeId) ?? artists[0];

  if (artists.length === 0) {
    return <p className="text-neutral-500">No artist profiles have been added yet.</p>;
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto border-b border-royal-gold/25 pb-px">
        {artists.map((artist) => (
          <button
            key={artist.id}
            type="button"
            onClick={() => setActiveId(artist.id)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              artist.id === active.id
                ? "border-royal-maroon text-royal-maroon"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {artist.name}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
        {active.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.avatar_url}
            alt={active.name}
            className="h-32 w-32 shrink-0 rounded-full object-cover ring-2 ring-royal-gold/40 sm:h-40 sm:w-40"
          />
        ) : (
          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-royal-cream-deep text-3xl font-semibold text-royal-maroon/50 sm:h-40 sm:w-40">
            {active.name.charAt(0)}
          </div>
        )}

        <div>
          <h2 className="font-serif text-lg font-semibold text-royal-maroon sm:text-xl">
            {active.name}
          </h2>
          {active.bio ? (
            <p className="mt-2 whitespace-pre-line text-neutral-700">{active.bio}</p>
          ) : (
            <p className="mt-2 text-neutral-500">No profile description added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
