from typing import List, Optional

from pydantic import BaseModel, Field


class Design(BaseModel):
    id: str
    title: str
    category: str
    description: str = ""
    # Real photo URL (Supabase Storage). If empty, the site draws an illustration from `palette`.
    image_url: Optional[str] = None
    palette: List[str] = Field(default_factory=lambda: ["#f9a8d4", "#c4b5fd"])
    # Leave empty to show "DM for price".
    price: Optional[int] = None
    duration: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    featured: bool = False


class Stats(BaseModel):
    orders_delivered: str
    states: str
    designs: str


class Site(BaseModel):
    brand: str
    tagline: str
    instagram: str
    instagram_url: str
    phones: List[str]
    whatsapp: str
    stats: Stats
