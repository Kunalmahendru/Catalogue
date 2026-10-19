"""One-off import: upload photos to Supabase Storage and fill the collections/designs tables.

Reads frontend/src/catalogue.json and the WebP images made by scripts/make_images.py. Safe to re-run: photos are
overwritten and rows are updated in place (nothing is deleted).

Needs backend/.env with SUPABASE_URL and SUPABASE_SECRET_KEY (stays on your machine, never goes to the site).
Run backend/supabase/schema.sql in the Supabase SQL Editor first, then:

    backend/.venv/bin/python scripts/import_to_supabase.py
"""
import json
import os
import sys

import httpx

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PHOTOS = os.path.join(ROOT, "frontend", "public", "photos")
BUCKET = "nails"


def load_env() -> dict:
    env = {}
    path = os.path.join(ROOT, "backend", ".env")
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                env[key.strip()] = value.strip()
    env.update({k: v for k, v in os.environ.items() if k.startswith("SUPABASE_")})
    return env


env = load_env()
URL = env.get("SUPABASE_URL", "").rstrip("/")
KEY = env.get("SUPABASE_SECRET_KEY", "")
if not URL or not KEY:
    sys.exit("Set SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env first.")

client = httpx.Client(timeout=120, headers={"apikey": KEY})
data = json.load(open(os.path.join(ROOT, "frontend", "src", "catalogue.json"), encoding="utf-8"))
designs, collections = data["designs"], data["collections"]


def ensure_bucket() -> None:
    res = client.post(f"{URL}/storage/v1/bucket", json={"id": BUCKET, "name": BUCKET, "public": True})
    if res.status_code in (200, 201):
        print(f"created public bucket '{BUCKET}'")
        return
    # Already there (e.g. the SQL created it): just make sure it is public.
    res = client.put(f"{URL}/storage/v1/bucket/{BUCKET}", json={"public": True})
    res.raise_for_status()
    print(f"bucket '{BUCKET}' ready")


def image_name(d: dict) -> str:
    return os.path.splitext(os.path.basename(d["image_url"]))[0] + ".webp"


def upload_photos() -> None:
    total = len(designs) * 2
    done = 0
    for kind in ("thumbs", "view"):
        for d in designs:
            name = image_name(d)
            body = open(os.path.join(PHOTOS, kind, name), "rb").read()
            res = client.post(
                f"{URL}/storage/v1/object/{BUCKET}/{kind}/{name}",
                content=body,
                headers={"Content-Type": "image/webp", "x-upsert": "true", "cache-control": "max-age=86400"},
            )
            res.raise_for_status()
            done += 1
            if done % 20 == 0 or done == total:
                print(f"uploaded {done}/{total} photos")


def prune_stale_photos() -> None:
    """Remove files in the bucket that the catalogue no longer uses (e.g. older JPEG copies)."""
    keep = {image_name(d) for d in designs}
    stale = []
    for kind in ("thumbs", "view"):
        res = client.post(f"{URL}/storage/v1/object/list/{BUCKET}", json={"prefix": kind, "limit": 1000, "offset": 0})
        res.raise_for_status()
        stale += [f"{kind}/{o['name']}" for o in res.json() if o.get("name") and o["name"] not in keep]
    if stale:
        res = client.request("DELETE", f"{URL}/storage/v1/object/{BUCKET}", json={"prefixes": stale})
        res.raise_for_status()
    print(f"removed {len(stale)} unused files from storage")


def upsert(table: str, conflict: str, rows: list) -> None:
    res = client.post(
        f"{URL}/rest/v1/{table}",
        params={"on_conflict": conflict},
        json=rows,
        headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
    )
    if res.status_code == 404 and "PGRST205" in res.text:
        sys.exit(f"\nPhotos are uploaded, but the '{table}' table doesn't exist yet. "
                 "Run backend/supabase/schema.sql in the Supabase SQL Editor, then run this script again.")
    res.raise_for_status()
    print(f"saved {len(rows)} rows in '{table}'")


ensure_bucket()
upload_photos()
prune_stale_photos()
upsert("collections", "name", [
    {"name": c["name"], "description": c.get("description", ""), "sort_order": i} for i, c in enumerate(collections)
])
upsert("designs", "id", [
    {
        "id": d["id"],
        "title": d["title"],
        "collection": d["category"],
        "description": d.get("description", ""),
        "image": image_name(d),
        "price": d.get("price"),
        "tags": d.get("tags", []),
        "featured": bool(d.get("featured", False)),
        "sort_order": i,
    }
    for i, d in enumerate(designs)
])
print("done")
