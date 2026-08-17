import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ArtistAccordion from "@/components/ArtistAccordion";
import Breadcrumbs from "@/components/Breadcrumbs";
import Testimonials, { type Testimonial } from "@/components/Testimonials";
import type { Artist } from "@/lib/types";

export const metadata: Metadata = {
  title: "About Us",
  description: "Meet the artists behind Chitrashala.",
};

type RawTestimonial = {
  id: string;
  name: string | null;
  message: string;
  artwork: { title: string; gallery: { title: string; artist: { name: string } | null } | null } | null;
  gallery: { title: string; artist: { name: string } | null } | null;
  artist: { name: string } | null;
};

function contextLineFor(t: RawTestimonial): string {
  if (t.artwork) {
    const artistName = t.artwork.gallery?.artist?.name;
    return artistName ? `on "${t.artwork.title}" by ${artistName}` : `on "${t.artwork.title}"`;
  }
  if (t.gallery) {
    const artistName = t.gallery.artist?.name;
    return artistName ? `on the "${t.gallery.title}" gallery by ${artistName}` : `on "${t.gallery.title}"`;
  }
  if (t.artist) {
    return `on ${t.artist.name}'s work`;
  }
  return "";
}

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .order("name")
    .returns<Artist[]>();

  const { data: rawTestimonials } = await supabase
    .from("appreciations")
    .select(
      "id, name, message, artwork:artworks(title, gallery:galleries(title, artist:artists(name))), gallery:galleries(title, artist:artists(name)), artist:artists(name)"
    )
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(6)
    .returns<RawTestimonial[]>();

  const testimonials: Testimonial[] = (rawTestimonials ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    message: t.message,
    contextLine: contextLineFor(t),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Breadcrumbs items={[{ label: "About Us" }]} />
      <div className="mb-6 sm:mb-8">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-royal-maroon sm:text-3xl">
          About Us
        </h1>
        <p className="mt-1 text-sm text-neutral-500 sm:text-base">
          Meet the artists behind Chitrashala.
        </p>
      </div>

      <ArtistAccordion artists={artists ?? []} />

      <Testimonials testimonials={testimonials} />
    </div>
  );
}
