import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ArtistAccordion from "@/components/ArtistAccordion";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Artist } from "@/lib/types";

export const metadata: Metadata = {
  title: "About Us",
  description: "Meet the artists behind Chitrashala.",
};

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .order("name")
    .returns<Artist[]>();

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
    </div>
  );
}
