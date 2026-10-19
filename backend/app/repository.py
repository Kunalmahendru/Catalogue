"""Data access. Reads from Supabase (PostgREST) when configured, else from sample data."""
from typing import List, Optional

import httpx

from .config import SUPABASE_ANON_KEY, SUPABASE_URL, USE_SUPABASE
from .models import Design
from .seed import SEED_DESIGNS


async def _fetch_supabase() -> List[Design]:
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/designs",
            params={"select": "*", "order": "sort_order.asc,created_at.desc"},
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            },
        )
        res.raise_for_status()
        return [Design(**row) for row in res.json()]


async def list_designs(category: Optional[str] = None) -> List[Design]:
    designs = await _fetch_supabase() if USE_SUPABASE else [Design(**d) for d in SEED_DESIGNS]
    if category and category.lower() != "all":
        designs = [d for d in designs if d.category.lower() == category.lower()]
    return designs


async def get_design(design_id: str) -> Optional[Design]:
    for d in await list_designs():
        if d.id == design_id:
            return d
    return None
