import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

// /admin (edit the site) and /stats (visit and click numbers) share one lazy chunk, so visitors never download it.
const Admin = lazy(() => import("./admin/AdminApp.jsx"));
const path = window.location.pathname;
const view = /^\/admin\/?$/.test(path) ? "editor" : /^\/stats\/?$/.test(path) ? "stats" : null;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {view ? (
      <Suspense fallback={null}>
        <Admin view={view} />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>
);
