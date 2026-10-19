import { useRef, useState } from "react";
import DesignCard from "./DesignCard.jsx";

export default function StyleGallery({ group, onOpen }) {
  const track = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const measure = () => {
    const el = track.current;
    const next = { start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 };
    // Only re-render when an edge flag actually flips, not on every scroll tick.
    setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  };
  const move = (direction) => track.current.scrollBy({ left: direction * track.current.clientWidth * .8, behavior: "smooth" });
  return (
    <section className="style-group" aria-label={group.name}>
      <div className="style-group__head">
        <div><h3>{group.name}</h3><p>{group.description}</p></div>
        <div className="gallery-controls"><span>{group.designs.length} looks</span><button aria-label={`Scroll ${group.name} left`} disabled={edges.start} onClick={() => move(-1)}>←</button><button aria-label={`Scroll ${group.name} right`} disabled={edges.end} onClick={() => move(1)}>→</button></div>
      </div>
      <div className={`gallery-window ${!edges.start ? "has-left" : ""} ${!edges.end ? "has-right" : ""}`}>
        <div className="gallery-track" ref={track} onScroll={measure} tabIndex={0} aria-label={`${group.name} photos, scroll horizontally`}>
          {group.designs.map(design => <DesignCard key={design.id} design={design} onOpen={onOpen} />)}
        </div>
      </div>
    </section>
  );
}
