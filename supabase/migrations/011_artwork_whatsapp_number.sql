-- Run this in the Supabase SQL Editor for existing projects.
-- Lets a single photo override the WhatsApp number used for its "Enquire"
-- link. Resolution order at render time is: photo -> gallery -> site-wide
-- default (see whatsappEnquiryLink in src/lib/whatsapp.ts).

alter table artworks add column if not exists whatsapp_number text;
