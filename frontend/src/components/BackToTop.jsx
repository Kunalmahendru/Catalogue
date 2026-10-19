import { useEffect, useState } from "react";
import { ArrowUpIcon } from "./Icons.jsx";

/**
 * Round "back to top" button that sits in the footer, between the copyright and the handle. It pops in when the footer
 * comes into view (an IntersectionObserver, so no scroll listener). Pressed, its arrow lifts out and fades, the button
 * fades after it, and the page glides up to the hero.
 */
export default function BackToTop() {
  const [shown, setShown] = useState(false);
  const [going, setGoing] = useState(false);

  useEffect(() => {
    const footer = document.querySelector(".footer");
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShown(entry.isIntersecting);
      if (!entry.isIntersecting) setGoing(false); // ready for the next visit to the footer
    });
    observer.observe(footer);
    return () => {
      observer.disconnect();
    };
  }, []);

  const goUp = () => {
    navigator.vibrate?.(10);
    setGoing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      className={`totop ${shown ? "is-shown" : ""} ${going ? "is-going" : ""}`}
      onClick={goUp}
      aria-label="Back to top"
      title="Back to top"
      inert={!shown || going}
    >
      <ArrowUpIcon className="totop__arrow" />
    </button>
  );
}
