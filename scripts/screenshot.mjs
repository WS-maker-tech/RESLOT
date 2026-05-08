#!/usr/bin/env node
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ROUTES = JSON.parse(await fs.readFile(path.join(ROOT, "scripts/routes.json"), "utf8"));
const HOST = process.env.SCREENSHOT_HOST || ROUTES._meta.host;
const SUFFIX = (process.argv.includes("--suffix") ? process.argv[process.argv.indexOf("--suffix") + 1] : "after");
const ONLY_SLUG = process.argv.includes("--slug") ? process.argv[process.argv.indexOf("--slug") + 1] : null;
const SKIP_WEB = process.argv.includes("--no-web");

const OUT_DIR = path.join(ROOT, "mobile/screenshots/night-2026-05-08", SUFFIX);
await fs.mkdir(OUT_DIR, { recursive: true });

const targets = ONLY_SLUG ? ROUTES.routes.filter(r => r.slug === ONLY_SLUG) : ROUTES.routes;
if (targets.length === 0) { console.error("No routes matched."); process.exit(1); }

console.log(`[shot] host=${HOST} suffix=${SUFFIX} routes=${targets.length}`);

const browser = await chromium.launch();
const ctx = { mobile: ROUTES._meta.viewports.mobile, web: ROUTES._meta.viewports.web };

for (const r of targets) {
  for (const [vp, cfg] of Object.entries(ctx)) {
    if (vp === "web" && SKIP_WEB) continue;
    const file = path.join(OUT_DIR, `${String(r.n).padStart(2, "0")}-${r.slug}-${vp}.png`);
    const context = await browser.newContext({ viewport: { width: cfg.width, height: cfg.height }, deviceScaleFactor: cfg.deviceScaleFactor, isMobile: cfg.isMobile || false });
    const page = await context.newPage();
    const url = `${HOST}${r.path}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`  ok  ${vp.padEnd(6)} ${r.slug.padEnd(28)} → ${path.relative(ROOT, file)}`);
    } catch (e) {
      console.log(`  FAIL ${vp.padEnd(6)} ${r.slug.padEnd(28)} → ${e.message}`);
    } finally {
      await context.close();
    }
  }
}
await browser.close();
console.log(`[shot] done → ${path.relative(ROOT, OUT_DIR)}`);
