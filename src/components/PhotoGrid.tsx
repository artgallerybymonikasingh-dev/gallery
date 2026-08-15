"use client";

import { useState } from "react";
import type { Artwork } from "@/lib/types";
import PhotoLightbox from "./PhotoLightbox";

export default function PhotoGrid({
  artworks,
  artistName,
  whatsappNumber,
}: {
  artworks: Artwork[];
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
            className="group aspect-square overflow-hidden rounded-lg bg-neutral-100 text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artwork.image_url}
              alt={artwork.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
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
