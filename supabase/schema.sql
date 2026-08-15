-- Run this once in the Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists galleries (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id) on delete cascade,
  title text not null,
  description text,
  cover_image_url text,
  whatsapp_number text,
  created_at timestamptz not null default now()
);

create table if not exists artworks (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  title text not null default 'Untitled',
  description text,
  width_cm numeric,
  height_cm numeric,
  image_url text not null,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists galleries_artist_id_idx on galleries(artist_id);
create index if not exists artworks_gallery_id_idx on artworks(gallery_id);

-- Row Level Security: public visitors can only ever read. All writes go
-- through Server Actions using the service-role key (see
-- src/lib/supabase/admin.ts), which bypasses RLS after the app itself has
-- verified an authenticated admin session — so no INSERT/UPDATE/DELETE
-- policies are defined here on purpose.
alter table artists enable row level security;
alter table galleries enable row level security;
alter table artworks enable row level security;

create policy "Public read access" on artists for select using (true);
create policy "Public read access" on galleries for select using (true);
create policy "Public read access" on artworks for select using (true);

-- Storage bucket for artwork photos (public read, service-role write only).
insert into storage.buckets (id, name, public)
values ('artwork-images', 'artwork-images', true)
on conflict (id) do nothing;

create policy "Public read access to artwork images"
  on storage.objects for select
  using (bucket_id = 'artwork-images');
