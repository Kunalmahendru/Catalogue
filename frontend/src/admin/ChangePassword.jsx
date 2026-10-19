import { useEffect, useState } from "react";
import { supabase } from "./client.js";

export default function ChangePassword({ onClose }) {
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState({ kind: "", text: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return setMsg({ kind: "error", text: "Use at least 8 characters." });
    if (pw !== again) return setMsg({ kind: "error", text: "The two passwords don't match." });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg({ kind: "error", text: error.message });
    setMsg({ kind: "ok", text: "Password changed. Use it next time you sign in." });
    setPw("");
    setAgain("");
  };

  return (
    <div className="adm-modal" role="dialog" aria-modal="true" aria-label="Change password" onClick={onClose}>
      <form className="adm-modal__box adm-modal__box--small adm-form" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>Change password</h2>
          <button type="button" className="adm-icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <label>
          New password
          <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        </label>
        <label>
          Type it again
          <input type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
        </label>
        {msg.text && <p className={msg.kind === "ok" ? "adm-ok" : "adm-error"}>{msg.text}</p>}
        <button className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? "Saving…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}
