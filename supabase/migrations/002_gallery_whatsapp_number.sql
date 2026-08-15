-- Run this in the Supabase SQL Editor if you already ran the original
-- supabase/schema.sql before this column existed.
alter table galleries add column if not exists whatsapp_number text;
