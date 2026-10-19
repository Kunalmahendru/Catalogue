import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

// The admin page is its own chunk, so visitors to the public site never download it.
const Admin = lazy(() => import("./admin/AdminApp.jsx"));
const isAdmin = /^\/admin\/?$/.test(window.location.pathname);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>
);
