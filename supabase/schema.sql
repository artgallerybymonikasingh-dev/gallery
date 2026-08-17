-- Run this once in the Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

-- `slug` powers pretty public URLs (/artists/monika-singh instead of a raw
-- UUID). It's generated once at creation time and left stable afterwards
-- even if the name/title later changes, so shared links never break.
create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  bio text,
  avatar_url text,
  email text,
  whatsapp_number text,
  address text,
  cover_image_url text,
  created_at timestamptz not null default now()
);

create table if not exists galleries (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
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

create table if not exists exhibitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_id uuid references artists(id) on delete set null,
  location text,
  description text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

-- Exactly one of artwork_id / gallery_id / artist_id is set: an
-- appreciation targets a specific painting, a gallery as a whole, or an
-- artist as a whole.
create table if not exists appreciations (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid references artworks(id) on delete cascade,
  gallery_id uuid references galleries(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,
  name text,
  message text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  constraint appreciations_target_check
    check (
      (case when artwork_id is not null then 1 else 0 end) +
      (case when gallery_id is not null then 1 else 0 end) +
      (case when artist_id is not null then 1 else 0 end) = 1
    )
);

create index if not exists galleries_artist_id_idx on galleries(artist_id);
create index if not exists artworks_gallery_id_idx on artworks(gallery_id);
create index if not exists exhibitions_artist_id_idx on exhibitions(artist_id);
create index if not exists appreciations_artwork_id_idx on appreciations(artwork_id);
create index if not exists appreciations_gallery_id_idx on appreciations(gallery_id);
create index if not exists appreciations_artist_id_idx on appreciations(artist_id);

-- Row Level Security: public visitors can only ever read. All writes go
-- through Server Actions using the service-role key (see
-- src/lib/supabase/admin.ts), which bypasses RLS after the app itself has
-- verified an authenticated admin session — so no INSERT/UPDATE/DELETE
-- policies are defined here on purpose.
alter table artists enable row level security;
alter table galleries enable row level security;
alter table artworks enable row level security;
alter table exhibitions enable row level security;
alter table appreciations enable row level security;

create policy "Public read access" on artists for select using (true);
create policy "Public read access" on galleries for select using (true);
create policy "Public read access" on artworks for select using (true);
create policy "Public read access" on exhibitions for select using (true);

-- Appreciations are the one table the public can write to directly (with
-- the anon key, respecting RLS — everything else writes through the
-- service-role key from admin Server Actions). Visitors can only ever see
-- approved messages and can only insert new ones already marked
-- unapproved; only the admin (service role, bypassing RLS) can approve or
-- delete them.
create policy "Public read approved appreciations" on appreciations
  for select using (approved = true);
create policy "Public can submit appreciations" on appreciations
  for insert with check (approved = false);

-- Storage bucket for artwork photos (public read, service-role write only).
insert into storage.buckets (id, name, public)
values ('artwork-images', 'artwork-images', true)
on conflict (id) do nothing;

create policy "Public read access to artwork images"
  on storage.objects for select
  using (bucket_id = 'artwork-images');
