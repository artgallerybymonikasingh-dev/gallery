import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AppreciationWithArtistOnly,
  AppreciationWithArtwork,
  AppreciationWithGallery,
} from "@/lib/types";
import { approveAppreciation, deleteAppreciation } from "../actions";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import AppreciationTabs, { type AppreciationTab } from "@/components/admin/AppreciationTabs";

function Row({
  imageUrl,
  contextLine,
  name,
  message,
  appreciationId,
  publicPath,
  showApprove,
}: {
  imageUrl: string | null;
  contextLine: string;
  name: string | null;
  message: string;
  appreciationId: string;
  publicPath: string;
  showApprove: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />
      )}
      <div className="flex-1 text-sm">
        <p className="text-xs text-neutral-500">{contextLine}</p>
        <p className="mt-1">
          <span className="font-medium">{name || "Anonymous"}</span>: {message}
        </p>
      </div>
      <div className="flex shrink-0 gap-3 text-sm">
        {showApprove && (
          <form action={approveAppreciation.bind(null, appreciationId, publicPath)}>
            <button type="submit" className="text-green-700 hover:underline">
              Approve
            </button>
          </form>
        )}
        <form action={deleteAppreciation.bind(null, appreciationId, publicPath)}>
          <ConfirmSubmitButton
            confirmMessage={
              showApprove ? "Reject and delete this message?" : "Remove this message from the site?"
            }
            className="text-red-600 hover:underline"
          >
            {showApprove ? "Reject" : "Remove"}
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}

function TabContent({
  pending,
  approved,
  renderRow,
}: {
  pending: { id: string }[];
  approved: { id: string }[];
  renderRow: (item: { id: string }, showApprove: boolean) => React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-neutral-700">Pending ({pending.length})</h3>
      <div className="mt-2 space-y-3">
        {pending.map((a) => renderRow(a, true))}
        {pending.length === 0 && <p className="text-sm text-neutral-500">Nothing waiting for approval.</p>}
      </div>

      <h3 className="mt-6 text-sm font-medium text-neutral-700">Approved ({approved.length})</h3>
      <div className="mt-2 space-y-3">
        {approved.map((a) => renderRow(a, false))}
        {approved.length === 0 && <p className="text-sm text-neutral-500">No approved messages yet.</p>}
      </div>
    </div>
  );
}

export default async function AdminAppreciationsPage() {
  // Uses the service-role client deliberately: the "appreciations" RLS
  // policy only lets the anon-key client see approved=true rows, but the
  // whole point of this page is moderating the unapproved ones. The route
  // itself is still gated by the (protected) layout's session check.
  const admin = createAdminClient();

  const { data: artworkAppreciations } = await admin
    .from("appreciations")
    .select("*, artwork:artworks(*, gallery:galleries(*, artist:artists(*)))")
    .not("artwork_id", "is", null)
    .order("created_at", { ascending: false })
    .returns<AppreciationWithArtwork[]>();

  const { data: galleryAppreciations } = await admin
    .from("appreciations")
    .select("*, gallery:galleries(*, artist:artists(*))")
    .not("gallery_id", "is", null)
    .order("created_at", { ascending: false })
    .returns<AppreciationWithGallery[]>();

  const { data: artistAppreciations } = await admin
    .from("appreciations")
    .select("*, artist:artists(*)")
    .not("artist_id", "is", null)
    .order("created_at", { ascending: false })
    .returns<AppreciationWithArtistOnly[]>();

  const artworkPending = (artworkAppreciations ?? []).filter((a) => !a.approved);
  const artworkApproved = (artworkAppreciations ?? []).filter((a) => a.approved);
  const galleryPending = (galleryAppreciations ?? []).filter((a) => !a.approved);
  const galleryApproved = (galleryAppreciations ?? []).filter((a) => a.approved);
  const artistPending = (artistAppreciations ?? []).filter((a) => !a.approved);
  const artistApproved = (artistAppreciations ?? []).filter((a) => a.approved);

  const tabs: AppreciationTab[] = [
    {
      key: "paintings",
      label: "Paintings",
      icon: "🖼️",
      pendingCount: artworkPending.length,
      content: (
        <TabContent
          pending={artworkPending}
          approved={artworkApproved}
          renderRow={(a, showApprove) => {
            const item = a as AppreciationWithArtwork;
            return (
              <Row
                key={item.id}
                imageUrl={item.artwork.image_url}
                contextLine={`${item.artwork.title} — ${item.artwork.gallery.title} by ${item.artwork.gallery.artist.name}`}
                name={item.name}
                message={item.message}
                appreciationId={item.id}
                publicPath={`/galleries/${item.artwork.gallery.slug}`}
                showApprove={showApprove}
              />
            );
          }}
        />
      ),
    },
    {
      key: "galleries",
      label: "Galleries",
      icon: "🏛️",
      pendingCount: galleryPending.length,
      content: (
        <TabContent
          pending={galleryPending}
          approved={galleryApproved}
          renderRow={(a, showApprove) => {
            const item = a as AppreciationWithGallery;
            return (
              <Row
                key={item.id}
                imageUrl={item.gallery.cover_image_url}
                contextLine={`${item.gallery.title} by ${item.gallery.artist.name}`}
                name={item.name}
                message={item.message}
                appreciationId={item.id}
                publicPath={`/galleries/${item.gallery.slug}`}
                showApprove={showApprove}
              />
            );
          }}
        />
      ),
    },
    {
      key: "artists",
      label: "Artists",
      icon: "👤",
      pendingCount: artistPending.length,
      content: (
        <TabContent
          pending={artistPending}
          approved={artistApproved}
          renderRow={(a, showApprove) => {
            const item = a as AppreciationWithArtistOnly;
            return (
              <Row
                key={item.id}
                imageUrl={item.artist.avatar_url}
                contextLine={item.artist.name}
                name={item.name}
                message={item.message}
                appreciationId={item.id}
                publicPath={`/artists/${item.artist.slug}`}
                showApprove={showApprove}
              />
            );
          }}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Appreciations</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Visitor messages posted on paintings, galleries, or artists. Approve to make them visible.
        </p>
      </div>

      <AppreciationTabs tabs={tabs} />
    </div>
  );
}
