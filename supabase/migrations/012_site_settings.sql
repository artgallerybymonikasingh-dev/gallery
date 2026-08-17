-- Run this in the Supabase SQL Editor for existing projects.
-- A single-row settings table so the site-wide WhatsApp number can be
-- changed from the admin panel instead of requiring a redeploy (env vars
-- are baked in at build time, so they can't be edited live).

create table if not exists site_settings (
  id text primary key default 'default',
  whatsapp_number text,
  updated_at timestamptz not null default now(),
  constraint site_settings_single_row check (id = 'default')
);

insert into site_settings (id) values ('default')
on conflict (id) do nothing;

alter table site_settings enable row level security;

create policy "Public read access" on site_settings for select using (true);
