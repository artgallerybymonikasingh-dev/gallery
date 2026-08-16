"use client";

import { useState, type ReactNode } from "react";

export type AppreciationTab = {
  key: string;
  label: string;
  icon: string;
  pendingCount: number;
  content: ReactNode;
};

export default function AppreciationTabs({ tabs }: { tabs: AppreciationTab[] }) {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key);
  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0];

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 pb-px sm:gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveKey(tab.key)}
            className={`relative shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              tab.key === active.key
                ? "border-royal-maroon text-royal-maroon"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.icon} {tab.label}
            {tab.pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-royal-maroon px-1 text-xs font-semibold text-white">
                {tab.pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4">{active?.content}</div>
    </div>
  );
}
