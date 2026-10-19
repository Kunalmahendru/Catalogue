const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function get(path, signal) {
  const res = await fetch(`${BASE}${path}`, { signal });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export const fetchSite = () => get("/api/site");

// Collections + designs from Supabase via the API. Gives up after a few seconds so the site can fall back.
export async function fetchCatalogue(timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await get("/api/catalogue", controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
