import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  // Pending-appreciation count needs the service-role client since RLS
  // only exposes approved=true rows to the anon-key client.
  const admin = createAdminClient();

  const [{ count: artistCount }, { count: galleryCount }, { count: exhibitionCount }, { count: pendingCount }] =
    await Promise.all([
      supabase.from("artists").select("*", { count: "exact", head: true }),
      supabase.from("galleries").select("*", { count: "exact", head: true }),
      supabase.from("exhibitions").select("*", { count: "exact", head: true }),
      admin.from("appreciations").select("*", { count: "exact", head: true }).eq("approved", false),
    ]);

  const cards = [
    {
      href: "/admin/artists",
      icon: "👤",
      title: "Artists",
      description: "Profiles, bios, and contact details.",
      count: artistCount ?? 0,
    },
    {
      href: "/admin/galleries",
      icon: "🏛️",
      title: "Galleries",
      description: "Create galleries, then add photos inside each.",
      count: galleryCount ?? 0,
    },
    {
      href: "/admin/exhibitions",
      icon: "🖼️",
      title: "Exhibitions",
      description: "Upcoming and current shows.",
      count: exhibitionCount ?? 0,
    },
    {
      href: "/admin/appreciations",
      icon: "💛",
      title: "Appreciations",
      description: "Moderate visitor messages.",
      count: pendingCount ?? 0,
      countLabel: "pending",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-500">Manage the gallery site from here.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-royal-gold/25 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              {card.count > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    card.countLabel
                      ? "bg-royal-maroon text-white"
                      : "bg-royal-cream-deep text-royal-ink"
                  }`}
                >
                  {card.count} {card.countLabel ?? ""}
                </span>
              )}
            </div>
            <p className="mt-2 font-serif text-lg font-medium text-royal-maroon">{card.title}</p>
            <p className="mt-0.5 text-sm text-neutral-500">{card.description}</p>
          </Link>
        ))}
      </div>

      <a
        href="/api/admin/export"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-royal-teal hover:underline"
      >
        ⬇ Export all data as JSON
      </a>
      <p className="mt-1 text-xs text-neutral-500">
        A free backup independent of Supabase, in case you ever need one.
      </p>
    </div>
  );
}
