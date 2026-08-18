-- Run this in the Supabase SQL Editor for existing projects.
-- Adds: a slug per artwork (for its own permalink page), an optional
-- price field, and optional Instagram/website links per artist.
-- Existing artworks are left with a null slug here — run
-- `npm run backfill-slugs` locally right after this to populate them.

alter table artworks add column if not exists slug text unique;
alter table artworks add column if not exists price text;
alter table artists add column if not exists instagram_url text;
alter table artists add column if not exists website_url text;
