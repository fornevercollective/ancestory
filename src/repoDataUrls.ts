/** GitHub browser links for source vs build output. */
export const GITHUB_PUBLIC_DIR =
  "https://github.com/fornevercollective/ancestory/tree/main/public";
export const GITHUB_DIST_DIR =
  "https://github.com/fornevercollective/ancestory/tree/main/dist";

/** Raw `main` branch JSON (CORS-friendly). 
 * We prefer the root tree.json (already committed, rich data) over the one in public/
 * so we can safely keep large personal exports out of the build artifact while still
 * offering a one-click "full rich demo" experience on the live site.
 */
export const RAW_GITHUB_TREE_MAIN =
  "https://raw.githubusercontent.com/fornevercollective/ancestory/main/tree.json";
export const RAW_GITHUB_RULERS_MAIN =
  "https://raw.githubusercontent.com/fornevercollective/ancestory/main/rulers.json";
