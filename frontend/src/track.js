// Anonymous visit and click counting for the /stats page.
// Stored per event: its type, a random id made by this browser (no name, no IP), the design (for "Book this look")
// and where the visit came from. Nothing is recorded on the admin pages, for automated browsers, or on devices where
// the "don't count my visits" switch on /stats has been turned on.
import { recordEvent } from "./supabase.js";

const SKIP_PATHS = /^\/(admin|stats)\/?$/;
const safe = (fn) => {
  try {
    return fn();
  } catch {
    return null;
  }
};

function visitorId() {
  let id = safe(() => localStorage.getItem("nbr_vid"));
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    safe(() => localStorage.setItem("nbr_vid", id));
  }
  return id;
}

function enabled() {
  if (SKIP_PATHS.test(window.location.pathname)) return false;
  if (safe(() => localStorage.getItem("nbr_notrack"))) return false;
  if (navigator.webdriver && !safe(() => localStorage.getItem("nbr_track_automated"))) return false;
  return true;
}

// Which part of the page a button is in (so the stats can show where people click).
const areaOf = (el) =>
  el.closest(".pill") ? "pill" : el.closest(".reel") ? "viewer" : el.closest(".nav") ? "nav" : el.closest(".hero") ? "hero" : el.closest(".offer") ? "quote" : el.closest(".about") ? "about" : el.closest(".footer") ? "footer" : "page";

export function startTracking() {
  if (!enabled()) return () => {};
  const visitor = visitorId();

  // One "visit" per browser tab session.
  if (!safe(() => sessionStorage.getItem("nbr_visit"))) {
    safe(() => sessionStorage.setItem("nbr_visit", "1"));
    let source = "direct";
    try {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (host && host !== window.location.hostname) source = host.slice(0, 60);
    } catch {
      /* no referrer */
    }
    recordEvent({ type: "visit", visitor, source });
  }

  let lastKey = "";
  let lastAt = 0;
  const onClick = (e) => {
    const link = e.target.closest?.("a[href]");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    const type = href.startsWith("https://wa.me") ? "whatsapp" : /(^|\/\/)(www\.)?instagram\.com\//.test(href) ? "instagram" : href.startsWith("tel:") ? "call" : null;
    if (!type) return;
    const design = link.dataset.design || null;
    const key = `${type}|${design}`;
    const now = Date.now();
    if (key === lastKey && now - lastAt < 1000) return; // a double tap counts once
    lastKey = key;
    lastAt = now;
    recordEvent({ type, visitor, design, source: areaOf(link) });
  };
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
