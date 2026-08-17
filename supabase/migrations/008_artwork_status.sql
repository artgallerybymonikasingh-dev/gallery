-- Run this in the Supabase SQL Editor for existing projects.
-- Lets the admin mark a painting as available / reserved / sold.

alter table artworks add column if not exists status text not null default 'available';

alter table artworks drop constraint if exists artworks_status_check;
alter table artworks add constraint artworks_status_check
  check (status in ('available', 'reserved', 'sold'));
