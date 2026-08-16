import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNavMenu from "@/components/admin/AdminNavMenu";

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
      <header className="relative border-b-2 border-royal-gold bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/admin" className="font-serif font-semibold text-royal-maroon">
            Admin
          </Link>
          <AdminNavMenu />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
