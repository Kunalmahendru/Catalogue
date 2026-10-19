import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon } from "./Icons.jsx";

/**
 * Round "back to top" button. It pops in when the visitor reaches the footer (an IntersectionObserver, so no scroll
 * listener) and, when pressed, ripples, launches its arrow and glides the page back up to the hero.
 */
export default function BackToTop() {
  const [shown, setShown] = useState(false);
  const [going, setGoing] = useState(false);
  const timer = useRef(0);

  useEffect(() => {
    const footer = document.querySelector(".footer");
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => setShown(entry.isIntersecting), { threshold: 0 });
    observer.observe(footer);
    return () => {
      observer.disconnect();
      clearTimeout(timer.current);
    };
  }, []);

  const goUp = () => {
    navigator.vibrate?.(10);
    setGoing(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setGoing(false), 900);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      className={`totop ${shown ? "is-shown" : ""} ${going ? "is-going" : ""}`}
      onClick={goUp}
      aria-label="Back to top"
      title="Back to top"
      inert={!shown}
    >
      <span className="totop__ring" aria-hidden="true" />
      <ArrowUpIcon className="totop__arrow" />
    </button>
  );
}
