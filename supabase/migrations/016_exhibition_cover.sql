-- Run this in the Supabase SQL Editor for existing projects.
-- Lets an admin pick a specific photo as an exhibition's cover image,
-- instead of it always being whichever tagged/linked photo happens to be
-- first.

alter table exhibitions add column if not exists cover_image_url text;
