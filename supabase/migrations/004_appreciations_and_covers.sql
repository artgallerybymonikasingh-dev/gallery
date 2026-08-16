-- Run this in the Supabase SQL Editor for existing projects.

alter table artists add column if not exists cover_image_url text;

create table if not exists appreciations (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references artworks(id) on delete cascade,
  name text,
  message text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists appreciations_artwork_id_idx on appreciations(artwork_id);

alter table appreciations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'appreciations' and policyname = 'Public read approved appreciations'
  ) then
    create policy "Public read approved appreciations" on appreciations
      for select using (approved = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'appreciations' and policyname = 'Public can submit appreciations'
  ) then
    create policy "Public can submit appreciations" on appreciations
      for insert with check (approved = false);
  end if;
end $$;
