// Photo names are automatic: "<section heading> · 01", "02", ... in the order the photos appear in the section.
// Rename a heading or reorder photos and every name follows. The same rule is used by the admin and the live site.
export const photoTitle = (heading, index) => `${heading} · ${String(index + 1).padStart(2, "0")}`;

// designs: array in display order; headingOf(design) -> the section heading it belongs to
export function withAutoTitles(designs, headingOf) {
  const seen = {};
  return designs.map((d) => {
    const heading = headingOf(d);
    seen[heading] = (seen[heading] ?? -1) + 1;
    return { ...d, title: photoTitle(heading, seen[heading]) };
  });
}
