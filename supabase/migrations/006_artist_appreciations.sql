-- Run this in the Supabase SQL Editor for existing projects.
-- Allows an appreciation to target an artist as a whole, alongside the
-- existing painting- and gallery-level targets. Exactly one of
-- artwork_id / gallery_id / artist_id will be set per row.

alter table appreciations add column if not exists artist_id uuid references artists(id) on delete cascade;

alter table appreciations drop constraint if exists appreciations_target_check;
alter table appreciations add constraint appreciations_target_check
  check (
    (case when artwork_id is not null then 1 else 0 end) +
    (case when gallery_id is not null then 1 else 0 end) +
    (case when artist_id is not null then 1 else 0 end) = 1
  );

create index if not exists appreciations_artist_id_idx on appreciations(artist_id);
