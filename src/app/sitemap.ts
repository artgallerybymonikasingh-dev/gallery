import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: artists }, { data: galleries }] = await Promise.all([
    supabase.from("artists").select("id"),
    supabase.from("galleries").select("id"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/exhibitions`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const artistRoutes: MetadataRoute.Sitemap = (artists ?? []).map((a) => ({
    url: `${SITE_URL}/artists/${a.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const galleryRoutes: MetadataRoute.Sitemap = (galleries ?? []).map((g) => ({
    url: `${SITE_URL}/galleries/${g.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...artistRoutes, ...galleryRoutes];
}
