// Draft -> live. The editor only changes a draft on screen; this file works out what differs from the database
// (buildPlan, used for the confirmation list) and applies it (publish) once the admin confirms.
import { BUCKET, supabase } from "./client.js";

// draft collection: { key, name, description, isNew? }   key = the name it had when loaded ("new:N" if added)
// draft design:     { id, title, collection (a collection key), description, image, price, tags, featured, isNew?, blobs?, previewUrl? }
export const flatten = (cols, designs) => cols.flatMap((c) => designs.filter((d) => d.collection === c.key));

const check = ({ error }) => {
  if (error) throw error;
};
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function buildPlan(server, cols, designs) {
  const flat = flatten(cols, designs);
  const nameOf = Object.fromEntries(cols.map((c) => [c.key, c.name]));
  const serverCol = Object.fromEntries(server.cols.map((c) => [c.name, c]));
  const serverDes = Object.fromEntries(server.designs.map((d) => [d.id, d]));

  const newCols = cols.filter((c) => c.isNew);
  const delCols = server.cols.filter((sc) => !cols.some((c) => c.key === sc.name));
  const renamed = cols.filter((c) => !c.isNew && c.name !== c.key);
  const colRows = cols.map((c, i) => ({ name: c.name, description: c.description, sort_order: i }));
  const changedColRows = colRows.filter((r, i) => {
    const c = cols[i];
    if (c.isNew) return true;
    const s = serverCol[c.key];
    return s.sort_order !== r.sort_order || (s.description || "") !== r.description;
  });

  // A photo's sort_order is its position inside its own section. The site groups by section, so nothing else is
  // needed, and moving a section never touches its photos' rows.
  const position = {};
  const rows = flat.map((d) => {
    position[d.collection] = (position[d.collection] ?? -1) + 1;
    return {
      id: d.id,
      title: d.title,
      collection: nameOf[d.collection],
      description: d.description || "",
      image: d.image,
      price: d.price ?? null,
      tags: d.tags || [],
      featured: !!d.featured,
      sort_order: position[d.collection],
    };
  });
  const newDesigns = flat.filter((d) => d.isNew);
  const newRows = rows.filter((_, i) => flat[i].isNew);
  const delDesigns = server.designs.filter((sd) => !designs.some((d) => d.id === sd.id));
  const changedRows = rows.filter((r, i) => {
    const d = flat[i];
    if (d.isNew) return false;
    const s = serverDes[d.id];
    return s.title !== r.title || !!s.featured !== r.featured || s.sort_order !== r.sort_order || s.collection !== d.collection;
  });

  // ---- the human-readable list shown before publishing ----
  const lines = [];
  const add = (kind, text) => lines.push({ kind, text });
  const survivingNames = (list) => list.filter((c) => !c.isNew && serverCol[c.key]);
  const serverOrder = survivingNames(cols).sort((a, b) => serverCol[a.key].sort_order - serverCol[b.key].sort_order).map((c) => c.key);
  if (serverOrder.join("\u0001") !== survivingNames(cols).map((c) => c.key).join("\u0001")) add("edit", "Reorder the sections");
  newCols.forEach((c) => add("add", `Add section “${c.name}”`));
  renamed.forEach((c) => add("edit", `Rename section “${c.key}” → “${c.name}”`));
  cols.filter((c) => !c.isNew && (serverCol[c.key].description || "") !== c.description).forEach((c) => add("edit", `Change the description of “${c.name}”`));
  const addedBy = {};
  newDesigns.forEach((d) => (addedBy[nameOf[d.collection]] = (addedBy[nameOf[d.collection]] || 0) + 1));
  Object.entries(addedBy).forEach(([name, n]) => add("add", `Add ${plural(n, "photo")} to “${name}”`));
  if (delDesigns.length) add("remove", `Permanently delete ${plural(delDesigns.length, "photo")}: ${delDesigns.slice(0, 4).map((d) => `“${d.title}”`).join(", ")}${delDesigns.length > 4 ? ` and ${delDesigns.length - 4} more` : ""}`);
  flat.filter((d) => !d.isNew && serverDes[d.id] && d.collection !== serverDes[d.id].collection).forEach((d) => add("edit", `Move “${d.title}” to “${nameOf[d.collection]}”`));
  cols.forEach((c) => {
    const mine = flat.filter((d) => d.collection === c.key && !d.isNew && serverDes[d.id] && serverDes[d.id].collection === c.key);
    const was = [...mine].sort((a, b) => serverDes[a.id].sort_order - serverDes[b.id].sort_order).map((d) => d.id);
    if (was.join() !== mine.map((d) => d.id).join()) add("edit", `Reorder the photos in “${c.name}”`);
  });
  flat.filter((d) => !d.isNew && serverDes[d.id] && serverDes[d.id].title !== d.title).forEach((d) => add("edit", `Rename photo “${serverDes[d.id].title}” → “${d.title}”`));
  flat.filter((d) => !d.isNew && serverDes[d.id] && !!serverDes[d.id].featured !== !!d.featured).forEach((d) => add("edit", `${d.featured ? "Add" : "Remove"} the Fave badge on “${d.title}”`));
  delCols.forEach((c) => add("remove", `Delete section “${c.name}”`));

  return { lines, count: lines.length, newCols, delCols, renamed, changedColRows, newRows, newDesigns, delDesigns, changedRows, nameOf };
}

export function validate(cols) {
  const seen = new Set();
  for (const c of cols) {
    if (!c.name.trim()) return "Every section needs a heading.";
    if (seen.has(c.name)) return `Two sections are both called “${c.name}”. Give them different names.`;
    seen.add(c.name);
  }
  return null;
}

export async function publish(server, cols, designs, onProgress = () => {}) {
  const problem = validate(cols);
  if (problem) throw new Error(problem);
  const plan = buildPlan(server, cols, designs);

  // 1. photos first, so rows never point at missing files
  const uploaded = [];
  try {
    for (let i = 0; i < plan.newDesigns.length; i++) {
      onProgress(`Uploading photo ${i + 1} of ${plan.newDesigns.length}…`);
      const d = plan.newDesigns[i];
      for (const kind of ["thumbs", "view"]) {
        const blob = d.blobs[kind];
        check(await supabase.storage.from(BUCKET).upload(`${kind}/${d.image}`, blob, { contentType: blob.type, cacheControl: "31536000" }));
      }
      uploaded.push(d.image);
    }
  } catch (e) {
    // nothing is live yet: tidy the files that did upload
    if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded.flatMap((f) => [`thumbs/${f}`, `view/${f}`]));
    throw e;
  }

  // 2. renames (two steps so swapping two names can't collide; photos follow automatically)
  if (plan.renamed.length) {
    onProgress("Renaming sections…");
    const stamp = Date.now();
    for (const [i, c] of plan.renamed.entries()) check(await supabase.from("collections").update({ name: `__tmp_${stamp}_${i}` }).eq("name", c.key));
    for (const [i, c] of plan.renamed.entries()) check(await supabase.from("collections").update({ name: c.name }).eq("name", `__tmp_${stamp}_${i}`));
  }

  // 3. sections: new ones, new order, descriptions
  if (plan.changedColRows.length) {
    onProgress("Saving sections…");
    check(await supabase.from("collections").upsert(plan.changedColRows, { onConflict: "name" }));
  }

  // 4. photos: new rows, then edits / moves / order
  if (plan.newRows.length) {
    onProgress("Adding photos…");
    check(await supabase.from("designs").insert(plan.newRows));
  }
  if (plan.changedRows.length) {
    onProgress("Saving photo changes…");
    for (let i = 0; i < plan.changedRows.length; i += 100) check(await supabase.from("designs").upsert(plan.changedRows.slice(i, i + 100), { onConflict: "id" }));
  }

  // 5. deletions last
  if (plan.delDesigns.length) {
    onProgress("Deleting photos…");
    check(await supabase.from("designs").delete().in("id", plan.delDesigns.map((d) => d.id)));
    check(await supabase.storage.from(BUCKET).remove(plan.delDesigns.flatMap((d) => [`thumbs/${d.image}`, `view/${d.image}`])));
  }
  if (plan.delCols.length) {
    onProgress("Deleting sections…");
    check(await supabase.from("collections").delete().in("name", plan.delCols.map((c) => c.name)));
  }
  return plan;
}
