const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export const fetchSite = () => get("/api/site");
export const fetchDesigns = () => get("/api/designs");
