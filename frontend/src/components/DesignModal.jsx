import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CloseIcon, InstagramIcon, PhoneIcon, WhatsAppIcon } from "./Icons.jsx";
import { bookMessage, telUrl, viewUrl, whatsappUrl } from "../links.js";

const ANIM_MS = 300;
const EASE = "cubic-bezier(0.3, 0.8, 0.3, 1)";
const BASE = "translateY(-33.3333%)"; // track holds [prev, current, next]; current sits in the middle
const AXIS_LOCK = 8; // px of movement before we decide vertical vs horizontal
const SWIPE_V = 70; // px to commit a next/previous swipe
const SWIPE_H = 90; // px to commit close / follow

// Every slide has the identical layout (actions included) so a photo never changes size when it becomes current.
function Slide({ design, position, total, site }) {
  const current = position === 0;
  return (
    <article className="reel__slide" aria-hidden={current ? undefined : "true"} inert={!current}>
      <div className="reel__photo">
        <img src={viewUrl(design)} alt={current ? design.title : ""} decoding="async" draggable="false" />
      </div>
      <div className="reel__info">
        <span className="chip chip--static">
          Design {design.number} / {total}
        </span>
        <h2>{design.title}</h2>
        <p className="reel__desc">{design.description}</p>
        {site && (
          <div className="reel__actions">
            <a className="btn btn--wa" href={whatsappUrl(site, bookMessage(design))} target="_blank" rel="noreferrer">
              <WhatsAppIcon /> Book this look
            </a>
            <a className="btn btn--ghost" href={telUrl(site.phones[0])}>
              <PhoneIcon /> Call
            </a>
            <a className="btn btn--ghost" href={site.instagram_url} target="_blank" rel="noreferrer">
              <InstagramIcon /> DM
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

// Animate an element to the given inline styles, then drop the transition so dragging stays 1:1 with the finger.
function animateTo(el, styles, ms = ANIM_MS) {
  el.style.transition = `transform ${ms}ms ${EASE}, opacity ${ms}ms`;
  Object.assign(el.style, styles);
  setTimeout(() => {
    el.style.transition = "none";
  }, ms + 20);
}

/**
 * Instagram-reels style viewer over the whole catalogue (loops forever).
 * Swipe up/down (or wheel / arrow keys) for next/previous, left to close, right to follow on Instagram.
 * Movement is applied straight to the DOM (no React re-render per touch move) so it stays smooth.
 */
export default function DesignModal({ designs, design, site, onClose, onSelect }) {
  const total = designs.length;
  const index = designs.findIndex((d) => d.id === design.id);
  const at = (offset) => {
    const i = (index + offset + total) % total;
    return { ...designs[i], number: i + 1 };
  };
  const slides = [at(-1), at(0), at(1)];

  const [toast, setToast] = useState("");
  const sheet = useRef(null);
  const track = useRef(null);
  const closeButton = useRef(null);
  const gesture = useRef(null);
  const busy = useRef(false);
  const wheelLock = useRef(0);
  const suppressClick = useRef(false);

  // A new design means the slides were re-ordered: snap the track back to centre in the same paint.
  useLayoutEffect(() => {
    const t = track.current;
    t.style.transition = "none";
    t.style.transform = BASE;
    busy.current = false;
  }, [design.id]);

  // Lock page scroll and manage focus while open.
  useEffect(() => {
    const previousFocus = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, []);

  // Warm the cache for the designs a swipe away.
  useEffect(() => {
    [2, -2].forEach((o) => {
      const d = designs[(index + o + total) % total];
      if (d) new Image().src = viewUrl(d);
    });
  }, [index, designs, total]);

  const step = useCallback(
    (direction) => {
      if (busy.current) return;
      busy.current = true;
      animateTo(track.current, { transform: direction > 0 ? "translateY(-66.6667%)" : "translateY(0%)" });
      setTimeout(() => onSelect(designs[(index + direction + total) % total].id), ANIM_MS);
    },
    [designs, index, total, onSelect]
  );

  const close = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    animateTo(sheet.current, { transform: "translateX(-110%)", opacity: "0" }, ANIM_MS - 80);
    setTimeout(onClose, ANIM_MS - 80);
  }, [onClose]);

  const follow = useCallback(() => {
    if (!site) return;
    setToast(`Opening @${site.instagram} on Instagram…`);
    setTimeout(() => setToast(""), 2200);
    window.open(site.instagram_url, "_blank", "noopener,noreferrer");
  }, [site]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowDown" || e.key === "PageDown") (e.preventDefault(), step(1));
      else if (e.key === "ArrowUp" || e.key === "PageUp") (e.preventDefault(), step(-1));
      else if (e.key === "Tab") {
        const nodes = [...sheet.current.parentElement.querySelectorAll("button:not(:disabled), a[href]")].filter((n) => !n.closest("[aria-hidden='true']"));
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close, step]);

  // ---- pointer gestures (touch + mouse drag) ----
  const onPointerDown = (e) => {
    if (busy.current || (e.pointerType === "mouse" && e.button !== 0)) return;
    gesture.current = { x: e.clientX, y: e.clientY, axis: null, id: e.pointerId };
  };

  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const mx = e.clientX - g.x;
    const my = e.clientY - g.y;
    if (!g.axis) {
      if (Math.hypot(mx, my) < AXIS_LOCK) return;
      g.axis = Math.abs(my) > Math.abs(mx) ? "y" : "x";
      sheet.current.setPointerCapture?.(e.pointerId);
      track.current.style.transition = "none";
      sheet.current.style.transition = "none";
    }
    if (g.axis === "y") track.current.style.transform = `translateY(calc(-33.3333% + ${my}px))`;
    else sheet.current.style.transform = `translateX(${mx}px) rotate(${mx / 60}deg)`;
  };

  const settle = () => {
    animateTo(track.current, { transform: BASE });
    animateTo(sheet.current, { transform: "translateX(0px) rotate(0deg)" });
  };

  const onPointerUp = (e) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!g.axis) return; // plain tap: let the click through
    suppressClick.current = true; // a drag must not also trigger the link under the finger
    setTimeout(() => (suppressClick.current = false), 0);
    const mx = e.clientX - g.x;
    const my = e.clientY - g.y;
    if (g.axis === "y") {
      if (Math.abs(my) > SWIPE_V) step(my < 0 ? 1 : -1);
      else settle();
    } else if (mx < -SWIPE_H) close();
    else if (mx > SWIPE_H) (follow(), settle());
    else settle();
  };

  const onPointerCancel = () => {
    if (gesture.current?.axis) settle();
    gesture.current = null;
  };

  // Trackpads keep firing wheel events while momentum fades; stay locked until they stop.
  const onWheel = (e) => {
    const now = Date.now();
    if (now < wheelLock.current) {
      wheelLock.current = Math.max(wheelLock.current, now + 250);
      return;
    }
    if (Math.abs(e.deltaY) < 30) return;
    wheelLock.current = now + 600;
    step(e.deltaY > 0 ? 1 : -1);
  };

  return (
    <div className="reel" role="dialog" aria-modal="true" aria-label={design.title} onClick={close}>
      <button className="reel__close" ref={closeButton} onClick={(e) => (e.stopPropagation(), close())} aria-label="Close">
        <CloseIcon />
      </button>

      <div
        className="reel__sheet"
        ref={sheet}
        onClick={(e) => e.stopPropagation()}
        onClickCapture={(e) => suppressClick.current && (e.preventDefault(), e.stopPropagation())}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onWheel={onWheel}
      >
        <div className="reel__track" ref={track}>
          {slides.map((d, i) => (
            <Slide key={d.id} design={d} position={i - 1} total={total} site={site} />
          ))}
        </div>

        <div className="reel__nav">
          <button onClick={() => step(-1)} aria-label="Previous design">▲</button>
          <button onClick={() => step(1)} aria-label="Next design">▼</button>
        </div>
      </div>

      <p className="reel__hint" aria-hidden="true">
        <span>↑ Swipe up for next</span>
        <span>← Swipe left to close</span>
        <span>→ Swipe right to follow</span>
      </p>
      {toast && <p className="reel__toast" role="status">{toast}</p>}
    </div>
  );
}
