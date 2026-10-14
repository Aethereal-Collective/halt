// Builds the CWS upload zip from the tagged commit, never from the working tree (SPEC §7 supply chain).
// Run: git tag v<manifest version> && node scripts/release.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const { version } = JSON.parse(readFileSync(new URL("../extension/manifest.json", import.meta.url)));
const tag = `v${version}`;

if (git("status", "--porcelain")) throw new Error("Working tree is dirty; commit or stash first.");
if (git("rev-parse", `${tag}^{commit}`) !== git("rev-parse", "HEAD")) throw new Error(`HEAD is not tagged ${tag}.`);

mkdirSync("dist", { recursive: true });
const out = `dist/aethereal-shield-${version}.zip`;
git("archive", "--format=zip", "-o", out, `${tag}:extension`);
console.log(out);
