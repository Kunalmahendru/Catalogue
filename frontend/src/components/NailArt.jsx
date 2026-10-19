import { useId } from "react";

// Almond nail outline in a 40 x 70 box.
const NAIL = "M20 2 C31 2 38 22 38 46 C38 62 30 68 20 68 C10 68 2 62 2 46 C2 22 9 2 20 2 Z";

// x, y, scale, rotation for pinky -> thumb, fanned like a hand.
const NAILS = [
  { x: 14, y: 128, s: 0.82, r: -14 },
  { x: 54, y: 82, s: 0.98, r: -7 },
  { x: 98, y: 62, s: 1.1, r: 0 },
  { x: 142, y: 82, s: 1.0, r: 7 },
  { x: 182, y: 140, s: 1.0, r: 22 },
];

function Accent({ category, id, i }) {
  switch (category) {
    case "French":
      return <path d="M2 14 C10 4 30 4 38 14 C38 22 36 26 34 28 C28 18 12 18 6 28 C4 26 2 22 2 14Z" fill="#fff" opacity=".95" transform="translate(0 -6)" />;
    case "Chrome":
      return (
        <>
          <rect x="-4" y="10" width="14" height="70" fill="#fff" opacity=".55" transform="rotate(18 20 40)" />
          <rect x="22" y="0" width="5" height="70" fill="#fff" opacity=".35" transform="rotate(18 20 40)" />
        </>
      );
    case "Floral":
      return (
        <g transform={`translate(${14 + (i % 2) * 8} ${26 + (i % 3) * 8})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-5" rx="2.6" ry="4.4" fill="#fff" transform={`rotate(${a})`} />
          ))}
          <circle r="2.6" fill="#f59e0b" />
        </g>
      );
    case "3D & Charms":
      return (
        <>
          <circle cx={12 + (i % 3) * 6} cy="30" r="4.6" fill="#fff" stroke="#f3e8ff" strokeWidth="1" />
          <circle cx="24" cy="46" r="3.4" fill="#fde68a" />
          <circle cx="15" cy="54" r="2.4" fill="#fff" />
        </>
      );
    case "Festive":
    case "Glam":
      return (
        <>
          {[[12, 20], [26, 32], [15, 44], [27, 52], [20, 12]].map(([cx, cy], k) => (
            <path key={k} d={`M${cx} ${cy - 3} L${cx + 1} ${cy - 1} L${cx + 3} ${cy} L${cx + 1} ${cy + 1} L${cx} ${cy + 3} L${cx - 1} ${cy + 1} L${cx - 3} ${cy} L${cx - 1} ${cy - 1}Z`} fill="#fff" opacity=".85" />
          ))}
        </>
      );
    default:
      return null;
  }
}

/** Stylised illustration used when a design has no real photo yet. */
export default function NailArt({ palette = [], category }) {
  const uid = useId().replace(/:/g, "");
  const [a = "#f9a8d4", b = a, c = b] = palette;
  const bg = `${uid}-bg`;
  const grad = `${uid}-g`;

  return (
    <svg viewBox="0 0 240 240" className="nailart" role="img" aria-label={`${category} nail design`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset=".55" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
        <radialGradient id={bg} cx=".3" cy=".2" r="1">
          <stop offset="0" stopColor={c} stopOpacity=".55" />
          <stop offset="1" stopColor={a} stopOpacity=".18" />
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill={`url(#${bg})`} />
      {NAILS.map((n, i) => (
        <g key={i} transform={`translate(${n.x} ${n.y}) rotate(${n.r} 20 35) scale(${n.s})`}>
          <path d={NAIL} fill="rgba(0,0,0,.12)" transform="translate(2 4)" />
          <clipPath id={`${uid}-c${i}`}>
            <path d={NAIL} />
          </clipPath>
          <g clipPath={`url(#${uid}-c${i})`}>
            <rect width="40" height="70" fill={`url(#${grad})`} />
            <Accent category={category} id={uid} i={i} />
          </g>
          <ellipse cx="14" cy="18" rx="3" ry="9" fill="#fff" opacity=".55" transform="rotate(-8 14 18)" />
        </g>
      ))}
    </svg>
  );
}
