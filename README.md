# Monika Singh — Art Gallery

A free-to-run gallery website: browse galleries of artwork by Monika Singh and
associated artists, tap a photo to view it full-screen with details, and
enquire directly over WhatsApp. A password-protected admin panel is used to
add artists, galleries, and photos (with optional description, dimensions,
and an AI-suggested description).

Stack: Next.js (Vercel, free tier) + Supabase (Postgres + Storage + Auth,
free tier). Images are converted to WebP and image optimization is disabled,
so nothing here draws on Vercel's paid image-optimization quota.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account + new project.
2. In the project, open **SQL Editor -> New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the
   `artists`, `galleries`, `artworks` tables, read-only public access, and the
   `artwork-images` storage bucket.
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
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — the number that receives enquiries, digits
  only with country code, e.g. `919876543210` for +91 98765 43210
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

## 5. Deploy (new GitHub + Vercel accounts)

1. Create a new GitHub account/repo and push this project to it.
2. Create a new Vercel account, **Add New -> Project**, and import that repo.
3. In the Vercel project's **Settings -> Environment Variables**, add the
   same variables from your `.env.local`.
4. Deploy. Every future `git push` redeploys automatically.

## Notes

- Admin access is a single shared login — anyone with the email/password can
  manage all artists, galleries, and photos.
- Deleting a gallery or artist also deletes its photos (from both the
  database and Supabase Storage) — the confirm dialogs say so.
- The public site and gallery/photo pages render dynamically (not
  statically), so newly added photos always show up without a rebuild.
