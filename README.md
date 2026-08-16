# Chitrashala — Art by Monika Singh & Associates

A free-to-run gallery website: browse artists and their galleries, tap a
photo to view it full-screen with details, leave an "appreciation" message
on a painting/gallery/artist (moderated before going live), and enquire
directly over WhatsApp. A password-protected admin panel manages everything
— artists, galleries, photos, exhibitions, and appreciation moderation.

Stack: Next.js (Vercel, free tier) + Supabase (Postgres + Storage + Auth,
free tier). Images are converted to WebP and image optimization is disabled,
so nothing here draws on Vercel's paid image-optimization quota. AI photo
descriptions use Google Gemini's free tier.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account + new project.
2. In the project, open **SQL Editor -> New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates all
   tables (artists, galleries, artworks, exhibitions, appreciations),
   read-only public access, and the `artwork-images` storage bucket. If
   you're setting this up fresh, that's the only SQL file you need — the
   files under `supabase/migrations/` are only for upgrading a project that
   ran an older version of `schema.sql`.
3. Go to **Authentication -> Users -> Add user** and create the one admin
   login (email + password) you'll use to sign in at `/admin`.
4. Go to **Settings -> Data API** and copy the **Project URL** and **anon
   public key**.
5. Go to **Settings -> API keys** and copy the **service_role** key (secret —
   used only on the server for admin writes).

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from step 1.4
- `SUPABASE_SERVICE_ROLE_KEY` — from step 1.5
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — the site-wide number that receives
  enquiries, digits only with country code, e.g. `919876543210` for
  +91 98765 43210 (each gallery/artist can optionally override this from
  the admin panel)
- `NEXT_PUBLIC_SITE_URL` — the site's live URL, used for the sitemap,
  robots.txt, and social share previews (e.g. `https://your-site.vercel.app`)
- `GEMINI_API_KEY` (optional) — enables the "✨ Suggest with AI" description
  button in the admin panel. Get a free key at
  [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (no
  credit card required for the free tier). Leave blank to skip this feature.

## 3. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` for the public site and
`http://localhost:3000/admin` to sign in and manage content.

## 4. Import the existing photos in images/

If you have photos already sitting in the `images/` folder (loose files
become "Gallery 1"; each subfolder becomes its own gallery named after the
folder), run this once after step 1-2 are done:

```bash
npm run seed
```

Photos are converted to WebP, uploaded to Supabase Storage, and attributed to
an artist called "Monika Singh" (created automatically). Titles come in as
"Untitled 1", "Untitled 2", etc. — edit them, and add descriptions or
dimensions, from the admin panel afterward. Re-running the script skips any
gallery whose title already exists, so it's safe to run again after adding a
new subfolder.

Optionally, auto-generate a short AI description for every photo that's
still missing one:

```bash
npm run ai:describe
```

Free-tier quota limits mean this may need to be re-run later to catch
whichever photos failed — it only targets photos still missing a
description, so it's safe to run repeatedly.

## 5. Deploy

1. Push this project to a GitHub repo.
2. On [vercel.com](https://vercel.com), **Add New -> Project** and import
   that repo.
3. Before deploying, expand **Environment Variables** and paste in the
   contents of your `.env.local` — Vercel parses a pasted `.env` block
   automatically.
4. Under **Project Settings**, make sure **Framework Preset** is detected as
   **Next.js** (if it shows as "Other", set it manually — otherwise the build
   silently produces no usable output) and that **Deployment Protection** is
   disabled for Production (otherwise visitors get a Vercel login wall
   instead of the site).
5. Deploy. Every future `git push` to the main branch redeploys automatically.

## What's in the admin panel (`/admin`)

- **Artists** — profiles (bio, profile photo, email, WhatsApp, address) shown
  on the public About Us / Reach Us pages
- **Galleries** — create galleries under an artist, then open one to add
  photos (single upload with AI description, or bulk upload), reorder photos
  with the ↑/↓ buttons, and pick any photo as the gallery's cover, the
  artist's home-page cover, or the artist's profile photo
- **Exhibitions** — upcoming/current shows, optionally tied to one artist;
  add more than one for artists showing at different locations at once
- **Appreciations** — visitor messages posted on a painting, a gallery, or an
  artist stay pending until approved here, in three separate tabs

## Notes

- Admin access is a single shared login — anyone with the email/password can
  manage everything above.
- Deleting a gallery or artist also deletes its photos (from both the
  database and Supabase Storage) — the confirm dialogs say so.
- The public pages render dynamically (not statically), so new content always
  shows up without a rebuild.
- Visitor-submitted appreciations go through the public Supabase anon key
  (not the service-role key) and a Row Level Security policy that only
  allows inserting unapproved rows — a visitor can never make their own
  message go live. There's also a honeypot field to quietly drop bot spam.
- Vercel Web Analytics (`@vercel/analytics`) is wired in and free on the
  Hobby plan — view traffic under the project's **Analytics** tab on Vercel.
