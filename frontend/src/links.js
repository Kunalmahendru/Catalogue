export const telUrl = (phone) => `tel:+91${phone}`;

export const whatsappUrl = (site, message) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;

// Full-size, pre-cropped photo used in the viewer and shared in the WhatsApp message.
export const viewUrl = (design) => design.view_url || design.image_url.replace("/photos/", "/photos/view/").replace(/\.jpg$/, ".webp");

const absoluteUrl = (url) => (/^https?:/.test(url) ? url : `${window.location.origin}${url}`);

// WhatsApp links can't attach a file, so the message carries the photo's public link instead:
// WhatsApp shows it as an image preview once the site is online.
export const bookMessage = (design) =>
  design
    ? `Hi! I'd love to book this design: "${design.title}" (${design.category}). Is it available?\n${absoluteUrl(viewUrl(design))}`
    : "Hi! I saw your nail catalogue and want to book an appointment 💅";

export const formatPrice = (price) =>
  price ? `₹${price.toLocaleString("en-IN")}` : "DM for price";

export const bulkMessage = () =>
  "Hi! I'm interested in wholesale / bulk orders of press-on nails. Could you share pricing and options?";

// Small pre-cropped copy used by catalogue cards (from Supabase Storage, or the bundled copy as a fallback).
export const thumbUrl = (design) => design.thumb_url || design.image_url.replace("/photos/", "/photos/thumbs/").replace(/\.jpg$/, ".webp");
