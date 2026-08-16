"use client";

import { useState } from "react";
import Link from "next/link";
import type { Artist } from "@/lib/types";

export default function ArtistAccordion({ artists }: { artists: Artist[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  if (artists.length === 0) {
    return <p className="text-neutral-500">No artist profiles have been added yet.</p>;
  }

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="divide-y divide-royal-gold/25 overflow-hidden rounded-lg border border-royal-gold/25 bg-white">
      {artists.map((artist) => {
        const isOpen = openIds.has(artist.id);
        return (
          <div key={artist.id}>
            <button
              type="button"
              onClick={() => toggle(artist.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-royal-cream-deep/50 sm:px-5 sm:py-4"
            >
              {artist.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artist.avatar_url}
                  alt={artist.name}
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-royal-gold/40 sm:h-14 sm:w-14"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-royal-cream-deep text-lg font-semibold text-royal-maroon/50 sm:h-14 sm:w-14">
                  {artist.name.charAt(0)}
                </div>
              )}

              <span className="flex-1 font-serif text-base font-medium text-royal-maroon sm:text-lg">
                {artist.name}
              </span>

              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 shrink-0 text-royal-maroon/60 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                  {artist.bio ? (
                    <p className="whitespace-pre-line text-sm text-neutral-700 sm:text-base">
                      {artist.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-500">No profile description added yet.</p>
                  )}
                  <Link
                    href={`/artists/${artist.id}`}
                    className="mt-3 inline-block text-sm font-medium text-royal-teal hover:underline"
                  >
                    View {artist.name}&apos;s galleries →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
