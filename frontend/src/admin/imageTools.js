// Turns a picked photo into the website's standard images, entirely in the browser:
// trims plain white/black borders, crops to 4:5 around the busiest part, exports WebP (JPEG on browsers that can't).
const RATIO = 4 / 5; // width / height
export const SIZES = { thumbs: [600, 750, 0.78], view: [1000, 1250, 0.8] }; // width, height, quality

export async function decode(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(file);
  }
}

function sample(bmp, sx, sy, sw, sh, maxSide) {
  const s = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * s));
  const h = Math.max(1, Math.round(sh * s));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h);
  return { data: ctx.getImageData(0, 0, w, h).data, w, h };
}

// Find the picture area inside plain white/black frames or letterboxing.
function trimRegion(bmp) {
  const { data, w, h } = sample(bmp, 0, 0, bmp.width, bmp.height, 400);
  const rowPlain = new Float32Array(h);
  const colPlain = new Float32Array(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const mn = Math.min(data[i], data[i + 1], data[i + 2]);
      const mx = Math.max(data[i], data[i + 1], data[i + 2]);
      if (mn >= 232 || mx <= 16) {
        rowPlain[y]++;
        colPlain[x]++;
      }
    }
  }
  const lead = (counts, total, limit) => {
    let n = 0;
    while (n < limit && counts[n] / total >= 0.97) n++;
    return n;
  };
  const top = lead(rowPlain, w, Math.floor(h * 0.3));
  const bottom = lead([...rowPlain].reverse(), w, Math.floor(h * 0.3));
  const left = lead(colPlain, h, Math.floor(w * 0.3));
  const right = lead([...colPlain].reverse(), h, Math.floor(w * 0.3));
  const full = { x: 0, y: 0, w: bmp.width, h: bmp.height };
  if (w - left - right < w * 0.4 || h - top - bottom < h * 0.4) return full;
  const sx = bmp.width / w;
  const sy = bmp.height / h;
  return { x: left * sx, y: top * sy, w: (w - left - right) * sx, h: (h - top - bottom) * sy };
}

// Centre of the most detailed / colourful area, as fractions (0..1) of the region.
function focusOf(bmp, region) {
  const { data, w, h } = sample(bmp, region.x, region.y, region.w, region.h, 160);
  const gray = new Float32Array(w * h);
  const sat = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    gray[i] = (r + g + b) / 3;
    sat[i] = Math.max(r, g, b) - Math.min(r, g, b);
  }
  const detail = new Float32Array(w * h);
  let maxD = 1e-6, maxS = 1e-6;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx = gray[y * w + x + 1] - gray[y * w + x - 1];
      const gy = gray[(y + 1) * w + x] - gray[(y - 1) * w + x];
      const d = Math.hypot(gx, gy);
      detail[y * w + x] = d;
      if (d > maxD) maxD = d;
    }
  }
  for (let i = 0; i < w * h; i++) if (sat[i] > maxS) maxS = sat[i];
  let total = 1e-6, sx = 0, sy = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const e = (detail[y * w + x] / maxD + (0.6 * sat[y * w + x]) / maxS) ** 2;
      total += e;
      sx += e * x;
      sy += e * y;
    }
  }
  return { fx: sx / total / w, fy: sy / total / h };
}

export async function analyse(file) {
  const bmp = await decode(file);
  const region = trimRegion(bmp);
  const { fx, fy } = focusOf(bmp, region);
  return { bmp, region, crop: { fx, fy, zoom: 1 } };
}

// The 4:5 window (in source pixels) a crop setting selects.
export function windowOf(region, crop) {
  const wide = region.w / region.h > RATIO;
  const baseW = wide ? region.h * RATIO : region.w;
  const baseH = wide ? region.h : region.w / RATIO;
  const ww = baseW / crop.zoom;
  const wh = baseH / crop.zoom;
  const cx = region.x + crop.fx * region.w;
  const cy = region.y + crop.fy * region.h;
  const wx = Math.min(Math.max(cx - ww / 2, region.x), region.x + region.w - ww);
  const wy = Math.min(Math.max(cy - wh / 2, region.y), region.y + region.h - wh);
  return { wx, wy, ww, wh };
}

export function drawCrop(bmp, region, crop, canvas) {
  const { wx, wy, ww, wh } = windowOf(region, crop);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, wx, wy, ww, wh, 0, 0, canvas.width, canvas.height);
}

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

// -> { thumbs: Blob, view: Blob, ext: "webp" | "jpg" }
export async function exportImages(bmp, region, crop) {
  const out = {};
  let ext = "webp";
  for (const [kind, [w, h, quality]] of Object.entries(SIZES)) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    drawCrop(bmp, region, crop, canvas);
    let blob = await toBlob(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") {
      // Browsers that can't encode WebP (older Safari) hand back PNG; use JPEG instead.
      ext = "jpg";
      blob = await toBlob(canvas, "image/jpeg", 0.85);
    }
    out[kind] = blob;
  }
  // If the first size was WebP but a later one wasn't (never seen), keep ext consistent with the blobs.
  if (out.thumbs.type !== out.view.type) {
    for (const kind of Object.keys(out)) {
      const canvas = document.createElement("canvas");
      [canvas.width, canvas.height] = SIZES[kind];
      drawCrop(bmp, region, crop, canvas);
      out[kind] = await toBlob(canvas, "image/jpeg", 0.85);
    }
    ext = "jpg";
  }
  return { ...out, ext };
}
