import { useEffect, useRef, useState } from "react";
import { analyse, drawCrop, exportImages } from "./imageTools.js";

function CropCard({ item, onChange, onRemove }) {
  const canvas = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    if (item.bmp) drawCrop(item.bmp, item.region, item.crop, canvas.current);
  }, [item.bmp, item.region, item.crop]);

  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    const el = canvas.current;
    // How many photo pixels one screen pixel covers at the current zoom.
    const wide = item.region.w / item.region.h > 0.8;
    const baseW = wide ? item.region.h * 0.8 : item.region.w;
    const perPx = baseW / item.crop.zoom / el.clientWidth;
    const fx = Math.min(1, Math.max(0, item.crop.fx - (dx * perPx) / item.region.w));
    const fy = Math.min(1, Math.max(0, item.crop.fy - (dy * perPx) / item.region.h));
    onChange({ ...item.crop, fx, fy });
  };

  return (
    <div className="adm-crop">
      {item.error ? (
        <div className="adm-crop__err">{item.error}</div>
      ) : (
        <canvas ref={canvas} width={240} height={300} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)} />
      )}
      <div className="adm-crop__row">
        <input
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={item.crop?.zoom ?? 1}
          disabled={!!item.error}
          aria-label="Zoom"
          onChange={(e) => onChange({ ...item.crop, zoom: Number(e.target.value) })}
        />
        <button type="button" className="adm-icon" onClick={onRemove} aria-label="Remove this photo">
          ✕
        </button>
      </div>
      <p className="adm-muted adm-crop__name">{item.name}</p>
    </div>
  );
}

const newName = () => `nail-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export default function AddPhotos({ collection, onClose, onStaged }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const nextId = useRef(0);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const pick = async (files) => {
    for (const file of files) {
      const id = nextId.current++;
      try {
        const a = await analyse(file);
        setItems((prev) => [...prev, { id, name: file.name, ...a }]);
      } catch {
        setItems((prev) => [...prev, { id, name: file.name, error: "Couldn't open this file. Use a JPG, PNG or WebP photo." }]);
      }
    }
  };

  const update = (id, patch) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, crop: patch } : it)));
  const remove = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  // Nothing is uploaded here: the processed photos are added to the draft and go live when the admin publishes.
  const stage = async () => {
    const ready = items.filter((it) => !it.error);
    if (!ready.length) return;
    setBusy(true);
    setError("");
    try {
      const staged = [];
      for (let i = 0; i < ready.length; i++) {
        setProgress(`Preparing ${i + 1} of ${ready.length}…`);
        const it = ready[i];
        const { thumbs, view, ext } = await exportImages(it.bmp, it.region, it.crop);
        staged.push({ image: `${newName()}.${ext}`, blobs: { thumbs, view }, previewUrl: URL.createObjectURL(thumbs) });
      }
      onStaged(staged);
      onClose();
    } catch (e) {
      setError(e.message || String(e));
      setBusy(false);
    }
  };

  return (
    <div className="adm-modal" role="dialog" aria-modal="true" aria-label={`Add photos to ${collection}`}>
      <div className="adm-modal__box">
        <header>
          <h2>Add photos to “{collection}”</h2>
          <button className="adm-icon" onClick={onClose} disabled={busy} aria-label="Close">
            ✕
          </button>
        </header>
        <p className="adm-muted">
          Photos are trimmed of plain borders and cropped to the same 4:5 shape as the rest. Drag a photo to move the crop, use the slider to zoom. They are added to your draft and only go live when you press Publish.
        </p>
        <label className="adm-btn adm-btn--primary adm-file">
          Choose photos
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              pick([...e.target.files]);
              e.target.value = "";
            }}
          />
        </label>
        {items.length > 0 && (
          <div className="adm-crops">
            {items.map((it) => (
              <CropCard key={it.id} item={it} onChange={(c) => update(it.id, c)} onRemove={() => remove(it.id)} />
            ))}
          </div>
        )}
        {error && <p className="adm-error">{error}</p>}
        <footer>
          <span className="adm-muted">{progress}</span>
          <button className="adm-btn adm-btn--primary" onClick={stage} disabled={busy || !items.some((it) => !it.error)}>
            {busy ? "Preparing…" : `Add ${items.filter((it) => !it.error).length || ""} to draft`}
          </button>
        </footer>
      </div>
    </div>
  );
}
