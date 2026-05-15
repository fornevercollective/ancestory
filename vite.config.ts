import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  /** Dev: serve `public/` at `/tree.json`. Production (GitHub Pages): app lives under `/ancestory/`. */
  base: mode === "production" ? "/ancestory/" : "/",
  plugins: [react()],
  server: {
    fs: {
      allow: ["..", "/Users/tref/Desktop"],
    },
  },
}));
