import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { CloseIcon, InstagramIcon, PhoneIcon, WhatsAppIcon } from "./Icons.jsx";
import { bookMessage, telUrl, viewUrl, whatsappUrl } from "../links.js";

const ANIM_MS = 220;
const CLOSE_MS = 300; // closing is a little slower and fades everything together, so it never looks abrupt
const CLOSE_EASE = "cubic-bezier(0.33, 0, 0.2, 1)";
const EASE = "cubic-bezier(0.25, 0.8, 0.25, 1)";
const BASE = "translate3d(0, -33.3333%, 0)"; // track holds [prev, current, next]; current sits in the middle
const AXIS_LOCK = 8; // px of movement before we decide whether this is a vertical swipe
const SWIPE_V = 50; // px to commit a next/previous swipe
const FLICK_V = 0.4; // px/ms: a quick flick commits even over a short distance
const FLICK_MIN = 14; // px: ...but not a mere twitch
const PRELOAD = [1, 2, 3, -1, -2]; // designs around the current one to keep decoded and ready

// Held at module level so preloaded images aren't garbage collected before the swipe needs them.
const preloaded = new Map();
function preload(url) {
  if (preloaded.has(url)) return;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  img.decode?.().catch(() => {});
  preloaded.set(url, img);
}
const WHEEL_COMMIT = 60; // px of two-finger / wheel scroll that commits a next/previous
const WHEEL_IDLE = 140; // ms without wheel events = the fingers lifted and momentum is over

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
function animateTo(el, styles, ms = ANIM_MS, ease = EASE) {
  el.style.transition = `transform ${ms}ms ${ease}, opacity ${ms}ms ${ease}`;
  Object.assign(el.style, styles);
  setTimeout(() => {
    el.style.transition = "none";
  }, ms + 20);
}

/**
 * Instagram-reels style viewer over the whole catalogue (loops forever).
 * Swipe up for next, down for previous (touch, mouse drag, trackpad two-finger scroll, wheel or arrow keys).
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

  const sheet = useRef(null);
  const track = useRef(null);
  const closeButton = useRef(null);
  const root = useRef(null);
  const gesture = useRef(null);
  const busy = useRef(false);
  const wheel = useRef({ acc: 0, locked: false, timer: 0 });
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

  // Warm (and decode) the photos a few swipes away so the next slide is never blank.
  useEffect(() => {
    PRELOAD.forEach((o) => {
      const d = designs[(index + o + total) % total];
      if (d) preload(viewUrl(d));
    });
  }, [index, designs, total]);

  const step = useCallback(
    (direction) => {
      if (busy.current) return;
      busy.current = true;
      animateTo(track.current, { transform: direction > 0 ? "translate3d(0, -66.6667%, 0)" : "translate3d(0, 0%, 0)" });
      setTimeout(() => onSelect(designs[(index + direction + total) % total].id), ANIM_MS);
    },
    [designs, index, total, onSelect]
  );

  const close = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    root.current?.classList.add("is-closing"); // fades the dim background and the buttons (CSS)
    animateTo(sheet.current, { transform: "translate3d(0, 18px, 0) scale(0.95)", opacity: "0" }, CLOSE_MS, CLOSE_EASE);
    setTimeout(onClose, CLOSE_MS);
  }, [onClose]);

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
    gesture.current = { x: e.clientX, y: e.clientY, axis: null, id: e.pointerId, t: e.timeStamp, lastY: e.clientY, lastT: e.timeStamp, vy: 0 };
  };

  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const mx = e.clientX - g.x;
    const my = e.clientY - g.y;
    if (!g.axis) {
      if (Math.hypot(mx, my) < AXIS_LOCK) return;
      if (Math.abs(mx) > Math.abs(my)) {
        gesture.current = null; // sideways drags do nothing
        return;
      }
      g.axis = "y";
      sheet.current.setPointerCapture?.(e.pointerId);
      track.current.style.transition = "none";
    }
    // Smoothed vertical velocity (px/ms) so a quick flick can commit without a long drag.
    const dt = e.timeStamp - g.lastT;
    if (dt > 0) g.vy = 0.7 * g.vy + 0.3 * ((e.clientY - g.lastY) / dt);
    g.lastY = e.clientY;
    g.lastT = e.timeStamp;
    track.current.style.transform = `translate3d(0, calc(-33.3333% + ${my}px), 0)`;
  };

  const settle = () => animateTo(track.current, { transform: BASE });

  const onPointerUp = (e) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!g.axis) return; // plain tap: let the click through
    suppressClick.current = true; // a drag must not also trigger the link under the finger
    setTimeout(() => (suppressClick.current = false), 0);
    const my = e.clientY - g.y;
    const flick = Math.abs(g.vy) > FLICK_V && Math.abs(my) > FLICK_MIN && Math.sign(g.vy) === Math.sign(my);
    if (Math.abs(my) > SWIPE_V || flick) step(my < 0 ? 1 : -1);
    else settle();
  };

  const onPointerCancel = () => {
    if (gesture.current?.axis) settle();
    gesture.current = null;
  };

  // Trackpad two-finger scroll / wheel: the card follows the fingers, then commits as soon as you've scrolled far
  // enough instead of waiting for the gesture to end. After a commit the momentum tail is ignored until it stops.
  const onWheel = (e) => {
    const w = wheel.current;
    clearTimeout(w.timer);
    w.timer = setTimeout(() => {
      const pending = w.acc;
      w.acc = 0;
      w.locked = false;
      if (pending && !busy.current) settle();
    }, WHEEL_IDLE);
    if (w.locked || busy.current) return;
    w.acc += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    if (Math.abs(w.acc) >= WHEEL_COMMIT) {
      const direction = w.acc > 0 ? 1 : -1;
      w.acc = 0;
      w.locked = true;
      step(direction);
      return;
    }
    track.current.style.transition = "none";
    track.current.style.transform = `translate3d(0, calc(-33.3333% - ${w.acc}px), 0)`;
  };

  return (
    <div className="reel" ref={root} role="dialog" aria-modal="true" aria-label={design.title} onClick={close}>
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
        <span>↓ Swipe down for previous</span>
      </p>
    </div>
  );
}
