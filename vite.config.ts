import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/ancestory/",
  plugins: [react()],
  server: {
    fs: {
      allow: ["..", "/Users/tref/Desktop"],
    },
  },
});
