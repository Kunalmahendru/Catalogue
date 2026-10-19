import httpx
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from . import repository
from .config import CORS_ORIGINS, SITE, USE_SUPABASE
from .models import Catalogue, Site

app = FastAPI(title="Nail Art Catalogue API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "source": "supabase" if USE_SUPABASE else "not-configured"}


@app.get("/api/site", response_model=Site)
async def site():
    return SITE


@app.get("/api/catalogue", response_model=Catalogue)
async def catalogue(response: Response):
    """Collections + designs (with public photo URLs) for the website."""
    try:
        data = await repository.get_catalogue()
    except repository.NotConfigured:
        raise HTTPException(status_code=503, detail="Supabase is not configured")
    except (httpx.HTTPError, ValidationError, KeyError):
        raise HTTPException(status_code=502, detail="Could not read the catalogue from the database")
    response.headers["Cache-Control"] = "public, max-age=60"
    return data
