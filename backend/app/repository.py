"""Catalogue data access: collections, designs and photo URLs come from Supabase."""
import asyncio
import time
from typing import Dict, List, Optional

import httpx

from .config import SUPABASE_KEY, SUPABASE_URL, USE_SUPABASE
from .models import Catalogue, Collection, Design

BUCKET = "nails"
CACHE_SECONDS = 60

_cache: Dict[str, object] = {"at": 0.0, "data": None}


class NotConfigured(Exception):
    """Supabase keys are not set."""


def _headers() -> dict:
    headers = {"apikey": SUPABASE_KEY}
    # Legacy anon keys are JWTs and also go in Authorization; new sb_publishable_ keys must not.
    if SUPABASE_KEY.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {SUPABASE_KEY}"
    return headers


def _public_url(kind: str, image: str) -> str:
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{kind}/{image}"


async def _get(client: httpx.AsyncClient, table: str, order: str) -> List[dict]:
    res = await client.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        params={"select": "*", "order": order},
        headers=_headers(),
    )
    res.raise_for_status()
    return res.json()


async def get_catalogue() -> Catalogue:
    if not USE_SUPABASE:
        raise NotConfigured()
    now = time.monotonic()
    cached: Optional[Catalogue] = _cache["data"]  # type: ignore[assignment]
    if cached is not None and now - float(_cache["at"]) < CACHE_SECONDS:
        return cached

    async with httpx.AsyncClient(timeout=10) as client:
        collections, designs = await asyncio.gather(
            _get(client, "collections", "sort_order.asc"),
            _get(client, "designs", "sort_order.asc"),
        )

    catalogue = Catalogue(
        collections=[Collection(name=c["name"], description=c.get("description") or "") for c in collections],
        designs=[
            Design(
                id=d["id"],
                title=d["title"],
                category=d["collection"],
                description=d.get("description") or "",
                thumb_url=_public_url("thumbs", d["image"]),
                view_url=_public_url("view", d["image"]),
                price=d.get("price"),
                tags=d.get("tags") or [],
                featured=bool(d.get("featured")),
            )
            for d in designs
        ],
    )
    _cache["at"], _cache["data"] = now, catalogue
    return catalogue
