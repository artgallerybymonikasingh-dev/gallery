-- Run this in the Supabase SQL Editor for existing projects (schema.sql
-- already ran before these fields existed).

alter table artists add column if not exists email text;
alter table artists add column if not exists whatsapp_number text;
alter table artists add column if not exists address text;

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

create index if not exists exhibitions_artist_id_idx on exhibitions(artist_id);

alter table exhibitions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'exhibitions' and policyname = 'Public read access'
  ) then
    create policy "Public read access" on exhibitions for select using (true);
  end if;
end $$;
