"use client";

import { useState } from "react";

export default function ShareButton({
  url,
  title,
  text,
  className,
}: {
  url: string;
  title: string;
  text?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User dismissed the native share sheet — nothing to do.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing more we can do.
    }
  }

  return (
    <button type="button" onClick={handleShare} className={className}>
      {copied ? (
        "Link copied!"
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 3.9M15.4 6.6l-6.8 3.9" strokeLinecap="round" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}
