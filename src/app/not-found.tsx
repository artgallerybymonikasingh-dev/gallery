import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-2 border-royal-gold bg-gradient-to-r from-royal-maroon via-[#571C38] to-royal-plum py-4">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Link href="/" className="font-serif text-xl font-semibold text-royal-gold-light">
            Chitrashala
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="font-serif text-6xl text-royal-gold sm:text-7xl">॰ 404 ॰</p>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-royal-maroon sm:text-3xl">
          This canvas is blank
        </h1>
        <p className="mt-2 max-w-sm text-neutral-600">
          The page you're looking for doesn't exist, or may have been moved.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-royal-maroon px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
        >
          Back to the gallery
        </Link>
      </main>
    </div>
  );
}
