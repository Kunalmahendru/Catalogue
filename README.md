# nailsbyroops_ — Nail Art Catalogue

A React (Vite) website for nailsbyroops_. It works on phone, tablet, laptop and desktop.

**How it's put together (production = just two things):**

| Piece | What it does | Where |
|---|---|---|
| `frontend/` | The website. Reads designs straight from Supabase with the public, read-only key. | **Vercel** |
| Supabase | Database (collections, designs) and public photo storage. | **Supabase** |

`backend/` (FastAPI) is optional and **not used by the live site**. It stays in the repo as a ready-made API
(`/api/catalogue`) in case you want one later. The Supabase tables and `schema.sql` are shared with it.

## Run locally

```bash
cd frontend
npm install
cp .env.example .env.local   # then fill in the two Supabase values (see below)
npm run dev                  # http://localhost:5173
```

Without the Supabase values the site still works: it shows the copy bundled in `frontend/src/catalogue.json`.

## Change your details

Phone numbers, Instagram, the WhatsApp number and the homepage numbers (designs / orders / states) live in
`frontend/src/site.js`. WhatsApp links assume India (`91`). Edit the file and redeploy.

## Photo catalogue

`frontend/src/catalogue.json` defines collection names (their order in the file is the order on the page), descriptions, photo order and stable shareable IDs.
The original photos live in `frontend/photos-src/` (not shipped to the website). `scripts/make_images.py` turns each one
into two **WebP** images of identical size, with plain white/black borders trimmed and the crop centred on the nails:
`frontend/public/photos/thumbs/` (600x750, catalogue cards) and `photos/view/` (1000x1250, the viewer and the photo
link sent on WhatsApp). Each entry in the catalogue also stores an individual crop rectangle and exposure multiplier,
which the script applies. After adding or editing photos run `python3 scripts/make_images.py`
(needs `pip install pillow numpy`).
`scripts/photo-source-index.json` maps imported filenames and records excluded promotional collages
and repeated looks. Two supplied videos are not included in the photo galleries.

The hero uses your flat-lay photo as a faded pink background (`frontend/public/hero/bg-cards.webp`) with three real
product photos stacked on a static pastel canvas (`photo-*.webp`, all the same size). Swap those files to change them.

Contact lives in a floating pill (`ContactPill.jsx`): WhatsApp, Instagram and Call. It stays hidden at the top of
the page and eases in once you scroll. The call icon opens a popup with both numbers (tap to call/save, or copy).
Numbers, Instagram and the WhatsApp number come from `frontend/src/site.js`.

"Book this look" opens WhatsApp with a message naming the design plus the link to its photo
(`/photos/view/...`). WhatsApp links cannot attach a file, so the photo shows as a preview in the chat once the
site is live on a public URL (it won't preview from localhost).

Each collection scrolls horizontally with edge fades and arrow controls. Tapping a photo
opens a reel-style bottom sheet (75% of the screen, attached to the bottom, over a blurred page) that loops through every design:
swipe up for the next, down for the previous, left to close, right to open Instagram and follow.
On desktop the same works with mouse drag, scroll wheel, the ▲▼ buttons and the arrow keys; Esc or ✕ closes.

## Supabase (designs and photos)

One-time setup:

1. Supabase -> **SQL Editor** -> run `backend/supabase/schema.sql` (tables, read-only public access, photo bucket).
2. Put `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `backend/.env` (git-ignored; the secret key is only for the import
   script on your machine, never on Vercel, never committed).
3. `backend/.venv/bin/python scripts/import_to_supabase.py` uploads the photos and fills the tables.

Day to day, edit rows in **Table Editor** (`designs`: title, description, price, tags, `featured`, `sort_order`;
`collections`: order and descriptions). Changes show on the site the next time a page loads. To add a new design, run
`scripts/make_images.py`, then `scripts/import_to_supabase.py` (uploads the WebP files and updates the rows).

## Deploy (one Vercel project)

Import the GitHub repo in Vercel with **Root Directory `frontend`** (framework: Vite). Add two environment variables
(Settings -> Environment Variables), then deploy:

| Name | Value (from Supabase -> Project Settings -> API Keys) |
|---|---|
| `VITE_SUPABASE_URL` | your project URL, `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the **publishable** key (`sb_publishable_...`) |

Both are public by design: the key can only read, because row-level security allows nothing else. **Never** put
the secret key in Vercel or in any `VITE_` variable (those end up in the website's code). Changing a variable
needs a redeploy.
