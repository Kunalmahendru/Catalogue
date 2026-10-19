import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { photoUrl, supabase } from "./client.js";
import AddPhotos from "./AddPhotos.jsx";
import ChangePassword from "./ChangePassword.jsx";
import { toId } from "./ids.js";
import { buildPlan, flatten, publish, validate } from "./publish.js";

// Inputs and buttons inside a draggable card must not start a drag.
const noDrag = {
  onPointerDown: (e) => e.stopPropagation(),
  onMouseDown: (e) => e.stopPropagation(),
  onTouchStart: (e) => e.stopPropagation(),
  onKeyDown: (e) => e.stopPropagation(),
};

function PhotoCard({ d, others, onFave, onDelete, onMove, onTitle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: "d:" + d.id,
    data: { type: "design", collection: d.collection },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.55 : 1, zIndex: isDragging ? 5 : undefined };
  return (
    <figure ref={setNodeRef} style={style} className="adm-photo" {...attributes} {...listeners}>
      <div className="adm-photo__img">
        <img src={d.previewUrl || photoUrl("thumbs", d.image)} alt={d.title} draggable={false} />
        {d.isNew && <span className="adm-new">NEW</span>}
        <button className={`adm-fave ${d.featured ? "is-on" : ""}`} onClick={() => onFave(d)} aria-label={d.featured ? "Remove Fave badge" : "Add Fave badge"} title="Fave badge" {...noDrag}>
          ★
        </button>
        <button className="adm-del" onClick={() => onDelete(d)} aria-label={`Delete ${d.title}`} title="Delete photo" {...noDrag}>
          ✕
        </button>
      </div>
           <input
        className="adm-title"
        defaultValue={d.title}
        key={d.title}
        aria-label="Photo title"
        onBlur={(e) => e.target.value.trim() !== d.title && onTitle(d, e.target.value.trim())}
        {...noDrag}
        // Must come after noDrag: stops the drag handler on the card from taking the space bar while typing.
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") e.target.blur();
        }}
      />
      {others.length > 0 && (
        <select className="adm-move" value="" onChange={(e) => e.target.value && onMove(d, e.target.value)} aria-label="Move to another collection" {...noDrag}>
          <option value="">Move to…</option>
          {others.map((o) => (
            <option key={o.key} value={o.key}>
              {o.name}
            </option>
          ))}
        </select>
      )}
    </figure>
  );
}

function CollectionBlock({ c, items, allCols, compact, justAdded, onRename, onDescription, onDeleteCollection, onAdd, ...photoActions }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: "c:" + c.key,
    data: { type: "collection" },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 10 : undefined };
  const nameRef = useRef(null);
  useEffect(() => {
    if (justAdded) {
      nameRef.current?.focus();
      nameRef.current?.select();
    }
  }, [justAdded]);

  return (
    <section ref={setNodeRef} style={style} className="adm-collection">
      <header className="adm-collection__head">
        <button ref={setActivatorNodeRef} className="adm-handle" aria-label={`Reorder collection ${c.name}`} title="Hold and drag to reorder" {...attributes} {...listeners}>
          ⠿
        </button>
        <div className="adm-collection__titles">
          <input
            ref={nameRef}
            className="adm-heading"
            defaultValue={c.name}
            key={c.name}
            aria-label="Collection heading"
            onBlur={(e) => e.target.value.trim() !== c.name && onRename(c, e.target.value.trim(), e.target)}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
          />
          <input
            className="adm-desc"
            defaultValue={c.description}
            key={c.description + "|" + c.key}
            placeholder="Short line under the heading (optional)"
            aria-label="Collection description"
            onBlur={(e) => e.target.value.trim() !== c.description && onDescription(c, e.target.value.trim())}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
          />
        </div>
        <span className="adm-count">{items.length}</span>
        <button className="adm-btn adm-btn--small" onClick={() => onAdd(c)}>
          ＋ Add photos
        </button>
        <button className="adm-icon" onClick={() => onDeleteCollection(c)} aria-label={`Delete collection ${c.name}`} title="Delete collection (must be empty)">
          🗑
        </button>
      </header>
      {!compact && (
        <SortableContext items={items.map((d) => "d:" + d.id)} strategy={rectSortingStrategy}>
          <div className="adm-grid">
            {items.map((d) => (
              <PhotoCard key={d.id} d={d} others={allCols.filter((o) => o.key !== c.key)} {...photoActions} />
            ))}
            {items.length === 0 && <p className="adm-muted adm-empty">No photos yet. Use “Add photos”.</p>}
          </div>
        </SortableContext>
      )}
    </section>
  );
}

function ReviewModal({ plan, busy, progress, error, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);
  const destructive = plan.lines.some((l) => l.kind === "remove");
  return (
    <div className="adm-modal" role="dialog" aria-modal="true" aria-label="Review changes">
      <div className="adm-modal__box adm-modal__box--medium">
        <header>
          <h2>Publish to the live website?</h2>
        </header>
        <p className="adm-muted">These {plan.count === 1 ? "change goes" : `${plan.count} changes go`} live for every visitor as soon as you confirm:</p>
        <ul className="adm-review">
          {plan.lines.map((l, i) => (
            <li key={i} className={`adm-review--${l.kind}`}>
              <span aria-hidden="true">{l.kind === "add" ? "＋" : l.kind === "remove" ? "−" : "✎"}</span> {l.text}
            </li>
          ))}
        </ul>
        {destructive && <p className="adm-error">Deleted photos and sections can't be brought back.</p>}
        {error && <p className="adm-error">{error}</p>}
        <footer>
          <span className="adm-muted">{progress}</span>
          <div className="adm-top__actions">
            <button className="adm-btn" onClick={onCancel} disabled={busy}>
              Keep editing
            </button>
            <button className="adm-btn adm-btn--primary" onClick={onConfirm} disabled={busy}>
              {busy ? "Publishing…" : "Publish now"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function Editor({ email }) {
  const [server, setServer] = useState(null); // { cols, designs } as stored in the database
  const [cols, setCols] = useState([]); // the draft
  const [designs, setDesigns] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null); // { kind: "ok" | "error", text }
  const [compact, setCompact] = useState(false);
  const [addingTo, setAddingTo] = useState(null);
  const [justAdded, setJustAdded] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState("");
  const [publishError, setPublishError] = useState("");
  const counter = useRef(0);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }), // press and hold on phones
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    const [c, d] = await Promise.all([supabase.from("collections").select("*").order("sort_order"), supabase.from("designs").select("*").order("sort_order")]);
    if (c.error || d.error) {
      setLoadError((c.error || d.error).message);
      return false;
    }
    setLoadError("");
    setServer({ cols: c.data, designs: d.data });
    setCols(c.data.map((x) => ({ key: x.name, name: x.name, description: x.description || "" })));
    setDesigns(d.data.map((x) => ({ ...x })));
    return true;
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const plan = useMemo(() => (server ? buildPlan(server, cols, designs) : null), [server, cols, designs]);
  const dirty = !!plan && plan.count > 0;

  // Warn before leaving with unpublished changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const say = (kind, text) => setNotice({ kind, text });

  // ---- drag and drop (draft only) ----
  const collide = (args) => {
    const active = args.active.data.current;
    const containers = args.droppableContainers.filter((c) => {
      const data = c.data.current;
      return data?.type === active?.type && (active.type !== "design" || data.collection === active.collection);
    });
    return closestCenter({ ...args, droppableContainers: containers });
  };

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const type = active.data.current?.type;
    if (type === "collection") {
      const from = cols.findIndex((c) => "c:" + c.key === active.id);
      const to = cols.findIndex((c) => "c:" + c.key === over.id);
      if (from >= 0 && to >= 0) setCols(arrayMove(cols, from, to));
    } else if (type === "design") {
      const key = active.data.current.collection;
      const items = designs.filter((d) => d.collection === key);
      const from = items.findIndex((d) => "d:" + d.id === active.id);
      const to = items.findIndex((d) => "d:" + d.id === over.id);
      if (from < 0 || to < 0) return;
      setDesigns([...designs.filter((d) => d.collection !== key), ...arrayMove(items, from, to)]);
    }
  };

  // ---- collections ----
  const addCollection = () => {
    let name = "New collection";
    for (let n = 2; cols.some((c) => c.name === name); n++) name = `New collection ${n}`;
    const key = `new:${++counter.current}`;
    setCols([...cols, { key, name, description: "", isNew: true }]);
    setJustAdded(key);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 50);
  };

  const renameCollection = (c, next, input) => {
    if (!next) {
      input.value = c.name;
      return;
    }
    if (cols.some((x) => x.key !== c.key && x.name === next)) {
      input.value = c.name;
      say("error", `There is already a collection called “${next}”.`);
      return;
    }
    setCols((prev) => prev.map((x) => (x.key === c.key ? { ...x, name: next } : x)));
    if (justAdded === c.key) setJustAdded(null);
  };

  const setDescription = (c, description) => setCols((prev) => prev.map((x) => (x.key === c.key ? { ...x, description } : x)));

  const deleteCollection = (c) => {
    if (designs.some((d) => d.collection === c.key)) {
      say("error", `“${c.name}” still has photos. Move or delete them first.`);
      return;
    }
    setCols((prev) => prev.filter((x) => x.key !== c.key));
  };

  // ---- photos ----
  const toggleFave = (d) => setDesigns((prev) => prev.map((x) => (x.id === d.id ? { ...x, featured: !x.featured } : x)));
  const setTitle = (d, title) => title && setDesigns((prev) => prev.map((x) => (x.id === d.id ? { ...x, title } : x)));
  const moveDesign = (d, toKey) => setDesigns((prev) => [...prev.filter((x) => x.id !== d.id), { ...d, collection: toKey }]);
  const deleteDesign = (d) => {
    if (d.previewUrl) URL.revokeObjectURL(d.previewUrl);
    setDesigns((prev) => prev.filter((x) => x.id !== d.id));
  };

  const stagePhotos = (colKey, staged) => {
    const col = cols.find((c) => c.key === colKey);
    const count = designs.filter((d) => d.collection === colKey).length;
    const stamp = Date.now().toString(36);
    const rows = staged.map((s, i) => ({
      id: `photo-${stamp}${i}`,
      title: `${col.name} · ${String(count + i + 1).padStart(2, "0")}`,
      collection: colKey,
      description: "",
      image: s.image,
      price: null,
      tags: [],
      featured: false,
      isNew: true,
      blobs: s.blobs,
      previewUrl: s.previewUrl,
    }));
    setDesigns((prev) => [...prev, ...rows]);
  };

  // ---- confirm / discard ----
  const openReview = () => {
    const problem = validate(cols);
    if (problem) return say("error", problem);
    setNotice(null);
    setPublishError("");
    setReviewing(true);
  };

  const confirmPublish = async () => {
    setPublishing(true);
    setPublishError("");
    try {
      await publish(server, cols, designs, setProgress);
      designs.forEach((d) => d.previewUrl && URL.revokeObjectURL(d.previewUrl));
      await load();
      setReviewing(false);
      say("ok", "Published. The live website now shows these changes.");
    } catch (e) {
      console.error(e);
      setPublishError(`${e.message || e}. Some changes may already be live. Close this and press Discard to reload what's currently live.`);
    } finally {
      setPublishing(false);
      setProgress("");
    }
  };

  const discard = async () => {
    if (!window.confirm("Throw away all unpublished changes?")) return;
    designs.forEach((d) => d.previewUrl && URL.revokeObjectURL(d.previewUrl));
    await load();
    say("ok", "Changes discarded.");
  };

  const statusKind = !server ? "loading" : dirty ? "unsaved" : "saved";
  const statusText = !server ? "Loading…" : dirty ? `${plan.count} unpublished change${plan.count === 1 ? "" : "s"}` : "Nothing to publish. The site matches this page.";

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-top__row">
          <p className="adm-brand">
            nailsbyroops<span>_</span> <small>admin</small>
          </p>
          <div className="adm-top__actions">
            <a className="adm-btn adm-btn--small" href="/" target="_blank" rel="noreferrer">
              View site ↗
            </a>
            <button className="adm-btn adm-btn--small" onClick={() => setChangingPassword(true)}>
              Change password
            </button>
            <button className="adm-btn adm-btn--small" onClick={() => (!dirty || window.confirm("You have unpublished changes. Sign out anyway?")) && supabase.auth.signOut()} title={`Signed in as ${toId(email)}`}>
              Sign out ({toId(email)})
            </button>
          </div>
        </div>
        <div className="adm-top__row">
          <span className={`adm-status adm-status--${statusKind}`} role="status">
            {statusText}
          </span>
          <div className="adm-top__actions">
            <label className="adm-check">
              <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} /> Headings only (easier to reorder)
            </label>
            <button className="adm-btn adm-btn--small" onClick={addCollection} disabled={!server}>
              ＋ New collection
            </button>
            <button className="adm-btn adm-btn--small" onClick={discard} disabled={!dirty}>
              Discard
            </button>
            <button className="adm-btn adm-btn--small adm-btn--primary" onClick={openReview} disabled={!dirty}>
              Review &amp; publish{dirty ? ` (${plan.count})` : ""}
            </button>
          </div>
        </div>
        {notice && (
          <p className={notice.kind === "ok" ? "adm-ok" : "adm-error"} role="alert">
            {notice.text}
          </p>
        )}
        {loadError && <p className="adm-error">{loadError}</p>}
        <p className="adm-muted adm-tip">Make as many changes as you like: nothing goes live until you press “Review &amp; publish” and confirm. Hold and drag a section’s ⠿ handle to reorder sections, or hold and drag a photo to reorder photos.</p>
      </header>

      <DndContext sensors={sensors} collisionDetection={collide} onDragEnd={onDragEnd}>
        <SortableContext items={cols.map((c) => "c:" + c.key)} strategy={verticalListSortingStrategy}>
          <main className="adm-list">
            {cols.map((c) => (
              <CollectionBlock
                key={c.key}
                c={c}
                items={designs.filter((d) => d.collection === c.key)}
                allCols={cols}
                compact={compact}
                justAdded={justAdded === c.key}
                onRename={renameCollection}
                onDescription={setDescription}
                onDeleteCollection={deleteCollection}
                onAdd={setAddingTo}
                onFave={toggleFave}
                onDelete={deleteDesign}
                onMove={moveDesign}
                onTitle={setTitle}
              />
            ))}
          </main>
        </SortableContext>
      </DndContext>

      {changingPassword && <ChangePassword onClose={() => setChangingPassword(false)} />}
      {addingTo && <AddPhotos collection={addingTo.name} onClose={() => setAddingTo(null)} onStaged={(staged) => stagePhotos(addingTo.key, staged)} />}
      {reviewing && plan && <ReviewModal plan={plan} busy={publishing} progress={progress} error={publishError} onCancel={() => setReviewing(false)} onConfirm={confirmPublish} />}
    </div>
  );
}
