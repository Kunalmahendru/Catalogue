import { createClient } from "@supabase/supabase-js";

const URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

export const configured = Boolean(URL && KEY);
export const BUCKET = "nails";

// Same public key as the website. What an admin may change is decided by the database rules, not by this key.
export const supabase = createClient(URL || "http://localhost", KEY || "missing", {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const photoUrl = (kind, file) => `${URL}/storage/v1/object/public/${BUCKET}/${kind}/${file}`;
