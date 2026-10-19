// Reads the catalogue straight from Supabase with the public, read-only (publishable) key.
// Row-level security on the tables means this key can only read, never change anything.
const URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const BUCKET = "nails";

function headers() {
  const h = { apikey: KEY };
  // Legacy anon keys are JWTs and also go in Authorization; new sb_publishable_ keys must not.
  if (KEY.startsWith("eyJ")) h.Authorization = `Bearer ${KEY}`;
  return h;
}

async function rows(table, signal) {
  const res = await fetch(`${URL}/rest/v1/${table}?select=*&order=sort_order.asc`, { headers: headers(), signal });
  if (!res.ok) throw new Error(`Supabase ${table}: ${res.status}`);
  return res.json();
}

const photo = (kind, image) => `${URL}/storage/v1/object/public/${BUCKET}/${kind}/${image}`;

// { collections, designs } with public photo links. Gives up after a few seconds so the site can fall back.
export async function fetchCatalogue(timeoutMs = 3500) {
  if (!URL || !KEY) throw new Error("Supabase is not configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const [collections, designs] = await Promise.all([rows("collections", controller.signal), rows("designs", controller.signal)]);
    return {
      collections: collections.map((c) => ({ name: c.name, description: c.description || "" })),
      designs: designs.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.collection,
        description: d.description || "",
        thumb_url: photo("thumbs", d.image),
        view_url: photo("view", d.image),
        price: d.price,
        tags: d.tags || [],
        featured: !!d.featured,
      })),
    };
  } finally {
    clearTimeout(timer);
  }
}
