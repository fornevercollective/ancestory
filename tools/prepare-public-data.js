#!/usr/bin/env node
/**
 * Smart data preparation for Ancestory builds.
 *
 * Goals:
 * - Never force large personal tree.json into the committed public/ folder.
 * - Ensure `npm run build` (local + CI) always produces a site with rich data.
 * - Works great for GitHub Pages deploys.
 *
 * Strategy:
 * 1. If a large rich tree.json exists at the project root → copy it to public/.
 * 2. Otherwise, download the latest versions from the repo's raw root URLs.
 * 3. Same for rulers.json.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");

const ROOT_TREE = path.join(ROOT, "tree.json");
const ROOT_RULERS = path.join(ROOT, "rulers.json");

const PUBLIC_TREE = path.join(PUBLIC_DIR, "tree.json");
const PUBLIC_RULERS = path.join(PUBLIC_DIR, "rulers.json");

const RAW_TREE_URL = "https://raw.githubusercontent.com/fornevercollective/ancestory/main/tree.json";
const RAW_RULERS_URL = "https://raw.githubusercontent.com/fornevercollective/ancestory/main/rulers.json";

function isLargeRichFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  // Consider anything over ~80kB as "real data" (the fixture is tiny)
  return stat.size > 80 * 1024;
}

function copyIfBetter(src, dest, label) {
  if (isLargeRichFile(src)) {
    fs.copyFileSync(src, dest);
    const size = (fs.statSync(dest).size / 1024 / 1024).toFixed(2);
    console.log(`✓ Prepared ${label} from root (${size} MB)`);
    return true;
  }
  return false;
}

function download(url, dest, label) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`Failed to download ${label}: HTTP ${response.statusCode}`));
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        const size = (fs.statSync(dest).size / 1024 / 1024).toFixed(2);
        console.log(`✓ Downloaded ${label} from GitHub raw (${size} MB)`);
        resolve();
      });
    }).on("error", (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log("Preparing Ancestory data for build...");

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  let treeReady = copyIfBetter(ROOT_TREE, PUBLIC_TREE, "tree.json");
  let rulersReady = copyIfBetter(ROOT_RULERS, PUBLIC_RULERS, "rulers.json");

  if (!treeReady) {
    console.log("Root tree.json not found or too small — downloading latest rich version...");
    try {
      await download(RAW_TREE_URL, PUBLIC_TREE, "tree.json");
      treeReady = true;
    } catch (e) {
      console.warn("⚠ Could not download tree.json:", e.message);
    }
  }

  if (!rulersReady) {
    console.log("Root rulers.json not found or too small — downloading latest version...");
    try {
      await download(RAW_RULERS_URL, PUBLIC_RULERS, "rulers.json");
      rulersReady = true;
    } catch (e) {
      console.warn("⚠ Could not download rulers.json:", e.message);
    }
  }

  if (treeReady && rulersReady) {
    console.log("✅ Data preparation complete. Build will include rich demo data.\n");
  } else {
    console.warn("⚠ Data preparation finished with limited data. The live site may use the minimal fixture.\n");
  }
}

main().catch((err) => {
  console.error("Data preparation failed:", err);
  process.exit(1);
});
