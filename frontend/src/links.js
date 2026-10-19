export const telUrl = (phone) => `tel:+91${phone}`;

export const whatsappUrl = (site, message) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;

// Full-size, pre-cropped photo used in the viewer.
export const viewUrl = (design) => design.view_url || design.image_url.replace("/photos/", "/photos/view/").replace(/\.jpg$/, ".webp");


export const bookMessage = (design) =>
  design ? `Hi! I'd love to book this design: "${design.title}". Is it available?` : "Hi! I'd like to talk to you about ordering some nails.";

export const formatPrice = (price) =>
  price ? `₹${price.toLocaleString("en-IN")}` : "DM for price";

export const bulkMessage = () =>
  "Hi! I'm interested in wholesale / bulk orders of press-on nails. Could you share pricing and options?";

// Small pre-cropped copy used by catalogue cards (from Supabase Storage, or the bundled copy as a fallback).
export const thumbUrl = (design) => design.thumb_url || design.image_url.replace("/photos/", "/photos/thumbs/").replace(/\.jpg$/, ".webp");
