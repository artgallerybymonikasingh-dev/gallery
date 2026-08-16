import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions-auth";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: proxy.ts already redirects unauthenticated visitors,
  // but every server-rendered admin route re-checks the session itself
  // (see Next.js Data Security guide — Proxy alone is not a security boundary).
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-royal-cream">
      <header className="border-b-2 border-royal-gold bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
          <Link href="/admin" className="font-serif font-semibold text-royal-maroon">
            Admin
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5 text-sm">
            <Link href="/admin/exhibitions" className="text-neutral-500 hover:text-neutral-900">
              Exhibitions
            </Link>
            <Link href="/admin/appreciations" className="text-neutral-500 hover:text-neutral-900">
              Appreciations
            </Link>
            <Link href="/" target="_blank" className="text-neutral-500 hover:text-neutral-900">
              View site
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-neutral-500 hover:text-neutral-900">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
