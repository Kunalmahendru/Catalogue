# nailsbyroops_ — Nail Art Catalogue

React (Vite) frontend + FastAPI backend. Works on phone, tablet, laptop and desktop.
The website displays 94 supplied photos in seven curated collections. Contact details come from the FastAPI backend. The photo catalogue is available even while the backend is offline.

```
backend/    FastAPI API  (deploys to Vercel as a serverless function)
frontend/   React site   (deploys to Vercel as a static site)
```

## Run locally

Terminal 1 — API (port 8010):

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```

Terminal 2 — website (http://localhost:5173):

```bash
cd frontend
npm install
npm run dev
```

## Change your details

Phone numbers, Instagram and WhatsApp number live in `backend/app/config.py` (`SITE`).
WhatsApp links assume India (`91`). Change `whatsapp` there if that's wrong.

## Photo catalogue

`frontend/src/catalogue.json` defines collection names (their order in the file is the order on the page), descriptions, photo order and stable shareable IDs.
Browser-compatible JPEG copies live in `frontend/public/photos/`. Catalogue cards use small pre-cropped copies in
`frontend/public/photos/thumbs/` and the viewer uses larger ones in `photos/view/` (crop and exposure baked in, so
scrolling stays smooth and photos fill the screen). After adding or editing photos run `python3 scripts/make_thumbs.py` (needs `pip install pillow`). Original files are unchanged.
Each entry also stores source dimensions, an individual crop rectangle and an exposure multiplier.
`Photo.jsx` applies the same non-destructive framing and lighting to galleries, thumbnails, the hero
and the enlarged viewer. Screenshot controls are clipped before fitting the photo to its container.
`scripts/photo-source-index.json` maps imported filenames and records excluded promotional collages
and repeated looks. Two supplied videos are not included in the photo galleries.

The hero uses your flat-lay photo as a faded pink background (`frontend/public/hero/bg-cards.jpg`) with three real
product photos stacked on a static pastel canvas (`photo-*.jpg`). Swap those files to change them.

Contact lives in a floating pill (`ContactPill.jsx`): WhatsApp, Instagram and Call. It stays hidden at the top of
the page and eases in once you scroll. The call icon opens a popup with both numbers (tap to call/save, or copy).
Numbers, Instagram and the WhatsApp number come from `backend/app/config.py`.

"Book this look" opens WhatsApp with a message naming the design plus the link to its photo
(`/photos/view/...`). WhatsApp links cannot attach a file, so the photo shows as a preview in the chat once the
site is live on a public URL (it won't preview from localhost).

Each collection scrolls horizontally with edge fades, snap points and arrow controls. Tapping a photo
opens a reel-style bottom sheet (75% of the screen, attached to the bottom, over a blurred page) that loops through every design:
swipe up for the next, down for the previous, left to close, right to open Instagram and follow.
On desktop the same works with mouse drag, scroll wheel, the ▲▼ buttons and the arrow keys; Esc or ✕ closes.

The backend's `/api/designs` and Supabase integration remain available separately; the website's
curated catalogue uses the bundled JSON so old sample designs cannot replace the supplied photos.

## Deploy

**Backend → Vercel** (new project, root directory `backend`). Add env vars `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, and `CORS_ORIGINS` (your frontend URL, e.g. `https://nailsbyroops.vercel.app`).

**Frontend → Vercel** (new project, root directory `frontend`, framework Vite). Add env var
`VITE_API_URL` = your backend's Vercel URL (no trailing slash).

Only the public anon key is used, and the table is read-only for the public (row level security).
