import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: artists }, { data: galleries }, { data: exhibitions }, { data: artworks }] = await Promise.all([
    supabase.from("artists").select("slug"),
    supabase.from("galleries").select("slug"),
    supabase.from("exhibitions").select("slug"),
    supabase
      .from("artworks")
      .select("slug, gallery:galleries(slug)")
      .returns<{ slug: string | null; gallery: { slug: string | null } | null }[]>(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/exhibitions`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const artistRoutes: MetadataRoute.Sitemap = (artists ?? []).map((a) => ({
    url: `${SITE_URL}/artists/${a.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const galleryRoutes: MetadataRoute.Sitemap = (galleries ?? []).map((g) => ({
    url: `${SITE_URL}/galleries/${g.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const exhibitionRoutes: MetadataRoute.Sitemap = (exhibitions ?? [])
    .filter((e) => e.slug)
    .map((e) => ({
      url: `${SITE_URL}/exhibitions/${e.slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const artworkRoutes: MetadataRoute.Sitemap = (artworks ?? [])
    .filter((a): a is { slug: string; gallery: { slug: string } } => Boolean(a.slug) && Boolean(a.gallery?.slug))
    .map((a) => ({
      url: `${SITE_URL}/galleries/${a.gallery.slug}/${a.slug}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  return [...staticRoutes, ...artistRoutes, ...galleryRoutes, ...exhibitionRoutes, ...artworkRoutes];
}
