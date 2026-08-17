import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RankedEntry = { id: string; label: string; sublabel?: string; href: string; count: number };

// Supabase's embedded-resource counts only aggregate per-row, so ranking
// "top N across the whole table" is done here in JS: tally approved
// appreciations per target id, take the top 5, then fetch just those rows'
// display details.
async function tallyTop(
  admin: ReturnType<typeof createAdminClient>,
  idColumn: "artwork_id" | "gallery_id" | "artist_id"
): Promise<[string, number][]> {
  const { data } = await admin.from("appreciations").select(idColumn).eq("approved", true).not(idColumn, "is", null);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = (row as Record<string, string>)[idColumn];
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

async function topArtworks(admin: ReturnType<typeof createAdminClient>): Promise<RankedEntry[]> {
  const top = await tallyTop(admin, "artwork_id");
  if (top.length === 0) return [];
  const { data } = await admin
    .from("artworks")
    .select("id, title, gallery:galleries(slug, title)")
    .in(
      "id",
      top.map(([id]) => id)
    )
    .returns<{ id: string; title: string; gallery: { slug: string; title: string } | null }[]>();
  const byId = new Map((data ?? []).map((a) => [a.id, a]));
  return top
    .map((entry): RankedEntry | null => {
      const [id, count] = entry;
      const a = byId.get(id);
      if (!a || !a.gallery) return null;
      return { id, label: a.title, sublabel: a.gallery.title, href: `/galleries/${a.gallery.slug}`, count };
    })
    .filter((e): e is RankedEntry => e !== null);
}

async function topGalleries(admin: ReturnType<typeof createAdminClient>): Promise<RankedEntry[]> {
  const top = await tallyTop(admin, "gallery_id");
  if (top.length === 0) return [];
  const { data } = await admin
    .from("galleries")
    .select("id, slug, title, artist:artists(name)")
    .in(
      "id",
      top.map(([id]) => id)
    )
    .returns<{ id: string; slug: string; title: string; artist: { name: string } | null }[]>();
  const byId = new Map((data ?? []).map((g) => [g.id, g]));
  return top
    .map((entry): RankedEntry | null => {
      const [id, count] = entry;
      const g = byId.get(id);
      if (!g) return null;
      return { id, label: g.title, sublabel: g.artist?.name, href: `/galleries/${g.slug}`, count };
    })
    .filter((e): e is RankedEntry => e !== null);
}

async function topArtists(admin: ReturnType<typeof createAdminClient>): Promise<RankedEntry[]> {
  const top = await tallyTop(admin, "artist_id");
  if (top.length === 0) return [];
  const { data } = await admin
    .from("artists")
    .select("id, slug, name")
    .in(
      "id",
      top.map(([id]) => id)
    )
    .returns<{ id: string; slug: string; name: string }[]>();
  const byId = new Map((data ?? []).map((a) => [a.id, a]));
  return top
    .map((entry): RankedEntry | null => {
      const [id, count] = entry;
      const a = byId.get(id);
      if (!a) return null;
      return { id, label: a.name, href: `/artists/${a.slug}`, count };
    })
    .filter((e): e is RankedEntry => e !== null);
}

function RankedList({ title, entries }: { title: string; entries: RankedEntry[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{title}</p>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">No approved appreciations yet.</p>
      ) : (
        <ol className="mt-2 space-y-1.5">
          {entries.map((e, index) => (
            <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
              <a
                href={e.href}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-neutral-700 hover:underline"
              >
                {index + 1}. {e.label}
                {e.sublabel && <span className="text-neutral-400"> · {e.sublabel}</span>}
              </a>
              <span className="shrink-0 rounded-full bg-royal-cream-deep px-1.5 py-0.5 text-xs font-semibold text-royal-ink">
                💛 {e.count}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  // Pending-appreciation count needs the service-role client since RLS
  // only exposes approved=true rows to the anon-key client.
  const admin = createAdminClient();

  const [
    { count: artistCount },
    { count: galleryCount },
    { count: exhibitionCount },
    { count: pendingCount },
    rankedArtworks,
    rankedGalleries,
    rankedArtists,
  ] = await Promise.all([
    supabase.from("artists").select("*", { count: "exact", head: true }),
    supabase.from("galleries").select("*", { count: "exact", head: true }),
    supabase.from("exhibitions").select("*", { count: "exact", head: true }),
    admin.from("appreciations").select("*", { count: "exact", head: true }).eq("approved", false),
    topArtworks(admin),
    topGalleries(admin),
    topArtists(admin),
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

      <div className="mt-8">
        <h2 className="text-sm font-medium text-neutral-700">Top appreciated</h2>
        <div className="mt-3 grid gap-4 rounded-lg border border-royal-gold/25 bg-white p-4 shadow-sm sm:grid-cols-3">
          <RankedList title="Paintings" entries={rankedArtworks} />
          <RankedList title="Galleries" entries={rankedGalleries} />
          <RankedList title="Artists" entries={rankedArtists} />
        </div>
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
