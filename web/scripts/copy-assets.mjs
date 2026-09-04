import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(webRoot, "..");
const assets = resolve(repoRoot, "assets");

if (!existsSync(assets)) {
  console.warn("copy-assets: ../assets not found, skip");
  process.exit(0);
}

const styles = resolve(webRoot, "src/styles");
mkdirSync(styles, { recursive: true });
for (const file of [
  "simplesocial-tokens.css",
  "theme.css",
  "simplesocial-overrides.css",
]) {
  cpSync(resolve(assets, file), resolve(styles, file));
}

const pub = resolve(webRoot, "public/assets");
mkdirSync(pub, { recursive: true });
cpSync(resolve(assets, "logo.svg"), resolve(pub, "logo.svg"));
cpSync(resolve(assets, "actors"), resolve(pub, "actors"), { recursive: true });
if (existsSync(resolve(assets, "castings"))) {
  cpSync(resolve(assets, "castings"), resolve(pub, "castings"), { recursive: true });
}
if (existsSync(resolve(assets, "ads"))) {
  cpSync(resolve(assets, "ads"), resolve(pub, "ads"), { recursive: true });
}
if (existsSync(resolve(assets, "figma"))) {
  cpSync(resolve(assets, "figma"), resolve(pub, "figma"), { recursive: true });
}

console.log("copy-assets: tokens, theme, actors, figma → web/");
