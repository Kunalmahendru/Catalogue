"""Build the pre-cropped copies in frontend/public/photos/: thumbs/ (cards) and view/ (full-screen viewer
and the photo link sent on WhatsApp).

Each thumbnail is the full photo with its crop and exposure from catalogue.json already applied,
so the catalogue rows only decode ~50 KB images and the browser does no per-photo filtering while
you scroll. Re-run this after adding or changing photos in catalogue.json:

    pip install pillow
    python3 scripts/make_thumbs.py
"""
import json
import os

from PIL import Image, ImageEnhance

ROOT = os.path.join(os.path.dirname(__file__), "..", "frontend")
PHOTOS = os.path.join(ROOT, "public", "photos")
THUMBS = os.path.join(PHOTOS, "thumbs")
VIEW = os.path.join(PHOTOS, "view")
WIDTH = 640  # cards are at most ~305 CSS px wide, so this stays sharp on 2x screens
VIEW_WIDTH = 1200  # big enough to fill a phone or laptop viewer without looking soft

os.makedirs(THUMBS, exist_ok=True)
os.makedirs(VIEW, exist_ok=True)
designs = json.load(open(os.path.join(ROOT, "src", "catalogue.json"), encoding="utf-8"))["designs"]

for d in designs:
    name = os.path.basename(d["image_url"])
    img = Image.open(os.path.join(PHOTOS, name)).convert("RGB")
    w, h = img.size
    left, top, right, bottom = d.get("crop") or [0, 0, 1, 1]
    img = img.crop((round(left * w), round(top * h), round(right * w), round(bottom * h)))
    exposure = d.get("exposure", 1) or 1
    if exposure != 1:  # same look the old CSS filter produced
        img = ImageEnhance.Brightness(img).enhance(exposure)
        img = ImageEnhance.Contrast(img).enhance(0.99)
        img = ImageEnhance.Color(img).enhance(1.02)
    big = img if img.width <= VIEW_WIDTH else img.resize((VIEW_WIDTH, round(img.height * VIEW_WIDTH / img.width)), Image.LANCZOS)
    big.save(os.path.join(VIEW, name), quality=84, optimize=True, progressive=True)
    small = img if img.width <= WIDTH else img.resize((WIDTH, round(img.height * WIDTH / img.width)), Image.LANCZOS)
    small.save(os.path.join(THUMBS, name), quality=80, optimize=True, progressive=True)

print(f"wrote {len(designs)} thumbnails and viewer images under {os.path.relpath(PHOTOS)}")
