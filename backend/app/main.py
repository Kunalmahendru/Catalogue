from typing import List, Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import repository
from .config import CORS_ORIGINS, SITE, USE_SUPABASE
from .models import Design, Site

app = FastAPI(title="Nail Art Catalogue API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "source": "supabase" if USE_SUPABASE else "sample-data"}


@app.get("/api/site", response_model=Site)
async def site():
    return SITE


@app.get("/api/designs", response_model=List[Design])
async def designs(category: Optional[str] = None):
    try:
        return await repository.list_designs(category)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not reach the database")


@app.get("/api/categories", response_model=List[str])
async def categories():
    try:
        all_designs = await repository.list_designs()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not reach the database")
    seen: List[str] = []
    for d in all_designs:
        if d.category not in seen:
            seen.append(d.category)
    return seen


@app.get("/api/designs/{design_id}", response_model=Design)
async def design(design_id: str):
    try:
        found = await repository.get_design(design_id)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not reach the database")
    if not found:
        raise HTTPException(status_code=404, detail="Design not found")
    return found
