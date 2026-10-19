import { useEffect, useRef, useState } from "react";

const DURATION = 2000; // ms for 0 -> target
const easeOut = (t) => 1 - Math.pow(1 - t, 3); // quick start, gentle finish, like a timer winding down

// "130+" -> counts 0, 1, 2 ... 130 and keeps the "+". Starts when it scrolls into view, runs once.
function CountUp({ value }) {
  const match = String(value).match(/^(\D*)(\d+)(.*)$/);
  const ref = useRef(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!match) return;
    const target = Number(match[2]);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    let raf;
    const run = () => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / DURATION);
        setN(Math.round(easeOut(t) * target));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!match) return <strong>{value}</strong>;
  // The final text is laid out invisibly underneath so the card never changes size while counting.
  return (
    <strong ref={ref} className="count" aria-label={value}>
      <i className="count__final" aria-hidden="true">{value}</i>
      <i className="count__live" aria-hidden="true">{match[1]}{n}{match[3]}</i>
    </strong>
  );
}

export default function Stats({ stats }) {
  const items = [
    { value: stats.designs, label: "Designs" },
    { value: stats.orders_delivered, label: "Orders delivered" },
    { value: stats.states, label: "States across India" },
  ];

  return (
    <section className="stats" aria-label="Our reach">
      <div className="stats__row">
        {items.map((s) => (
          <div className="stats__item" key={s.label}>
            <CountUp value={s.value} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <p className="stats__note">Loved by customers all over the country.</p>
    </section>
  );
}
