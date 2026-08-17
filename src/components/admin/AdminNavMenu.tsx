"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/admin/actions-auth";

const LINKS = [
  { href: "/admin/artists", label: "Artists" },
  { href: "/admin/galleries", label: "Galleries" },
  { href: "/admin/exhibitions", label: "Exhibitions" },
  { href: "/admin/appreciations", label: "Appreciations" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-4 text-sm sm:flex">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="text-neutral-500 hover:text-neutral-900">
            {link.label}
          </Link>
        ))}
        <Link href="/" target="_blank" className="text-neutral-500 hover:text-neutral-900">
          View site
        </Link>
        <form action={signOut}>
          <button type="submit" className="text-neutral-500 hover:text-neutral-900">
            Sign out
          </button>
        </form>
      </nav>

      {/* Mobile */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-700 sm:hidden"
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
        <nav className="absolute inset-x-0 top-full z-20 border-b-2 border-royal-gold bg-white px-4 py-3 shadow-md sm:hidden">
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-2.5 text-base font-medium text-neutral-700 hover:bg-royal-cream-deep"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/"
                target="_blank"
                onClick={() => setOpen(false)}
                className="block rounded-md px-2 py-2.5 text-base font-medium text-neutral-700 hover:bg-royal-cream-deep"
              >
                View site
              </Link>
            </li>
            <li>
              <form action={signOut}>
                <button
                  type="submit"
                  className="block w-full rounded-md px-2 py-2.5 text-left text-base font-medium text-neutral-700 hover:bg-royal-cream-deep"
                >
                  Sign out
                </button>
              </form>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}
