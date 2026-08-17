"use client";

import { useState, type ReactNode } from "react";

export default function HomeTabs({
  artistsContent,
  exhibitionsContent,
}: {
  artistsContent: ReactNode;
  exhibitionsContent: ReactNode;
}) {
  const [tab, setTab] = useState<"artists" | "exhibitions">("artists");

  return (
    <div>
      <div className="mb-5 inline-flex rounded-full border border-royal-gold/30 bg-white p-1 text-sm sm:mb-6">
        <button
          type="button"
          onClick={() => setTab("artists")}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            tab === "artists" ? "bg-royal-maroon text-white" : "text-neutral-600 hover:text-royal-maroon"
          }`}
        >
          Artists
        </button>
        <button
          type="button"
          onClick={() => setTab("exhibitions")}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            tab === "exhibitions" ? "bg-royal-maroon text-white" : "text-neutral-600 hover:text-royal-maroon"
          }`}
        >
          Exhibitions
        </button>
      </div>

      {tab === "artists" ? artistsContent : exhibitionsContent}
    </div>
  );
}
