from typing import List, Optional

from pydantic import BaseModel, Field


class Collection(BaseModel):
    name: str
    description: str = ""


class Design(BaseModel):
    id: str
    title: str
    category: str  # the collection this design belongs to
    description: str = ""
    thumb_url: str  # small copy for catalogue cards
    view_url: str  # large copy for the viewer and the WhatsApp message
    price: Optional[int] = None  # None = no price shown
    tags: List[str] = Field(default_factory=list)
    featured: bool = False


class Catalogue(BaseModel):
    collections: List[Collection]
    designs: List[Design]


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
