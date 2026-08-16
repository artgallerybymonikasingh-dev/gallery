"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/exhibitions", label: "Next Exhibition" },
  { href: "/contact", label: "Reach Us" },
];

export default function NavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-royal-cream/90 transition-colors hover:text-royal-gold-light"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Mobile */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-md text-royal-cream sm:hidden"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-full border-b-2 border-royal-gold bg-royal-cream px-4 py-3 sm:hidden">
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-2.5 text-base font-medium text-royal-ink hover:bg-royal-cream-deep"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
