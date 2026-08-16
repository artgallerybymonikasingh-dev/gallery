"use client";

import { useMemo, useState, type ReactNode } from "react";

export type SearchEntry = {
  key: string;
  searchText: string;
  node: ReactNode;
};

export default function SearchGrid({
  entries,
  placeholder,
  emptyText,
  noResultsText,
  gridClassName,
  minItemsToShowSearch = 5,
}: {
  entries: SearchEntry[];
  placeholder: string;
  emptyText: string;
  noResultsText: string;
  gridClassName?: string;
  minItemsToShowSearch?: number;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => entry.searchText.toLowerCase().includes(q));
  }, [entries, query]);

  if (entries.length === 0) {
    return <p className="text-neutral-500">{emptyText}</p>;
  }

  return (
    <div>
      {entries.length >= minItemsToShowSearch && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="mb-4 w-full max-w-sm rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-royal-maroon focus:outline-none sm:mb-6"
        />
      )}

      {filtered.length === 0 ? (
        <p className="text-neutral-500">{noResultsText}</p>
      ) : (
        <div
          className={
            gridClassName ?? "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4"
          }
        >
          {filtered.map((entry, index) => (
            <div
              key={entry.key}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
            >
              {entry.node}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
