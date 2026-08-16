-- Run this in the Supabase SQL Editor for existing projects.
-- Allows an appreciation to target a gallery as a whole, not just a single
-- painting. Exactly one of artwork_id / gallery_id will be set per row.

alter table appreciations alter column artwork_id drop not null;
alter table appreciations add column if not exists gallery_id uuid references galleries(id) on delete cascade;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appreciations_target_check'
  ) then
    alter table appreciations add constraint appreciations_target_check
      check ((artwork_id is not null) <> (gallery_id is not null));
  end if;
end $$;

create index if not exists appreciations_gallery_id_idx on appreciations(gallery_id);
