import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchCatalogue } from "./supabase.js";
import { SITE as site } from "./site.js";
import StyleGallery from "./components/StyleGallery.jsx";
import bundled from "./catalogue.json"; // fallback copy if Supabase can't be reached
import DesignModal from "./components/DesignModal.jsx";
import ContactPill from "./components/ContactPill.jsx";
import Stats from "./components/Stats.jsx";
import Offer from "./components/Offer.jsx";
import About from "./components/About.jsx";
import { InstagramIcon, WhatsAppIcon } from "./components/Icons.jsx";
import { bookMessage, whatsappUrl } from "./links.js";

const designIdFromHash = () => {
  const m = window.location.hash.match(/^#\/d\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
};

export default function App() {
  const [data, setData] = useState(null); // { collections, designs } once loaded
  const [category, setCategory] = useState("All");
  const [openId, setOpenId] = useState(designIdFromHash);
  const [active, setActive] = useState(null); // which nav item matches the part of the page in view
  const heroRef = useRef(null);
  const coverRef = useRef(null);

  // Designs live in Supabase. If it is slow, unreachable or empty, show the bundled copy so the site never goes blank.
  useEffect(() => {
    let alive = true;
    fetchCatalogue()
      .then((remote) => (remote.designs.length ? remote : bundled))
      .catch(() => bundled)
      .then((value) => alive && setData(value));
    return () => {
      alive = false;
    };
  }, []);

  // Keep the URL in sync so a design can be shared as a link (#/d/pink-chrome).
  useEffect(() => {
    const onHash = () => setOpenId(designIdFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Scroll effects: (1) the hero stays pinned and tilts/fades as the rest of the page slides up over it,
  // (2) the nav highlights Designs / About depending on what is on screen.
  useEffect(() => {
    const hero = heroRef.current;
    const cover = coverRef.current;
    const nav = document.querySelector(".nav");
    let frame = 0;

    const pin = () => {
      // Pin the hero under the nav; if it is taller than the screen, pin its bottom edge so nothing is cut off.
      const top = Math.min(nav.offsetHeight, window.innerHeight - hero.offsetHeight);
      hero.style.top = `${top}px`;
    };

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const navH = nav.offsetHeight;
      const p = Math.min(1, Math.max(0, (vh - cover.getBoundingClientRect().top) / (vh - navH)));
      hero.style.setProperty("--p", p.toFixed(3));

      const line = vh * 0.4;
      const designs = document.getElementById("designs");
      const about = document.getElementById("about");
      const atBottom = vh + window.scrollY >= document.documentElement.scrollHeight - 8;
      const next = atBottom || about?.getBoundingClientRect().top <= line ? "about" : designs?.getBoundingClientRect().top <= line ? "designs" : null;
      setActive((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      pin();
      onScroll();
    };

    pin();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const observer = new ResizeObserver(onResize);
    observer.observe(hero);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const open = useCallback((d) => {
    window.location.hash = `/d/${encodeURIComponent(d.id)}`;
  }, []);
  const close = useCallback(() => {
    history.pushState("", document.title, window.location.pathname + window.location.search);
    setOpenId(null);
  }, []);

  const categories = useMemo(() => ["All", ...(data?.collections ?? []).map((c) => c.name)], [data]);
  const groups = useMemo(
    () => (data?.collections ?? []).map((c, index) => ({ ...c, index, designs: data.designs.filter((d) => d.category === c.name) })),
    [data]
  );
  const visibleGroups = category === "All" ? groups : groups.filter(g => g.name === category);
  // One looping sequence across every collection, in the order they appear on the page.
  const sequence = useMemo(() => groups.flatMap((g) => g.designs), [groups]);
  const openDesign = sequence.find((d) => d.id === openId);
  const select = useCallback((id) => {
    history.replaceState(null, "", `#/d/${encodeURIComponent(id)}`);
    setOpenId(id);
  }, []);

  return (
    <>
      <header className="nav">
        <a className="nav__brand" href="#top">
          nailsbyroops<span>_</span>
        </a>
        <nav>
          <a href="#designs" className={active === "designs" ? "is-active" : ""} aria-current={active === "designs" ? "true" : undefined}>
            Designs
          </a>
          <a href="#about" className={active === "about" ? "is-active" : ""} aria-current={active === "about" ? "true" : undefined}>
            About
          </a>
          {site && (
            <a href={whatsappUrl(site, bookMessage())} target="_blank" rel="noreferrer">
              Book
            </a>
          )}
          {site && (
            <a className="nav__ig" href={site.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram">
              <InstagramIcon />
            </a>
          )}
        </nav>
      </header>

      <main id="top">
        <section className="hero" ref={heroRef}>
          <div className="hero__blob hero__blob--a" />
          <div className="hero__blob hero__blob--b" />
          <div className="hero__bg" aria-hidden="true">
            <img src="/hero/bg-cards.webp" alt="" />
          </div>
          <svg className="brush-defs" aria-hidden="true" focusable="false">
            <filter id="brush-h" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.03 0.05" numOctaves="2" seed="7" result="wob" />
              <feDisplacementMap in="SourceGraphic" in2="wob" scale="7" xChannelSelector="R" yChannelSelector="G" result="rough" />
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.5" numOctaves="3" seed="11" result="bristle" />
              <feColorMatrix in="bristle" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3 0 0 0 -0.45" result="streaks" />
              <feComposite in="rough" in2="streaks" operator="in" result="brushed" />
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="16" result="grain" />
              <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.2 0 0 0 0.5" result="chalk" />
              <feComposite in="brushed" in2="chalk" operator="in" />
            </filter>
            <filter id="brush-v" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.03 0.05" numOctaves="2" seed="11" result="wob" />
              <feDisplacementMap in="SourceGraphic" in2="wob" scale="7" xChannelSelector="R" yChannelSelector="G" result="rough" />
              <feTurbulence type="fractalNoise" baseFrequency="0.5 0.012" numOctaves="3" seed="15" result="bristle" />
              <feColorMatrix in="bristle" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3 0 0 0 -0.45" result="streaks" />
              <feComposite in="rough" in2="streaks" operator="in" result="brushed" />
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="20" result="grain" />
              <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.2 0 0 0 0.5" result="chalk" />
              <feComposite in="brushed" in2="chalk" operator="in" />
            </filter>
          </svg>
          <div className="hero__collage">
            <div className="collage__item collage__item--a">
              <img src="/hero/photo-evil-eye.webp" alt="Press-on nails in royal blue and white with evil-eye and snake charms" loading="eager" />
            </div>
            <div className="collage__item collage__item--c">
              <img src="/hero/photo-polka.webp" alt="Brown polka dot and striped press-on nails" loading="eager" />
            </div>
            <div className="collage__item collage__item--b">
              <img src="/hero/photo-cherry.webp" alt="Glossy cherry red press-on nails with cherry and gold charms" loading="eager" />
            </div>
          </div>
          <p className="eyebrow eyebrow--tagline">✦ You love it, we nail it</p>
          <h1>
            Tiny canvases.
            <br />
            <em>Big mood.</em>
          </h1>
          <p className="hero__sub">Premium handmade press-ons in every style, from chrome to French to 3D charms. Custom designs and bulk orders welcome.</p>
          <div className="hero__cta">
            <a className="btn btn--primary" href="#designs">
              Browse designs
            </a>
            {site && (
              <a className="btn btn--ghost" href={whatsappUrl(site, bookMessage())} target="_blank" rel="noreferrer">
                <WhatsAppIcon /> Book now
              </a>
            )}
          </div>
        </section>

        <div className="cover" ref={coverRef}>
        {site && <Stats stats={site.stats} />}
        {site && <Offer site={site} />}

        <section className="catalogue" id="designs">
          <div className="section-head">
            <h2>The catalogue</h2>
            <p>Find your mood. Scroll a collection, tap a look.</p>
          </div>

          {data ? (
            <>
              <div className="chips" role="group" aria-label="Filter by style">
                {categories.map(c => (
                  <button key={c} aria-pressed={c === category} className={`chip ${c === category ? "chip--on" : ""}`} onClick={() => setCategory(c)}>{c}</button>
                ))}
              </div>
              <div className="collections">
                {visibleGroups.map(group => <StyleGallery key={group.name} group={group} onOpen={open} />)}
              </div>
            </>
          ) : (
            <div className="collections-skeleton" aria-busy="true" aria-label="Loading designs">
              {[0, 1, 2].map((i) => <div className="card card--skeleton" key={i} />)}
            </div>
          )}
        </section>

        <About site={site} />
        </div>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} nailsbyroops_</span>
        {site && (
          <a href={site.instagram_url} target="_blank" rel="noreferrer">
            @{site.instagram}
          </a>
        )}
      </footer>

      {site && <ContactPill site={site} />}

      {openDesign && <DesignModal designs={sequence} design={openDesign} site={site} onClose={close} onSelect={select} />}
    </>
  );
}
