"""Build the website's photos: uniform 4:5 WebP images with no white/black borders.

For every design in frontend/src/catalogue.json this takes the original in frontend/photos-src/, applies the
crop and exposure from the catalogue, trims plain white/black borders, then crops to 4:5 around the busiest part
of the photo (where the nails are) and writes:

    frontend/public/photos/thumbs/<name>.webp   600 x 750   catalogue cards
    frontend/public/photos/view/<name>.webp    1000 x 1250  viewer and the link sent on WhatsApp

Every image ends up exactly the same size, so the grid is even and pages load fast. Re-run after adding or
changing photos:

    pip install pillow numpy
    python3 scripts/make_images.py
"""
import json
import os

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")
SOURCES = os.path.join(ROOT, "photos-src")
OUT = os.path.join(ROOT, "public", "photos")
RATIO = 4 / 5  # width / height
SIZES = {"thumbs": (600, 750, 78), "view": (1000, 1250, 80)}  # width, height, WebP quality


def trim_borders(img: Image.Image) -> Image.Image:
    """Cut away plain white / black edges (frames, letterboxing)."""
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    h, w, _ = a.shape
    plain = (a.min(axis=2) >= 232) | (a.max(axis=2) <= 16)
    rows = plain.mean(axis=1) >= 0.97
    cols = plain.mean(axis=0) >= 0.97

    def lead(flags, limit):
        n = 0
        while n < limit and flags[n]:
            n += 1
        return n

    top, bottom = lead(rows, int(h * 0.3)), lead(rows[::-1], int(h * 0.3))
    left, right = lead(cols, int(w * 0.3)), lead(cols[::-1], int(w * 0.3))
    if (w - left - right) < w * 0.4 or (h - top - bottom) < h * 0.4:
        return img
    return img.crop((left, top, w - right, h - bottom))


def focus_point(img: Image.Image):
    """Centre of the most detailed / colourful area, as fractions (0..1)."""
    small = img.copy()
    small.thumbnail((200, 200))
    rgb = np.asarray(small.convert("RGB")).astype(np.float32)
    gray = rgb.mean(axis=2)
    gy, gx = np.gradient(gray)
    detail = np.hypot(gx, gy)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    energy = detail / (detail.max() + 1e-6) + 0.6 * sat / (sat.max() + 1e-6)
    energy = energy ** 2
    ys, xs = np.mgrid[0 : energy.shape[0], 0 : energy.shape[1]]
    total = energy.sum() + 1e-6
    return (energy * xs).sum() / total / energy.shape[1], (energy * ys).sum() / total / energy.shape[0]


def cover_crop(img: Image.Image) -> Image.Image:
    """Crop to exactly 4:5, sliding the window toward the focus point."""
    w, h = img.size
    fx, fy = focus_point(img)
    if w / h > RATIO:  # too wide: trim sides
        cw, ch = round(h * RATIO), h
        left = min(max(round(fx * w - cw / 2), 0), w - cw)
        return img.crop((left, 0, left + cw, ch))
    cw, ch = w, round(w / RATIO)  # too tall: trim top/bottom
    top = min(max(round(fy * h - ch / 2), 0), h - ch)
    return img.crop((0, top, cw, top + ch))


def main() -> None:
    designs = json.load(open(os.path.join(ROOT, "src", "catalogue.json"), encoding="utf-8"))["designs"]
    for kind in SIZES:
        os.makedirs(os.path.join(OUT, kind), exist_ok=True)
        for old in os.listdir(os.path.join(OUT, kind)):  # drop images from earlier runs
            os.remove(os.path.join(OUT, kind, old))

    sizes = {k: 0 for k in SIZES}
    for d in designs:
        name = os.path.splitext(os.path.basename(d["image_url"]))[0]
        img = Image.open(os.path.join(SOURCES, name + ".jpg")).convert("RGB")
        w, h = img.size
        left, top, right, bottom = d.get("crop") or [0, 0, 1, 1]
        img = img.crop((round(left * w), round(top * h), round(right * w), round(bottom * h)))
        exposure = d.get("exposure", 1) or 1
        if exposure != 1:
            img = ImageEnhance.Brightness(img).enhance(exposure)
            img = ImageEnhance.Contrast(img).enhance(0.99)
            img = ImageEnhance.Color(img).enhance(1.02)
        img = cover_crop(trim_borders(img))
        for kind, (tw, th, quality) in SIZES.items():
            path = os.path.join(OUT, kind, name + ".webp")
            img.resize((tw, th), Image.LANCZOS).save(path, "WEBP", quality=quality, method=6)
            sizes[kind] += os.path.getsize(path)

    for kind, total in sizes.items():
        print(f"{kind}: {len(designs)} images, {total // 1024} KB total, {total // len(designs) // 1024} KB each")


if __name__ == "__main__":
    main()
