"use client";

import { useState } from "react";
import type { ArtworkWithAppreciations } from "@/lib/types";
import PhotoLightbox from "./PhotoLightbox";

export default function PhotoGrid({
  artworks,
  artistName,
  whatsappNumber,
}: {
  artworks: ArtworkWithAppreciations[];
  artistName: string;
  whatsappNumber?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = artworks.find((a) => a.id === selectedId) ?? null;

  if (artworks.length === 0) {
    return <p className="text-neutral-500">No photos in this gallery yet.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
        {artworks.map((artwork) => (
          <button
            key={artwork.id}
            type="button"
            onClick={() => setSelectedId(artwork.id)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-royal-gold/20 bg-royal-cream-deep text-left shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-royal-gold/70 hover:shadow-lg hover:shadow-royal-maroon/15 active:translate-y-0 active:scale-[0.97]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artwork.image_url}
              alt={artwork.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-active:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-royal-maroon/0 transition-colors duration-300 group-hover:bg-royal-maroon/25">
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8 scale-75 text-white opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <PhotoLightbox
          artwork={selected}
          artistName={artistName}
          whatsappNumber={whatsappNumber}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
