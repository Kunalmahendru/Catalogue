import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // In dev, /api/* is forwarded to the FastAPI server.
    proxy: { "/api": "http://127.0.0.1:8010" },
  },
});
