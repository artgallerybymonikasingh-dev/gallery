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
  instagram_url text,
  website_url text,
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
  -- Powers each photo's own permalink page (/galleries/[slug]/[artworkSlug]).
  slug text unique,
  title text not null default 'Untitled',
  description text,
  width_cm numeric,
  height_cm numeric,
  -- Free text so "Price on request" works alongside actual numbers/currency.
  price text,
  image_url text not null,
  storage_path text not null,
  sort_order integer not null default 0,
  status text not null default 'available'
    check (status in ('available', 'reserved', 'sold')),
  -- Resolution order for the "Enquire" link: photo -> gallery -> site-wide
  -- default (see whatsappEnquiryLink in src/lib/whatsapp.ts).
  whatsapp_number text,
  created_at timestamptz not null default now()
);

-- Many-to-many: a photo's own artist credit(s), independent of its
-- gallery's or exhibition's artist list — a gallery/exhibition having
-- several contributing artists never implies every photo in it is by all
-- of them. Defaults to the gallery's artist when a photo is created, but
-- is editable per photo from there.
create table if not exists artwork_artists (
  artwork_id uuid not null references artworks(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete cascade,
  primary key (artwork_id, artist_id)
);

create table if not exists exhibitions (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  location text,
  description text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

-- Many-to-many: an exhibition can feature more than one artist (a joint
-- show), or none at all (a general/group show with no specific credit).
create table if not exists exhibition_artists (
  exhibition_id uuid not null references exhibitions(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete cascade,
  primary key (exhibition_id, artist_id)
);

-- Many-to-many: a photo can be shown at more than one exhibition over time.
create table if not exists artwork_exhibitions (
  artwork_id uuid not null references artworks(id) on delete cascade,
  exhibition_id uuid not null references exhibitions(id) on delete cascade,
  primary key (artwork_id, exhibition_id)
);

-- Many-to-many: an entire gallery can be linked to zero, one, or more
-- exhibitions as a standing association — every photo in a linked gallery
-- (including ones added later) counts as part of the exhibition, on top
-- of any individually-tagged photos in artwork_exhibitions above.
create table if not exists gallery_exhibitions (
  gallery_id uuid not null references galleries(id) on delete cascade,
  exhibition_id uuid not null references exhibitions(id) on delete cascade,
  primary key (gallery_id, exhibition_id)
);

-- Single-row settings table so the site-wide WhatsApp number can be
-- changed from the admin panel instead of requiring a redeploy.
create table if not exists site_settings (
  id text primary key default 'default',
  whatsapp_number text,
  updated_at timestamptz not null default now(),
  constraint site_settings_single_row check (id = 'default')
);

insert into site_settings (id) values ('default')
on conflict (id) do nothing;

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
create index if not exists appreciations_artwork_id_idx on appreciations(artwork_id);
create index if not exists appreciations_gallery_id_idx on appreciations(gallery_id);
create index if not exists appreciations_artist_id_idx on appreciations(artist_id);
create index if not exists artwork_exhibitions_exhibition_id_idx on artwork_exhibitions(exhibition_id);
create index if not exists artwork_exhibitions_artwork_id_idx on artwork_exhibitions(artwork_id);
create index if not exists exhibition_artists_artist_id_idx on exhibition_artists(artist_id);
create index if not exists gallery_exhibitions_exhibition_id_idx on gallery_exhibitions(exhibition_id);
create index if not exists artwork_artists_artist_id_idx on artwork_artists(artist_id);

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
alter table artwork_exhibitions enable row level security;
alter table exhibition_artists enable row level security;
alter table gallery_exhibitions enable row level security;
alter table artwork_artists enable row level security;
alter table site_settings enable row level security;

create policy "Public read access" on artists for select using (true);
create policy "Public read access" on galleries for select using (true);
create policy "Public read access" on artworks for select using (true);
create policy "Public read access" on exhibitions for select using (true);
create policy "Public read access" on artwork_exhibitions for select using (true);
create policy "Public read access" on exhibition_artists for select using (true);
create policy "Public read access" on gallery_exhibitions for select using (true);
create policy "Public read access" on artwork_artists for select using (true);
create policy "Public read access" on site_settings for select using (true);

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
