import Link from "next/link";
import NavMenu from "./NavMenu";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-royal-gold bg-gradient-to-r from-royal-maroon via-[#571C38] to-royal-plum shadow-md">
      <div className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="leading-tight">
          <span className="block font-serif text-xl font-semibold tracking-wide text-royal-gold-light sm:text-2xl">
            Chitrashala
          </span>
          <span className="block text-xs text-royal-cream/80 sm:text-sm">
            Art by Monika Singh &amp; Associates
          </span>
        </Link>
        <NavMenu />
      </div>
    </header>
  );
}
