import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSite } from "./api.js";
import StyleGallery from "./components/StyleGallery.jsx";
import catalogue from "./catalogue.json";
import DesignModal from "./components/DesignModal.jsx";
import ContactPill from "./components/ContactPill.jsx";
import Stats from "./components/Stats.jsx";
import Offer from "./components/Offer.jsx";
import { InstagramIcon, WhatsAppIcon } from "./components/Icons.jsx";
import { bookMessage, whatsappUrl } from "./links.js";

const designIdFromHash = () => {
  const m = window.location.hash.match(/^#\/d\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
};

export default function App() {
  const [site, setSite] = useState(null);
  const designs = catalogue.designs;
  const [category, setCategory] = useState("All");
  const [openId, setOpenId] = useState(designIdFromHash);

  const load = useCallback(() => {
    fetchSite().then(setSite).catch(() => setSite(null));
  }, []);

  useEffect(load, [load]);

  // Keep the URL in sync so a design can be shared as a link (#/d/pink-chrome).
  useEffect(() => {
    const onHash = () => setOpenId(designIdFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const open = useCallback((d) => {
    window.location.hash = `/d/${encodeURIComponent(d.id)}`;
  }, []);
  const close = useCallback(() => {
    history.pushState("", document.title, window.location.pathname + window.location.search);
    setOpenId(null);
  }, []);

  const categories = ["All", ...catalogue.collections.map((c) => c.name)];
  const groups = useMemo(() => catalogue.collections.map((c, index) => ({ ...c, index, designs: designs.filter(d => d.category === c.name) })), [designs]);
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
          <a href="#designs">Designs</a>
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
        <section className="hero">
          <div className="hero__blob hero__blob--a" />
          <div className="hero__blob hero__blob--b" />
          <div className="hero__bg" aria-hidden="true">
            <img src="/hero/bg-cards.jpg" alt="" />
          </div>
          <div className="hero__collage">
            <div className="collage__item collage__item--a">
              <img src="/hero/photo-evil-eye.jpg" alt="Press-on nails in royal blue and white with evil-eye and snake charms" loading="eager" />
            </div>
            <div className="collage__item collage__item--c">
              <img src="/hero/photo-polka.jpg" alt="Brown polka dot and striped press-on nails" loading="eager" />
            </div>
            <div className="collage__item collage__item--b">
              <img src="/hero/photo-cherry.jpg" alt="Glossy cherry red press-on nails with cherry and gold charms" loading="eager" />
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

        {site && <Stats stats={site.stats} />}
        {site && <Offer site={site} />}

        <section className="catalogue" id="designs">
          <div className="section-head">
            <h2>The catalogue</h2>
            <p>Find your mood. Scroll a collection, tap a look.</p>
          </div>

          <div className="chips" role="group" aria-label="Filter by style">
            {categories.map(c => (
              <button key={c} aria-pressed={c === category} className={`chip ${c === category ? "chip--on" : ""}`} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
          <div className="collections">
            {visibleGroups.map(group => <StyleGallery key={group.name} group={group} onOpen={open} />)}
          </div>
        </section>

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
