-- Run this in the Supabase SQL Editor for existing projects.
-- Lets an entire gallery be associated with zero, one, or more
-- exhibitions as a standing link — every photo in a linked gallery
-- (including ones added later) counts as part of the exhibition, on top
-- of any individually-tagged photos in artwork_exhibitions.

create table if not exists gallery_exhibitions (
  gallery_id uuid not null references galleries(id) on delete cascade,
  exhibition_id uuid not null references exhibitions(id) on delete cascade,
  primary key (gallery_id, exhibition_id)
);

create index if not exists gallery_exhibitions_exhibition_id_idx on gallery_exhibitions(exhibition_id);

alter table gallery_exhibitions enable row level security;

create policy "Public read access" on gallery_exhibitions for select using (true);
