import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { whatsappGeneralLink } from "@/lib/whatsapp";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Artist } from "@/lib/types";

export const metadata: Metadata = {
  title: "Reach Us",
  description: "Get in touch with Chitrashala's artists directly.",
};

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .order("name")
    .returns<Artist[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Breadcrumbs items={[{ label: "Reach Us" }]} />
      <div className="mb-6 sm:mb-8">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-royal-maroon sm:text-3xl">
          Reach Us
        </h1>
        <p className="mt-1 text-sm text-neutral-500 sm:text-base">
          Get in touch with our artists directly.
        </p>
      </div>

      {!artists || artists.length === 0 ? (
        <p className="text-neutral-500">No contact details have been added yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {artists.map((artist) => (
            <div
              key={artist.id}
              className="rounded-lg border border-royal-gold/25 bg-white p-4 shadow-sm sm:p-5"
            >
              <h2 className="font-serif text-lg font-medium text-royal-maroon">{artist.name}</h2>
              <div className="mt-3 space-y-2 text-sm">
                {artist.email && (
                  <p>
                    <a href={`mailto:${artist.email}`} className="text-royal-teal hover:underline">
                      {artist.email}
                    </a>
                  </p>
                )}
                {artist.whatsapp_number && (
                  <p>
                    <a
                      href={whatsappGeneralLink(artist.whatsapp_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#128C7E] hover:underline"
                    >
                      <svg viewBox="0 0 32 32" className="h-4 w-4 fill-current" aria-hidden="true">
                        <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.42.71 4.673 1.933 6.566L4 29l7.617-1.897A11.94 11.94 0 0 0 16.001 27C22.63 27 28 21.627 28 15S22.63 3 16.001 3Zm6.997 16.982c-.297.836-1.47 1.53-2.404 1.727-.64.135-1.475.243-4.287-.921-3.598-1.487-5.913-5.14-6.094-5.38-.176-.24-1.464-1.948-1.464-3.716 0-1.767.925-2.635 1.253-2.997.298-.328.65-.41.867-.41.216 0 .434.002.623.011.2.01.469-.076.734.56.297.712.945 2.284 1.028 2.45.083.166.14.36.028.577-.111.216-.166.35-.325.539-.166.187-.343.417-.49.56-.166.166-.34.346-.146.68.194.335.862 1.42 1.851 2.301 1.271 1.135 2.342 1.487 2.677 1.653.335.166.529.14.723-.083.2-.222.834-.972 1.056-1.306.222-.335.446-.279.75-.166.305.111 1.93.909 2.263 1.075.334.166.556.25.639.39.083.14.083.804-.213 1.641Z" />
                      </svg>
                      WhatsApp
                    </a>
                  </p>
                )}
                {artist.address && <p className="text-neutral-600">{artist.address}</p>}
                {!artist.email && !artist.whatsapp_number && !artist.address && (
                  <p className="text-neutral-400">No contact details added yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
