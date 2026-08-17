"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ArtworkWithAppreciations } from "@/lib/types";
import { whatsappEnquiryLink } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/site";
import AppreciationSection from "./AppreciationSection";
import ShareButton from "./ShareButton";

const STATUS_LABEL: Record<string, string> = { reserved: "Reserved", sold: "Sold" };

export default function PhotoLightbox({
  artwork,
  artworks,
  selectedIndex,
  artistName,
  whatsappNumber,
  gallerySlug,
  onClose,
  onSelect,
  onPrev,
  onNext,
}: {
  artwork: ArtworkWithAppreciations;
  artworks: ArtworkWithAppreciations[];
  selectedIndex: number;
  artistName: string;
  whatsappNumber?: string | null;
  gallerySlug: string;
  onClose: () => void;
  onSelect: (index: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  // Portal straight to <body> so this always paints above everything,
  // including the sticky header — its backdrop-blur promotes it to a
  // compositing layer that some browsers stack above z-50 content that's
  // merely nested inside <main>, even though DOM stacking order says
  // otherwise.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  const hasDimensions = artwork.width_cm && artwork.height_cm;

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 sm:right-5 sm:top-5"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>

      {onPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Previous photo"
          className="absolute left-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 sm:left-3"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next photo"
          className="absolute right-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 sm:right-3"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <div className="flex flex-1 items-center justify-center overflow-hidden p-4 pb-0 sm:p-8 sm:pb-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artwork.image_url}
          alt={artwork.title}
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div
        className="max-h-[40vh] shrink-0 overflow-y-auto bg-black/40 px-5 py-4 text-white sm:px-8 sm:py-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium sm:text-xl">{artwork.title}</h2>
                {artwork.status !== "available" && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${
                      artwork.status === "sold" ? "bg-royal-maroon" : "bg-royal-teal"
                    }`}
                  >
                    {STATUS_LABEL[artwork.status]}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-neutral-300">by {artistName}</p>
            </div>
            <ShareButton
              url={`${SITE_URL}/galleries/${gallerySlug}`}
              title={artwork.title}
              text={`"${artwork.title}" by ${artistName} on Chitrashala`}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
            />
          </div>

          {hasDimensions && (
            <p className="mt-2 text-sm text-neutral-300">
              {artwork.width_cm} × {artwork.height_cm} cm
            </p>
          )}

          {artwork.description && (
            <p className="mt-2 whitespace-pre-line text-sm text-neutral-200 sm:text-base">
              {artwork.description}
            </p>
          )}

          <a
            href={whatsappEnquiryLink(artwork.title, artistName, whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
          >
            <svg viewBox="0 0 32 32" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.42.71 4.673 1.933 6.566L4 29l7.617-1.897A11.94 11.94 0 0 0 16.001 27C22.63 27 28 21.627 28 15S22.63 3 16.001 3Zm6.997 16.982c-.297.836-1.47 1.53-2.404 1.727-.64.135-1.475.243-4.287-.921-3.598-1.487-5.913-5.14-6.094-5.38-.176-.24-1.464-1.948-1.464-3.716 0-1.767.925-2.635 1.253-2.997.298-.328.65-.41.867-.41.216 0 .434.002.623.011.2.01.469-.076.734.56.297.712.945 2.284 1.028 2.45.083.166.14.36.028.577-.111.216-.166.35-.325.539-.166.187-.343.417-.49.56-.166.166-.34.346-.146.68.194.335.862 1.42 1.851 2.301 1.271 1.135 2.342 1.487 2.677 1.653.335.166.529.14.723-.083.2-.222.834-.972 1.056-1.306.222-.335.446-.279.75-.166.305.111 1.93.909 2.263 1.075.334.166.556.25.639.39.083.14.083.804-.213 1.641Z" />
            </svg>
            Enquire on WhatsApp
          </a>

          {artworks.length > 1 && (
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                More from this gallery
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {artworks.map((a, index) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(index);
                    }}
                    aria-label={a.title}
                    aria-current={index === selectedIndex}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-md ring-2 transition-opacity sm:h-16 sm:w-16 ${
                      index === selectedIndex ? "ring-white" : "opacity-60 ring-transparent hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <AppreciationSection artworkId={artwork.id} appreciations={artwork.appreciations} />
        </div>
      </div>
    </div>,
    document.body
  );
}
