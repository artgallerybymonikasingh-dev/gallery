"use client";

import { useState, type ReactNode } from "react";
import ShareButton from "./ShareButton";
import { SITE_URL } from "@/lib/site";

export default function HomeTabs({
  artistsContent,
  exhibitionsContent,
  initialTab,
}: {
  artistsContent: ReactNode;
  exhibitionsContent: ReactNode;
  initialTab: "artists" | "exhibitions";
}) {
  const [tab, setTab] = useState<"artists" | "exhibitions">(initialTab);

  function selectTab(next: "artists" | "exhibitions") {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "artists") url.searchParams.delete("view");
    else url.searchParams.set("view", next);
    window.history.replaceState(null, "", url.pathname + url.search);
  }

  const shareUrl = tab === "exhibitions" ? `${SITE_URL}/?view=exhibitions` : SITE_URL;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 sm:mb-6">
        <div className="inline-flex rounded-full border border-royal-gold/30 bg-white p-1 text-sm">
          <button
            type="button"
            onClick={() => selectTab("artists")}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              tab === "artists" ? "bg-royal-maroon text-white" : "text-neutral-600 hover:text-royal-maroon"
            }`}
          >
            Artists
          </button>
          <button
            type="button"
            onClick={() => selectTab("exhibitions")}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              tab === "exhibitions" ? "bg-royal-maroon text-white" : "text-neutral-600 hover:text-royal-maroon"
            }`}
          >
            Exhibitions
          </button>
        </div>
        <ShareButton
          url={shareUrl}
          title={tab === "artists" ? "Artists on Chitrashala" : "Exhibitions on Chitrashala"}
          text={tab === "artists" ? "Artists on Chitrashala" : "Exhibitions on Chitrashala"}
          className="flex items-center gap-1.5 rounded-full border border-royal-gold/40 px-3 py-1.5 text-xs font-medium text-royal-maroon transition-colors hover:bg-royal-cream-deep"
        />
      </div>

      {tab === "artists" ? artistsContent : exhibitionsContent}
    </div>
  );
}
