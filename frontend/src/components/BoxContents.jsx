import { useEffect, useRef, useState } from "react";

// Your real kit photo, with dashed outlines marking each item. Coordinates are fractions of the photo
// (x across, y down), drawn on a 100 x 133.33 canvas that matches the photo's 3:4 shape.
const ITEMS = [
  { name: "Glue tabs", note: "Sticky tabs for short-term wear", badge: [0.19, 0.285], shape: [[0.18, 0.285], [0.405, 0.285], [0.405, 0.435], [0.18, 0.435]] },
  { name: "Alcohol pad", note: "Wipes nails clean before you apply", badge: [0.115, 0.64], shape: [[0.372, 0.377], [0.465, 0.43], [0.49, 0.745], [0.433, 0.823], [0.117, 0.642]] },
  { name: "Nail file", note: "Shapes and smooths the edges", badge: [0.52, 0.352], shape: [[0.465, 0.352], [0.58, 0.352], [0.58, 0.48], [0.465, 0.48]] },
  { name: "Cuticle stick", note: "Pushes back cuticles for a clean fit", badge: [0.462, 0.84], shape: [[0.455, 0.4], [0.487, 0.4], [0.472, 0.84], [0.443, 0.84]] },
  { name: "Buffer", note: "Roughs up the nail for a better hold", badge: [0.6, 0.74], shape: [[0.488, 0.478], [0.725, 0.478], [0.725, 0.74], [0.488, 0.74]] },
  { name: "Nail glue", note: "A secure hold for your set", badge: [0.79, 0.357], shape: [[0.69, 0.35], [0.775, 0.357], [0.835, 0.805], [0.757, 0.815]] },
];

const X = 100;
const Y = 133.333;
const pts = (shape) => shape.map(([x, y]) => `${(x * X).toFixed(2)},${(y * Y).toFixed(2)}`).join(" ");

export default function BoxContents() {
  const [active, setActive] = useState(null);
  const root = useRef(null);

  // Everything glides in once when the section scrolls into view (visible straight away if motion is reduced).
  useEffect(() => {
    const el = root.current;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.add("is-armed");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="kit" id="box" aria-labelledby="kit-title" ref={root}>
      <div className="kit__head">
        <p className="eyebrow">✦ Complimentary with your nails</p>
        <h2 id="kit-title">What’s in the box</h2>
        <p>This kit comes free with every set. Everything you need to put your nails on at home.</p>
      </div>

      <div className="kit__body">
        <figure className="kit__photo">
          <img src="/box/kit.webp" width="1000" height="1333" loading="lazy" decoding="async" alt="The free kit in a clear pouch: glue tabs, alcohol pad, nail file, cuticle stick, buffer and nail glue." />
          <svg className="kit__marks" viewBox={`0 0 ${X} ${Y}`} preserveAspectRatio="none" aria-hidden="true">
            {ITEMS.map((it, i) => (
              <polygon key={it.name} points={pts(it.shape)} className={active === i ? "is-active" : ""} vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {ITEMS.map((it, i) => (
            <button
              type="button"
              key={it.name}
              className={`kit__dot ${active === i ? "is-active" : ""}`}
              style={{ left: `${it.badge[0] * 100}%`, top: `${it.badge[1] * 100}%` }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(active === i ? null : i)}
              aria-label={`${i + 1}. ${it.name}`}
            >
              {i + 1}
            </button>
          ))}
          <span className="kit__free" aria-hidden="true">
            FREE
            <small>with every set</small>
          </span>
        </figure>

        <ol className="kit__legend">
          {ITEMS.map((it, i) => (
            <li
              key={it.name}
              className={active === i ? "is-active" : ""}
              style={{ "--i": i }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive(active === i ? null : i)}
            >
              <span className="kit__num" aria-hidden="true">{i + 1}</span>
              <div>
                <h3>{it.name}</h3>
                <p>{it.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
