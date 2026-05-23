import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** Dev only: if `tree.json` / `rulers.json` exist at project root (e.g. ged_export default cwd), serve them before `public/` so the app’s default URLs pick up real data. */
function preferRootJsonDev(): Plugin {
  return {
    name: "prefer-root-json-dev",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0];
        if (pathname !== "/tree.json" && pathname !== "/rulers.json") {
          next();
          return;
        }
        const filePath = path.join(projectRoot, pathname.slice(1));
        if (!fs.existsSync(filePath)) {
          next();
          return;
        }
        res.setHeader("Content-Type", "application/json");
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  /** Dev: serve `public/` at `/tree.json`. Production (GitHub Pages): app lives under `/ancestory/`. */
  base: mode === "production" ? "/ancestory/" : "/",
  plugins: [react(), ...(mode !== "production" ? [preferRootJsonDev()] : [])],
  server: {
    fs: {
      allow: ["..", "/Users/tref/Desktop"],
    },
  },
}));
