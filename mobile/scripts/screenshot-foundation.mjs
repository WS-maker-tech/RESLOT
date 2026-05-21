#!/usr/bin/env node
// Capture before/after screenshots för Reslot Visual Foundation v1.
//
// Usage:
//   node mobile/scripts/screenshot-foundation.mjs --mode=before
//   node mobile/scripts/screenshot-foundation.mjs --mode=after [--url=http://localhost:8081]
//
// Output: screenshots/{before,after}/{route-slug}.png
// Workflow:
//   1. git checkout main && cd mobile && bun install && bun run web    # :8081
//   2. node mobile/scripts/screenshot-foundation.mjs --mode=before
//   3. git checkout reslot/visual-foundation-v1 && bun run web
//   4. node mobile/scripts/screenshot-foundation.mjs --mode=after

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a) => a.replace(/^--/, "").split("="))
    .map(([k, v]) => [k, v ?? "true"]),
);
const mode = args.mode;
if (mode !== "before" && mode !== "after") {
  console.error("Usage: --mode=before|after [--url=http://localhost:8081]");
  process.exit(1);
}
const baseUrl = (args.url ?? "http://localhost:8081").replace(/\/$/, "");

const ROUTES = [
  { slug: "01-home", path: "/" },
  { slug: "02-submit", path: "/submit" },
  { slug: "03-credits", path: "/credits" },
  { slug: "04-settings", path: "/settings" },
  { slug: "05-help", path: "/help" },
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "..", "screenshots", mode);
await mkdir(outDir, { recursive: true });

console.log(`[screenshot-foundation] mode=${mode} url=${baseUrl} out=${outDir}`);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 3,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const page = await ctx.newPage();

for (const { slug, path } of ROUTES) {
  const url = baseUrl + path;
  process.stdout.write(`  ${slug}  ${url}  …  `);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
    // Splash-fade är ~600ms hold + 280ms fade — vänta 1.5s för säker capture.
    await page.waitForTimeout(1500);
    const file = resolve(outDir, `${slug}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log("✓");
  } catch (err) {
    console.log(`✗ ${err.message}`);
  }
}

await browser.close();
console.log(`\nDone. ${ROUTES.length} screenshots i ${outDir}`);
