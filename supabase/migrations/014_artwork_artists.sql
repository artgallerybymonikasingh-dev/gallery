-- Run this in the Supabase SQL Editor for existing projects.
-- Each artwork gets its own artist attribution (one or more), instead of
-- silently inheriting whichever artist(s) happen to be listed on its
-- gallery or exhibition. Existing artworks are backfilled to their
-- gallery's artist so nothing changes visually until an admin picks a
-- different artist for a specific piece.

create table if not exists artwork_artists (
  artwork_id uuid not null references artworks(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete cascade,
  primary key (artwork_id, artist_id)
);

create index if not exists artwork_artists_artist_id_idx on artwork_artists(artist_id);

alter table artwork_artists enable row level security;

create policy "Public read access" on artwork_artists for select using (true);

insert into artwork_artists (artwork_id, artist_id)
select a.id, g.artist_id
from artworks a
join galleries g on g.id = a.gallery_id
on conflict do nothing;
