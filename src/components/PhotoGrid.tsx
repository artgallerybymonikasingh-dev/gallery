"use client";

import { useMemo, useState } from "react";
import type { ArtworkWithAppreciations } from "@/lib/types";
import PhotoLightbox from "./PhotoLightbox";

export type ArtworkWithPermalink = ArtworkWithAppreciations & { permalink: string };

export default function PhotoGrid({
  artworks,
  fallbackArtistName,
  whatsappNumber,
  siteDefaultWhatsapp,
  emptyText = "No photos in this gallery yet.",
}: {
  artworks: ArtworkWithPermalink[];
  fallbackArtistName: string;
  whatsappNumber?: string | null;
  siteDefaultWhatsapp: string;
  emptyText?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);

  const hasSoldOrReserved = artworks.some((a) => a.status !== "available");
  const visibleArtworks = useMemo(
    () => (availableOnly ? artworks.filter((a) => a.status === "available") : artworks),
    [artworks, availableOnly]
  );

  const selected = selectedIndex !== null ? visibleArtworks[selectedIndex] : null;
  const hasMultiple = visibleArtworks.length > 1;

  if (artworks.length === 0) {
    return <p className="text-neutral-500">{emptyText}</p>;
  }

  return (
    <>
      {hasSoldOrReserved && (
        <label className="mb-3 flex w-fit items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => {
              setAvailableOnly(e.target.checked);
              setSelectedIndex(null);
            }}
          />
          Show available only
        </label>
      )}

      {visibleArtworks.length === 0 ? (
        <p className="text-neutral-500">No available photos right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {visibleArtworks.map((artwork, index) => (
            <button
              key={artwork.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
              className="card-hover-float group relative aspect-square animate-card-in animate-pulse overflow-hidden rounded-lg border border-royal-gold/20 bg-royal-cream-deep text-left shadow-sm transition-all duration-300 ease-out hover:border-royal-gold/70 hover:shadow-lg hover:shadow-royal-maroon/15 active:scale-[0.97]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artwork.image_url}
                alt={artwork.title}
                loading="lazy"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="h-full w-full select-none object-cover transition-transform duration-500 ease-out [-webkit-touch-callout:none] group-hover:scale-110 group-active:scale-105"
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
              <span
                className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  artwork.status === "sold"
                    ? "bg-royal-maroon/90 text-white"
                    : artwork.status === "reserved"
                      ? "bg-royal-teal/90 text-white"
                      : "bg-white/80 text-neutral-600 backdrop-blur"
                }`}
              >
                {artwork.status === "sold" ? "Sold" : artwork.status === "reserved" ? "Reserved" : "Available"}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && selectedIndex !== null && (
        <PhotoLightbox
          artwork={selected}
          artworks={visibleArtworks}
          selectedIndex={selectedIndex}
          fallbackArtistName={fallbackArtistName}
          whatsappNumber={whatsappNumber}
          siteDefaultWhatsapp={siteDefaultWhatsapp}
          onClose={() => setSelectedIndex(null)}
          onSelect={setSelectedIndex}
          onPrev={
            hasMultiple
              ? () => setSelectedIndex((selectedIndex - 1 + visibleArtworks.length) % visibleArtworks.length)
              : undefined
          }
          onNext={
            hasMultiple ? () => setSelectedIndex((selectedIndex + 1) % visibleArtworks.length) : undefined
          }
        />
      )}
    </>
  );
}
