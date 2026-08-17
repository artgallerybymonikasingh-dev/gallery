-- Run this in the Supabase SQL Editor for existing projects.
-- Adds slug columns for pretty public URLs. Existing rows are left with a
-- null slug here — run `npm run backfill-slugs` locally right after this
-- to populate them (and the app generates one automatically for every new
-- artist/gallery going forward).

alter table artists add column if not exists slug text unique;
alter table galleries add column if not exists slug text unique;
