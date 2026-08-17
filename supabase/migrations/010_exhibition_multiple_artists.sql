-- Run this in the Supabase SQL Editor for existing projects.
-- Lets an exhibition list more than one artist (e.g. a joint show),
-- replacing the old single optional artist_id column.

create table if not exists exhibition_artists (
  exhibition_id uuid not null references exhibitions(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete cascade,
  primary key (exhibition_id, artist_id)
);

create index if not exists exhibition_artists_artist_id_idx on exhibition_artists(artist_id);

-- Carry over each exhibition's existing single artist before the column
-- that held it is dropped.
insert into exhibition_artists (exhibition_id, artist_id)
select id, artist_id from exhibitions where artist_id is not null
on conflict do nothing;

alter table exhibitions drop column if exists artist_id;

alter table exhibition_artists enable row level security;

create policy "Public read access" on exhibition_artists for select using (true);
