<div align="center">

# nailsbyroops_

### Tiny canvases. Big mood.

A fast, pastel-pretty catalogue for **nailsbyroops_**: premium handmade press-on nails.
Browse every look, flick through them reel-style, and book on WhatsApp in one tap.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-database%20%26%20storage-3ecf8e?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel&logoColor=white)

<img src="docs/screenshots/hero-desktop.jpg" alt="nailsbyroops_ landing page on desktop" width="100%" />

</div>

---

## About

**nailsbyroops_** makes premium handmade press-on nails: salon-style nail art you can put on at home, reuse, and wear to
match your mood. From a quiet French tip to a full 3D-charm moment, there is a set for every look. Custom designs and
wholesale / bulk orders are always welcome, and **175+ customers** and **550+ orders** across **15+ states**.

This repository is the website: a mobile-first catalogue where customers browse collections, tap a look, and book
it straight on WhatsApp (the message already names the design and links to its photo). There is also an **About** section
on the page itself (`frontend/src/components/About.jsx`).

Find the brand on Instagram: [@nailsbyroops_](https://instagram.com/nailsbyroops_)

## Highlights

- **Collage hero**: three tilted photos with white-and-beige dry-brush strokes over their borders, on a soft pastel wash.
- **Collections you can scroll**: every style (chrome, French, 3D charms, festive...) is a horizontal rail with edge fades and arrow controls.
- **Reel-style viewer**: tap any photo to open a centered card that loops through *all* designs.
  Swipe up for next, down for previous. On desktop use a trackpad two-finger scroll, the mouse wheel or drag, the ▲▼
  buttons or the arrow keys (Esc or ✕ closes). The card follows your fingers, quick flicks commit instantly and neighbouring photos are preloaded.
- **Book this look**: opens WhatsApp with a short message naming the design.
- **What's in the box**: your real kit photo with dashed outlines and numbered markers, a legend explaining each item (glue tabs, alcohol pad, nail file, cuticle stick, buffer, nail glue) and a FREE sticker. Hover or tap a legend row to light up its outline. Edit names, text and outline positions in `frontend/src/components/BoxContents.jsx`; the photo is `frontend/public/box/kit.webp`.
- **Floating contact pill**: frosted glass with WhatsApp, Instagram and Call. It appears once you scroll; Call opens both numbers (tap to call, or copy).
- **Shareable links**: every design has its own URL (`/#/d/<id>`).
- **Always online**: designs and photos come from Supabase, with a bundled copy as a fallback so the page never goes blank.

## Screenshots

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/hero-mobile.jpg" width="250" alt="Landing page on mobile" /><br /><sub>Landing</sub></td>
    <td align="center"><img src="docs/screenshots/catalogue-mobile.jpg" width="250" alt="Catalogue and contact pill on mobile" /><br /><sub>Catalogue + contact pill</sub></td>
    <td align="center"><img src="docs/screenshots/viewer-mobile.jpg" width="250" alt="Reel viewer on mobile" /><br /><sub>Reel viewer</sub></td>
  </tr>
</table>

<img src="docs/screenshots/catalogue-desktop.jpg" alt="Catalogue collections on desktop" width="100%" />

<img src="docs/screenshots/viewer-desktop.jpg" alt="Reel viewer on desktop" width="100%" />

<img src="docs/screenshots/about-desktop.jpg" alt="About section on desktop" width="100%" />

## How it's put together

Production is just two things:

| Piece | What it does | Where |
|---|---|---|
| `frontend/` | The website (React + Vite). Reads designs straight from Supabase with the public, read-only key. | **Vercel** |
| Supabase | Database (collections, designs) and public photo storage. | **Supabase** |

`backend/` (FastAPI) is optional and **not used by the live site**. It stays in the repo as a ready-made API
(`/api/catalogue`) in case you want one later. The Supabase tables and `schema.sql` are shared with it.

```
.
├── frontend/            React + Vite site
│   ├── src/
│   │   ├── App.jsx            page layout, routing by #hash
│   │   ├── site.js            contact details and homepage numbers
│   │   ├── catalogue.json     bundled fallback catalogue
│   │   ├── supabase.js        fetches collections + designs
│   │   ├── admin/             /admin page: login, draft editor, review & publish
│   │   └── components/        About, ContactPill, DesignModal (reel), StyleGallery, ...
│   ├── public/hero/           landing photos
│   ├── public/photos/         thumbs/ (cards) and view/ (viewer) WebP images
│   └── photos-src/            original photos (not shipped)
├── backend/             optional FastAPI + Supabase schema
├── scripts/             image pipeline and Supabase import
└── docs/screenshots/    images used in this README
```

## Run locally

```bash
cd frontend
npm install
cp .env.example .env.local   # then fill in the two Supabase values (see below)
npm run dev                  # http://localhost:5173
```

Without the Supabase values the site still works: it shows the copy bundled in `frontend/src/catalogue.json`.

## Change your details

Phone numbers, Instagram, the WhatsApp number and the homepage numbers (designs / customers / orders / states) live in
`frontend/src/site.js`. WhatsApp links assume India (`91`). Edit the file and redeploy. The About section reads the
brand name, Instagram and the order / state counts from the same file.

## Photo catalogue

`frontend/src/catalogue.json` defines collection names (their order in the file is the order on the page), descriptions,
photo order and stable shareable IDs. The original photos live in `frontend/photos-src/` (not shipped to the website).
`scripts/make_images.py` turns each one into two **WebP** images of identical size, with plain white/black borders trimmed
and the crop centred on the nails: `frontend/public/photos/thumbs/` (600x750, catalogue cards) and `photos/view/`
(1000x1250, the viewer). Each entry in the catalogue also stores an individual crop
rectangle and exposure multiplier, which the script applies. After adding or editing photos run:

```bash
pip install pillow numpy
python3 scripts/make_images.py
```

`scripts/photo-source-index.json` maps imported filenames and records excluded promotional collages and repeated looks.

The hero uses a flat-lay photo as a faded pink background (`frontend/public/hero/bg-cards.webp`) with three real product
photos in a tilted collage (`photo-*.webp`). Swap those files to change them.

"Book this look" opens WhatsApp with a short message naming the design ("Hi! I'd love to book this design: ... Is it
available?"). The general Book buttons open a chat saying you'd like to talk about ordering some nails.

## Supabase (designs and photos)

One-time setup:

1. Supabase -> **SQL Editor** -> run `backend/supabase/schema.sql` (tables, read-only public access, photo bucket).
2. Put `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `backend/.env` (git-ignored; the secret key is only for the import
   script on your machine, never on Vercel, never committed).
3. `backend/.venv/bin/python scripts/import_to_supabase.py` uploads the photos and fills the tables.

Day to day, edit rows in **Table Editor** (`designs`: title, description, price, tags, `featured`, `sort_order`;
`collections`: order and descriptions). Changes show on the site the next time a page loads. To add a new design, run
`scripts/make_images.py`, then `scripts/import_to_supabase.py` (uploads the WebP files and updates the rows).

## Admin page (`/admin`)

`https://<your-site>/admin` lets the owner add and remove photos, rename section headings and drag to reorder
(hold and drag a section's handle, or a photo). It lives in the same Vercel project (a separate chunk, so visitors
never download it).

**Nothing autosaves.** Edits only change a draft on screen. **Review & publish** lists exactly what will change
(adds, renames, reorders, deletions) and nothing goes live until you press **Publish now**. **Discard** throws the
draft away, and the browser warns before you leave with unpublished changes. Once published, the live site shows the
changes on its next page load.

**How it's protected:** sign in with an ID and password (Supabase Auth; "admin" is stored as `admin@nailsbyroops.admin`).
The database rules (`backend/supabase/admin.sql`) allow writes only for emails on the `admin_emails` table, so finding
`/admin` or the public key isn't enough to change anything. Use **Change password** in the page after your first sign-in.

One-time setup:

1. Run `backend/supabase/admin.sql` in the Supabase SQL Editor.
2. Create the admin user (Authentication -> Users -> Add user, tick *Auto Confirm User*) and add its email to the
   `admin_emails` table. Optional but wise: Authentication -> Sign In / Providers -> turn off *Allow new users to sign up*.

Photo names are automatic: every photo is called `<section heading> · 01`, `02`, … in the order it appears, so renaming a
heading renames everything inside it (the live site uses the same rule). Nothing needs typing per photo.

New photos are cropped to the standard 4:5 in the browser (plain borders trimmed, drag to adjust, slider to zoom) and
uploaded as WebP when you publish. A section can only be deleted when it is empty.

## Stats page (`/stats`)

Signs in with the same ID and password as `/admin` and shows: visits and unique visitors for the last hour, 24 hours,
7 days, 30 days and all time; WhatsApp, Instagram and Call clicks for the same periods; a 24-hour chart; the most booked
designs; and which sites visitors came from. It refreshes every 30 seconds.

Setup: run `backend/supabase/analytics.sql` once in the Supabase SQL Editor (make sure it is the same project the site
uses). It creates an `events` table that anyone may add to but nobody can read from the website, plus a `get_stats()`
function that only admins can call.

What is recorded: the event type, a random anonymous id kept in the visitor's browser, the design (for *Book this look*)
and the referring site. No names, no IP addresses. One visit per browser session; nothing is counted on `/admin` or
`/stats`, for automated browsers, or on devices where *Don't count my own visits* is ticked on `/stats`. Because adding
events is public, a determined person could inflate the numbers. Depending on where your visitors live you may want a
short privacy note on the site.

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

---

<div align="center">

Made with 💅 for [@nailsbyroops_](https://instagram.com/nailsbyroops_)

</div>
