import { useCallback, useEffect, useState } from "react";
import { photoUrl, supabase } from "./client.js";
import { toId } from "./ids.js";

const WINDOWS = [
  ["hour", "Last hour"],
  ["day", "Last 24 hours"],
  ["week", "Last 7 days"],
  ["month", "Last 30 days"],
  ["all", "All time"],
];
const CHANNELS = [
  ["whatsapp", "WhatsApp clicks"],
  ["instagram", "Instagram clicks"],
  ["call", "Call taps"],
];
const AREAS = { pill: "Floating buttons", viewer: "Design viewer", nav: "Top bar", hero: "Header", quote: "Get a quote", about: "About", footer: "Footer", page: "Elsewhere" };
const num = (n) => Number(n || 0).toLocaleString("en-IN");
const REFRESH_MS = 30000;

function Hourly({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.visits));
  return (
    <div className="st-bars" role="img" aria-label="Visits per hour over the last 24 hours">
      {rows.map((r) => {
        const d = new Date(r.hour);
        return (
          <div className="st-bar" key={r.hour} title={`${d.toLocaleTimeString([], { hour: "numeric" })}: ${r.visits} visit${r.visits === 1 ? "" : "s"}`}>
            <span style={{ height: `${Math.max(r.visits ? 6 : 2, (r.visits / max) * 100)}%` }} className={r.visits ? "" : "is-zero"} />
            <small>{d.getHours() % 6 === 0 ? d.toLocaleTimeString([], { hour: "numeric" }).toLowerCase() : ""}</small>
          </div>
        );
      })}
    </div>
  );
}

export default function Stats({ email }) {
  const [stats, setStats] = useState(null);
  const [designs, setDesigns] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [skipMine, setSkipMine] = useState(() => {
    try {
      return Boolean(localStorage.getItem("nbr_notrack"));
    } catch {
      return false;
    }
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.rpc("get_stats");
    setLoading(false);
    if (err) {
      setError(/get_stats|schema cache|does not exist/i.test(err.message) ? "setup" : err.message);
      return;
    }
    setError("");
    setStats(data);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => !document.hidden && load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    supabase
      .from("designs")
      .select("id,title,image")
      .then(({ data }) => setDesigns(Object.fromEntries((data || []).map((d) => [d.id, d]))));
  }, []);

  const toggleSkip = (on) => {
    setSkipMine(on);
    try {
      on ? localStorage.setItem("nbr_notrack", "1") : localStorage.removeItem("nbr_notrack");
    } catch {
      /* private mode: switch only lasts for this page */
    }
  };

  const w = stats?.windows;
  const updated = stats ? new Date(stats.generated_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";

  return (
    <div className="adm st">
      <header className="adm-top">
        <div className="adm-top__row">
          <p className="adm-brand">
            nailsbyroops<span>_</span> <small>stats</small>
          </p>
          <div className="adm-top__actions">
            <button className="adm-btn adm-btn--small" onClick={load} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <a className="adm-btn adm-btn--small" href="/admin">
              Edit site
            </a>
            <a className="adm-btn adm-btn--small" href="/" target="_blank" rel="noreferrer">
              View site ↗
            </a>
            <button className="adm-btn adm-btn--small" onClick={() => supabase.auth.signOut()} title={`Signed in as ${toId(email)}`}>
              Sign out ({toId(email)})
            </button>
          </div>
        </div>
      </header>

      <main className="st-main">
        {error === "setup" && (
          <div className="adm-card st-note">
            <h1>Stats aren't set up yet</h1>
            <p className="adm-muted">Run backend/supabase/analytics.sql in the Supabase SQL Editor, then refresh.</p>
          </div>
        )}
        {error && error !== "setup" && <p className="adm-error">{error}</p>}
        {!stats && !error && <p className="adm-muted">Loading…</p>}

        {stats && (
          <>
            <p className="adm-muted st-updated">Updated {updated} · refreshes every 30 seconds</p>

            <section aria-labelledby="st-visits">
              <h2 id="st-visits">Visits</h2>
              <div className="st-grid">
                {WINDOWS.map(([key, label]) => (
                  <div className="st-card" key={key}>
                    <span className="st-label">{label}</span>
                    <b className="st-big">{num(w[key].visits)}</b>
                    <span className="st-sub">{num(w[key].visitors)} unique visitor{w[key].visitors === 1 ? "" : "s"}</span>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="st-clicks">
              <h2 id="st-clicks">Clicks</h2>
              <div className="st-table-wrap">
                <table className="st-table">
                  <thead>
                    <tr>
                      <th></th>
                      {WINDOWS.map(([key, label]) => (
                        <th key={key}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CHANNELS.map(([ch, label]) => (
                      <tr key={ch}>
                        <th scope="row">{label}</th>
                        {WINDOWS.map(([key]) => (
                          <td key={key}>{num(w[key][ch])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="st-hourly">
              <h2 id="st-hourly">Visits by hour · last 24 hours</h2>
              <div className="st-panel">
                <Hourly rows={stats.hourly} />
              </div>
            </section>

            <div className="st-two">
              <section aria-labelledby="st-designs">
                <h2 id="st-designs">Most booked designs · 30 days</h2>
                <div className="st-panel">
                  {stats.top_designs.length === 0 && <p className="adm-muted">No “Book this look” clicks yet.</p>}
                  <ol className="st-list">
                    {stats.top_designs.map((d) => {
                      const info = designs[d.design];
                      return (
                        <li key={d.design}>
                          {info ? <img src={photoUrl("thumbs", info.image)} alt="" width="44" height="55" /> : <span className="st-ph" />}
                          <span className="st-name">{info?.title || d.design}</span>
                          <b>{num(d.clicks)}</b>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </section>

              <section aria-labelledby="st-sources">
                <h2 id="st-sources">Where visitors came from · 30 days</h2>
                <div className="st-panel">
                  {stats.sources.length === 0 && <p className="adm-muted">No visits yet.</p>}
                  <ol className="st-list">
                    {stats.sources.map((s) => (
                      <li key={s.source}>
                        <span className="st-name">{s.source === "direct" ? "Direct / link shared in a chat" : s.source}</span>
                        <b>{num(s.visits)}</b>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            </div>
          </>
        )}

        <section className="st-panel st-own">
          <label className="adm-check">
            <input type="checkbox" checked={skipMine} onChange={(e) => toggleSkip(e.target.checked)} /> Don't count my own visits and clicks on this device
          </label>
          <p className="adm-muted">Tick this on your own phone and laptop so testing your site doesn't inflate the numbers. Visitors are counted anonymously (a random id, no name or IP). A visit is one session, so refreshing doesn't add more.</p>
        </section>
      </main>
    </div>
  );
}
