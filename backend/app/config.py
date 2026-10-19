import os

from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

# Public brand + contact details. Edit here, the website picks them up from /api/site.
SITE = {
    "brand": "nailsbyroops_",
    "tagline": "Tiny canvases. Big mood.",
    "instagram": "nailsbyroops_",
    "instagram_url": "https://instagram.com/nailsbyroops_",
    "phones": ["7417191057", "7830110057"],
    # WhatsApp needs the country code. 91 = India - change if needed.
    "whatsapp": "917417191057",
    # Shown in the "trusted" strip on the homepage.
    "stats": {"orders_delivered": "1500+", "states": "15+", "designs": "130+"},
}

USE_SUPABASE = bool(SUPABASE_URL and SUPABASE_ANON_KEY)
