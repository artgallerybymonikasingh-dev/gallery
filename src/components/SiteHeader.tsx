import Link from "next/link";
import NavMenu from "./NavMenu";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-neutral-50/90 backdrop-blur">
      <div className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="leading-tight">
          <span className="block text-xl font-semibold tracking-tight sm:text-2xl">Chitrashala</span>
          <span className="block text-xs text-neutral-500 sm:text-sm">
            Art by Monika Singh &amp; Associates
          </span>
        </Link>
        <NavMenu />
      </div>
    </header>
  );
}
