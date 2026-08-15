import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-neutral-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight sm:text-xl">
          Monika Singh <span className="font-normal text-neutral-500">— Art Gallery</span>
        </Link>
      </div>
    </header>
  );
}
