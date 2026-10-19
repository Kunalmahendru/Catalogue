import { useEffect, useRef, useState } from "react";
import { InstagramIcon, PhoneIcon, WhatsAppIcon } from "./Icons.jsx";
import { bookMessage, telUrl, whatsappUrl } from "../links.js";

/**
 * Floating contact pill: WhatsApp · Instagram · Call. Hidden at the top of the page (the hero has its own
 * buttons) and eases in once the visitor scrolls. The call icon opens a small popup with both numbers.
 */
export default function ContactPill({ site }) {
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const root = useRef(null);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.45);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!shown) setOpen(false);
  }, [shown]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !root.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copy = async (phone) => {
    try {
      await navigator.clipboard.writeText(`+91${phone}`);
      setCopied(phone);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      /* clipboard unavailable: the number is still tappable to call or save */
    }
  };

  return (
    <div className={`pill ${shown ? "is-shown" : ""}`} ref={root} role="group" aria-label="Contact us" inert={!shown}>
      {open && (
        <div className="pill__pop" role="dialog" aria-label="Call us">
          <p className="pill__pop-title">Call us</p>
          {site.phones.map((p) => (
            <div className="pill__num" key={p}>
              <a href={telUrl(p)}>
                <PhoneIcon width={18} height={18} />
                <span>+91-{p}</span>
              </a>
              <button type="button" onClick={() => copy(p)} aria-label={`Copy +91-${p}`}>
                {copied === p ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="pill__bar">
        <a className="pill__btn pill__btn--wa" href={whatsappUrl(site, bookMessage())} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" title="Chat on WhatsApp">
          <WhatsAppIcon />
        </a>
        <a className="pill__btn pill__btn--ig" href={site.instagram_url} target="_blank" rel="noreferrer" aria-label={`Instagram @${site.instagram}`} title="Instagram">
          <InstagramIcon />
        </a>
        <button type="button" className={`pill__btn pill__btn--call ${open ? "is-open" : ""}`} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Call us" title="Call us">
          <PhoneIcon />
        </button>
      </div>
    </div>
  );
}
