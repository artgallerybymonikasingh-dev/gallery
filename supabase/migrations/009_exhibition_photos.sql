-- Run this in the Supabase SQL Editor for existing projects.
-- Lets photos be tagged to one or more exhibitions (many-to-many), and
-- gives exhibitions a slug for pretty public URLs (/exhibitions/[slug]).
-- Existing exhibitions are left with a null slug here — run
-- `npm run backfill-slugs` locally right after this to populate them.

alter table exhibitions add column if not exists slug text unique;

create table if not exists artwork_exhibitions (
  artwork_id uuid not null references artworks(id) on delete cascade,
  exhibition_id uuid not null references exhibitions(id) on delete cascade,
  primary key (artwork_id, exhibition_id)
);

create index if not exists artwork_exhibitions_exhibition_id_idx on artwork_exhibitions(exhibition_id);
create index if not exists artwork_exhibitions_artwork_id_idx on artwork_exhibitions(artwork_id);

alter table artwork_exhibitions enable row level security;

create policy "Public read access" on artwork_exhibitions for select using (true);
