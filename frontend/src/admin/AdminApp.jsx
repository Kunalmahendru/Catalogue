import { useEffect, useState } from "react";
import { configured, supabase } from "./client.js";
import Editor from "./Editor.jsx";
import Stats from "./Stats.jsx";
import { toEmail, toId } from "./ids.js";
import "./admin.css";

function Shell({ children }) {
  return (
    <div className="adm-center">
      <div className="adm-card">
        <p className="adm-brand">
          nailsbyroops<span>_</span> <small>admin</small>
        </p>
        {children}
      </div>
    </div>
  );
}

function Login() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email: toEmail(id), password });
    if (err) setError(err.message);
    setBusy(false);
  };

  return (
    <Shell>
      <h1>Sign in</h1>
      <form onSubmit={submit} className="adm-form">
        <label>
          ID
          <input type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck="false" value={id} onChange={(e) => setId(e.target.value)} required autoFocus />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="adm-error">{/invalid login/i.test(error) ? "Wrong ID or password." : error}</p>}
        <button className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Shell>
  );
}

function Gate({ session, view }) {
  const [state, setState] = useState("checking"); // checking | ok | denied | {error}

  useEffect(() => {
    let alive = true;
    supabase.rpc("is_admin").then(({ data, error }) => {
      if (!alive) return;
      if (error) setState({ error: error.message });
      else setState(data ? "ok" : "denied");
    });
    return () => {
      alive = false;
    };
  }, [session.user.id]);

  if (state === "ok") return view === "stats" ? <Stats email={session.user.email} /> : <Editor email={session.user.email} />;
  return (
    <Shell>
      {state === "checking" && <p className="adm-muted">Checking access…</p>}
      {state === "denied" && (
        <>
          <h1>No access</h1>
          <p>
            <b>{toId(session.user.email)}</b> isn't on the admin list.
          </p>
        </>
      )}
      {state.error && (
        <>
          <h1>Admin isn't set up yet</h1>
          <p className="adm-error">{state.error}</p>
          <p className="adm-muted">Run backend/supabase/admin.sql in the Supabase SQL Editor.</p>
        </>
      )}
      {state !== "checking" && (
        <button className="adm-btn" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      )}
    </Shell>
  );
}

export default function AdminApp({ view = "editor" }) {
  const [session, setSession] = useState(undefined); // undefined = still loading, null = signed out

  useEffect(() => {
    document.title = view === "stats" ? "Stats · nailsbyroops_" : "Admin · nailsbyroops_";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      data.subscription.unsubscribe();
      meta.remove();
    };
  }, []);

  if (!configured)
    return (
      <Shell>
        <h1>Not configured</h1>
        <p className="adm-error">VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are missing.</p>
      </Shell>
    );
  if (session === undefined)
    return (
      <Shell>
        <p className="adm-muted">Loading…</p>
      </Shell>
    );
  if (!session) return <Login />;
  return <Gate session={session} view={view} />;
}
