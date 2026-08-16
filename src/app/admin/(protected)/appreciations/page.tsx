import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AppreciationWithArtistOnly,
  AppreciationWithArtwork,
  AppreciationWithGallery,
} from "@/lib/types";
import { approveAppreciation, deleteAppreciation } from "../actions";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";

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
        <img
          src={imageUrl}
          alt=""
          className="h-20 w-20 shrink-0 rounded-md object-cover"
        />
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
            confirmMessage={showApprove ? "Reject and delete this message?" : "Remove this message from the site?"}
            className="text-red-600 hover:underline"
          >
            {showApprove ? "Reject" : "Remove"}
          </ConfirmSubmitButton>
        </form>
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

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Appreciations</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Visitor messages posted on paintings, galleries, or artists. Approve to make them visible.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold">🖼️ Painting appreciations</h2>

        <h3 className="mt-4 text-sm font-medium text-neutral-700">Pending ({artworkPending.length})</h3>
        <div className="mt-2 space-y-3">
          {artworkPending.map((a) => (
            <Row
              key={a.id}
              imageUrl={a.artwork.image_url}
              contextLine={`${a.artwork.title} — ${a.artwork.gallery.title} by ${a.artwork.gallery.artist.name}`}
              name={a.name}
              message={a.message}
              appreciationId={a.id}
              publicPath={`/galleries/${a.artwork.gallery_id}`}
              showApprove
            />
          ))}
          {artworkPending.length === 0 && (
            <p className="text-sm text-neutral-500">Nothing waiting for approval.</p>
          )}
        </div>

        <h3 className="mt-6 text-sm font-medium text-neutral-700">
          Approved ({artworkApproved.length})
        </h3>
        <div className="mt-2 space-y-3">
          {artworkApproved.map((a) => (
            <Row
              key={a.id}
              imageUrl={a.artwork.image_url}
              contextLine={`${a.artwork.title} — ${a.artwork.gallery.title} by ${a.artwork.gallery.artist.name}`}
              name={a.name}
              message={a.message}
              appreciationId={a.id}
              publicPath={`/galleries/${a.artwork.gallery_id}`}
              showApprove={false}
            />
          ))}
          {artworkApproved.length === 0 && (
            <p className="text-sm text-neutral-500">No approved messages yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">🏛️ Gallery appreciations</h2>

        <h3 className="mt-4 text-sm font-medium text-neutral-700">Pending ({galleryPending.length})</h3>
        <div className="mt-2 space-y-3">
          {galleryPending.map((a) => (
            <Row
              key={a.id}
              imageUrl={a.gallery.cover_image_url}
              contextLine={`${a.gallery.title} by ${a.gallery.artist.name}`}
              name={a.name}
              message={a.message}
              appreciationId={a.id}
              publicPath={`/galleries/${a.gallery.id}`}
              showApprove
            />
          ))}
          {galleryPending.length === 0 && (
            <p className="text-sm text-neutral-500">Nothing waiting for approval.</p>
          )}
        </div>

        <h3 className="mt-6 text-sm font-medium text-neutral-700">
          Approved ({galleryApproved.length})
        </h3>
        <div className="mt-2 space-y-3">
          {galleryApproved.map((a) => (
            <Row
              key={a.id}
              imageUrl={a.gallery.cover_image_url}
              contextLine={`${a.gallery.title} by ${a.gallery.artist.name}`}
              name={a.name}
              message={a.message}
              appreciationId={a.id}
              publicPath={`/galleries/${a.gallery.id}`}
              showApprove={false}
            />
          ))}
          {galleryApproved.length === 0 && (
            <p className="text-sm text-neutral-500">No approved messages yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">👤 Artist appreciations</h2>

        <h3 className="mt-4 text-sm font-medium text-neutral-700">Pending ({artistPending.length})</h3>
        <div className="mt-2 space-y-3">
          {artistPending.map((a) => (
            <Row
              key={a.id}
              imageUrl={a.artist.avatar_url}
              contextLine={a.artist.name}
              name={a.name}
              message={a.message}
              appreciationId={a.id}
              publicPath={`/artists/${a.artist.id}`}
              showApprove
            />
          ))}
          {artistPending.length === 0 && (
            <p className="text-sm text-neutral-500">Nothing waiting for approval.</p>
          )}
        </div>

        <h3 className="mt-6 text-sm font-medium text-neutral-700">
          Approved ({artistApproved.length})
        </h3>
        <div className="mt-2 space-y-3">
          {artistApproved.map((a) => (
            <Row
              key={a.id}
              imageUrl={a.artist.avatar_url}
              contextLine={a.artist.name}
              name={a.name}
              message={a.message}
              appreciationId={a.id}
              publicPath={`/artists/${a.artist.id}`}
              showApprove={false}
            />
          ))}
          {artistApproved.length === 0 && (
            <p className="text-sm text-neutral-500">No approved messages yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
