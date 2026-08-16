import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppreciationWithArtwork, AppreciationWithGallery } from "@/lib/types";
import { approveAppreciation, deleteAppreciation } from "../actions";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";

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

  const artworkPending = (artworkAppreciations ?? []).filter((a) => !a.approved);
  const artworkApproved = (artworkAppreciations ?? []).filter((a) => a.approved);
  const galleryPending = (galleryAppreciations ?? []).filter((a) => !a.approved);
  const galleryApproved = (galleryAppreciations ?? []).filter((a) => a.approved);

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Appreciations</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Visitor messages posted on paintings or whole galleries. Approve to make them visible.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold">🖼️ Painting appreciations</h2>

        <h3 className="mt-4 text-sm font-medium text-neutral-700">Pending ({artworkPending.length})</h3>
        <div className="mt-2 space-y-3">
          {artworkPending.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.artwork.image_url}
                alt={a.artwork.title}
                className="h-20 w-20 shrink-0 rounded-md object-cover"
              />
              <div className="flex-1 text-sm">
                <p className="text-xs text-neutral-500">
                  {a.artwork.title} — {a.artwork.gallery.title} by {a.artwork.gallery.artist.name}
                </p>
                <p className="mt-1">
                  <span className="font-medium">{a.name || "Anonymous"}</span>: {a.message}
                </p>
              </div>
              <div className="flex shrink-0 gap-3 text-sm">
                <form action={approveAppreciation.bind(null, a.id, a.artwork.gallery_id)}>
                  <button type="submit" className="text-green-700 hover:underline">
                    Approve
                  </button>
                </form>
                <form action={deleteAppreciation.bind(null, a.id, a.artwork.gallery_id)}>
                  <ConfirmSubmitButton
                    confirmMessage="Reject and delete this message?"
                    className="text-red-600 hover:underline"
                  >
                    Reject
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
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
            <div
              key={a.id}
              className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.artwork.image_url}
                alt={a.artwork.title}
                className="h-16 w-16 shrink-0 rounded-md object-cover"
              />
              <div className="flex-1 text-sm">
                <p className="text-xs text-neutral-500">
                  {a.artwork.title} — {a.artwork.gallery.title} by {a.artwork.gallery.artist.name}
                </p>
                <p className="mt-1">
                  <span className="font-medium">{a.name || "Anonymous"}</span>: {a.message}
                </p>
              </div>
              <form
                action={deleteAppreciation.bind(null, a.id, a.artwork.gallery_id)}
                className="shrink-0"
              >
                <ConfirmSubmitButton
                  confirmMessage="Remove this message from the site?"
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </ConfirmSubmitButton>
              </form>
            </div>
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
            <div
              key={a.id}
              className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center"
            >
              {a.gallery.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.gallery.cover_image_url}
                  alt={a.gallery.title}
                  className="h-20 w-20 shrink-0 rounded-md object-cover"
                />
              )}
              <div className="flex-1 text-sm">
                <p className="text-xs text-neutral-500">
                  {a.gallery.title} by {a.gallery.artist.name}
                </p>
                <p className="mt-1">
                  <span className="font-medium">{a.name || "Anonymous"}</span>: {a.message}
                </p>
              </div>
              <div className="flex shrink-0 gap-3 text-sm">
                <form action={approveAppreciation.bind(null, a.id, a.gallery.id)}>
                  <button type="submit" className="text-green-700 hover:underline">
                    Approve
                  </button>
                </form>
                <form action={deleteAppreciation.bind(null, a.id, a.gallery.id)}>
                  <ConfirmSubmitButton
                    confirmMessage="Reject and delete this message?"
                    className="text-red-600 hover:underline"
                  >
                    Reject
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
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
            <div
              key={a.id}
              className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center"
            >
              {a.gallery.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.gallery.cover_image_url}
                  alt={a.gallery.title}
                  className="h-16 w-16 shrink-0 rounded-md object-cover"
                />
              )}
              <div className="flex-1 text-sm">
                <p className="text-xs text-neutral-500">
                  {a.gallery.title} by {a.gallery.artist.name}
                </p>
                <p className="mt-1">
                  <span className="font-medium">{a.name || "Anonymous"}</span>: {a.message}
                </p>
              </div>
              <form action={deleteAppreciation.bind(null, a.id, a.gallery.id)} className="shrink-0">
                <ConfirmSubmitButton
                  confirmMessage="Remove this message from the site?"
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </ConfirmSubmitButton>
              </form>
            </div>
          ))}
          {galleryApproved.length === 0 && (
            <p className="text-sm text-neutral-500">No approved messages yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
