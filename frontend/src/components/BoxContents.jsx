import { useEffect, useRef } from "react";

// Flat, soft-gradient illustrations. Each is drawn on a 160 x 160 canvas with a pastel blob behind it and a soft
// shadow under it, so they all read as one set lined up on the same surface.
const Backdrop = ({ id, from, to }) => (
  <>
    <defs>
      <radialGradient id={`bx-blob-${id}`} cx="35%" cy="30%" r="80%">
        <stop offset="0" stopColor={from} />
        <stop offset="1" stopColor={to} />
      </radialGradient>
      <radialGradient id={`bx-shadow-${id}`}>
        <stop offset="0" stopColor="#7a2d55" stopOpacity="0.22" />
        <stop offset="1" stopColor="#7a2d55" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="80" cy="76" r="64" fill={`url(#bx-blob-${id})`} />
    <ellipse cx="80" cy="140" rx="46" ry="8" fill={`url(#bx-shadow-${id})`} />
  </>
);

const Buffer = () => (
  <svg viewBox="0 0 160 160" aria-hidden="true">
    <Backdrop id="buffer" from="#ffe3ef" to="#ffc7de" />
    <defs>
      <linearGradient id="bx-buffer-top" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#ffe9f2" />
      </linearGradient>
      <pattern id="bx-grit" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#f3a5c3" />
        <circle cx="6" cy="6" r="1" fill="#f3a5c3" />
      </pattern>
    </defs>
    <g transform="rotate(-14 80 80)">
      <rect x="28" y="70" width="104" height="44" rx="12" fill="#f08db4" />
      <rect x="28" y="58" width="104" height="44" rx="12" fill="url(#bx-buffer-top)" />
      <rect x="28" y="58" width="104" height="44" rx="12" fill="url(#bx-grit)" />
      <rect x="28" y="58" width="104" height="44" rx="12" fill="none" stroke="#fff" strokeWidth="2" opacity="0.8" />
      <rect x="36" y="92" width="88" height="5" rx="2.5" fill="#c4a5ff" />
    </g>
  </svg>
);

const NailFile = () => (
  <svg viewBox="0 0 160 160" aria-hidden="true">
    <Backdrop id="file" from="#dcfbec" to="#b6f0d4" />
    <defs>
      <linearGradient id="bx-file-body" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#7fdcb3" />
        <stop offset="1" stopColor="#4fc596" />
      </linearGradient>
      <pattern id="bx-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="#ffffff" strokeWidth="1.4" opacity="0.55" />
      </pattern>
    </defs>
    <g transform="rotate(36 80 80)">
      <rect x="67" y="12" width="26" height="136" rx="13" fill="url(#bx-file-body)" />
      <rect x="67" y="12" width="26" height="92" rx="13" fill="url(#bx-hatch)" />
      <path d="M67 100 H93 V135 A13 13 0 0 1 80 148 A13 13 0 0 1 67 135 Z" fill="#ffffff" opacity="0.4" />
      <rect x="72" y="16" width="4" height="82" rx="2" fill="#ffffff" opacity="0.5" />
    </g>
  </svg>
);

const CuticleStick = () => (
  <svg viewBox="0 0 160 160" aria-hidden="true">
    <Backdrop id="stick" from="#fff0d9" to="#ffd9b0" />
    <defs>
      <linearGradient id="bx-wood" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#f9dcb6" />
        <stop offset="1" stopColor="#e7b57c" />
      </linearGradient>
    </defs>
    <g transform="rotate(-38 80 80)">
      <path d="M76 12 L84 12 L89 38 L89 136 Q89 150 80 150 Q71 150 71 136 L71 38 Z" fill="url(#bx-wood)" />
      <path d="M76 12 L84 12 L86 24 L74 24 Z" fill="#d79a62" />
      <rect x="75" y="40" width="3.5" height="96" rx="1.75" fill="#ffffff" opacity="0.55" />
    </g>
  </svg>
);

const Glue = () => (
  <svg viewBox="0 0 160 160" aria-hidden="true">
    <Backdrop id="glue" from="#efe6ff" to="#d6c4ff" />
    <defs>
      <linearGradient id="bx-glue-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#b79cff" />
        <stop offset="1" stopColor="#8d6ff0" />
      </linearGradient>
    </defs>
    <path d="M73 44 L80 20 L87 44 Z" fill="#ff7fb0" />
    <rect x="68" y="42" width="24" height="26" rx="6" fill="#ffffff" />
    <rect x="50" y="62" width="60" height="78" rx="16" fill="url(#bx-glue-body)" />
    <rect x="57" y="70" width="6" height="60" rx="3" fill="#ffffff" opacity="0.4" />
    <rect x="62" y="86" width="40" height="34" rx="9" fill="#ffffff" opacity="0.95" />
    <path d="M82 92 C82 92 74 102 74 107 A8 8 0 0 0 90 107 C90 102 82 92 82 92 Z" fill="#ff6aa2" />
  </svg>
);

const GlueTabs = () => (
  <svg viewBox="0 0 160 160" aria-hidden="true">
    <Backdrop id="tabs" from="#e3f3ff" to="#bfdfff" />
    <defs>
      <linearGradient id="bx-sheet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#dcedff" />
      </linearGradient>
    </defs>
    <g transform="rotate(7 80 80)">
      <rect x="30" y="36" width="100" height="90" rx="14" fill="url(#bx-sheet)" stroke="#ffffff" strokeWidth="2" />
      {[0, 1, 2, 3].map((c) =>
        [0, 1].map((r) => (
          <ellipse key={`${c}-${r}`} cx={50 + c * 20} cy={64 + r * 36} rx="8" ry="12" fill="#bfe0ff" stroke="#8fc4f7" strokeWidth="1.4" />
        ))
      )}
      <path d="M130 100 L130 112 Q130 126 116 126 L104 126 Z" fill="#cfe6ff" />
    </g>
  </svg>
);

const AlcoholPad = () => (
  <svg viewBox="0 0 160 160" aria-hidden="true">
    <Backdrop id="pad" from="#ffe6e6" to="#ffc9d3" />
    <defs>
      <linearGradient id="bx-foil" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#e6f1ff" />
      </linearGradient>
    </defs>
    <g transform="rotate(-9 80 80)">
      <rect x="32" y="44" width="96" height="76" rx="8" fill="url(#bx-foil)" stroke="#ffffff" strokeWidth="2" />
      <rect x="32" y="44" width="96" height="9" rx="4" fill="#cfe4ff" />
      <rect x="32" y="111" width="96" height="9" rx="4" fill="#cfe4ff" />
      <line x1="38" y1="48.5" x2="122" y2="48.5" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 4" />
      <line x1="38" y1="115.5" x2="122" y2="115.5" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 4" />
      <circle cx="80" cy="82" r="17" fill="#ff6a8f" />
      <rect x="74" y="79" width="12" height="6" rx="1.5" fill="#ffffff" />
      <rect x="77" y="76" width="6" height="12" rx="1.5" fill="#ffffff" />
    </g>
  </svg>
);

const ITEMS = [
  { name: "Buffer", note: "Roughs up the nail for a better hold", Art: Buffer },
  { name: "Nail file", note: "Shapes and smooths the edges", Art: NailFile },
  { name: "Cuticle stick", note: "Pushes back cuticles for a clean fit", Art: CuticleStick },
  { name: "Nail glue", note: "A secure hold for your set", Art: Glue },
  { name: "Glue tabs", note: "Sticky tabs for short-term wear", Art: GlueTabs },
  { name: "Alcohol pad", note: "Wipes nails clean before you apply", Art: AlcoholPad },
];

export default function BoxContents() {
  const ref = useRef(null);

  // Items glide in one after another when the section scrolls into view (visible straight away if motion is reduced).
  useEffect(() => {
    const el = ref.current;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.add("is-armed");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="box" aria-labelledby="box-title">
      <div className="box__head">
        <p className="eyebrow">✦ Inside every order</p>
        <h2 id="box-title">What’s in the box</h2>
        <p>Everything you need to put your set on at home.</p>
      </div>
      <ul className="box__tray" ref={ref}>
        {ITEMS.map(({ name, note, Art }, i) => (
          <li className="box__item" key={name} style={{ "--i": i }}>
            <div className="box__art">
              <Art />
            </div>
            <h3>{name}</h3>
            <p>{note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
