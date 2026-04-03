#!/usr/bin/env node

/**
 * Web Fetcher — Extracts design tokens from any website using Playwright.
 *
 * Usage:  node scripts/web-fetcher.mjs <url>
 * Output: Structured JSON with title, meta, colors, fonts, headlines, CTAs.
 */

import { chromium } from "playwright";

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/web-fetcher.mjs <url>");
  process.exit(1);
}

const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

async function fetchDesignTokens(targetUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });

  const page = await context.newPage();

  // Block heavy resources to speed up loading
  await page.route("**/*.{mp4,webm,ogg,avi,mov}", (route) => route.abort());

  try {
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    // Fallback — some sites never reach networkidle
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);
  }

  // Dismiss common cookie/consent banners
  for (const sel of [
    '[class*="cookie"] button',
    '[class*="consent"] button',
    '[id*="cookie"] button',
    'button:has-text("Accept")',
    'button:has-text("Acceptera")',
    'button:has-text("Got it")',
  ]) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1000 })) await btn.click();
    } catch {}
  }

  await page.waitForTimeout(1500);

  const result = await page.evaluate(() => {
    // --- Title ---
    const title = document.title || "";

    // --- Meta tags ---
    const metas = {};
    document.querySelectorAll("meta").forEach((m) => {
      const key = m.getAttribute("name") || m.getAttribute("property") || m.getAttribute("http-equiv");
      const val = m.getAttribute("content");
      if (key && val) metas[key] = val;
    });

    // --- Colors ---
    const colorSet = new Set();
    const colorProps = [
      "color",
      "backgroundColor",
      "borderColor",
      "borderTopColor",
      "borderBottomColor",
      "borderLeftColor",
      "borderRightColor",
      "outlineColor",
      "boxShadow",
    ];

    const rgbRe = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g;

    function rgbToHex(rgb) {
      const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (!m) return null;
      const [, r, g, b] = m.map(Number);
      if (r === 0 && g === 0 && b === 0) return null; // skip pure black (usually default)
      if (r === 255 && g === 255 && b === 255) return null; // skip pure white
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    // Sample visible elements (limit to avoid perf issues)
    const allEls = Array.from(document.querySelectorAll("body *")).slice(0, 2000);
    for (const el of allEls) {
      const cs = getComputedStyle(el);
      for (const prop of colorProps) {
        const val = cs[prop];
        if (!val || val === "transparent" || val === "rgba(0, 0, 0, 0)") continue;
        const matches = val.match(rgbRe);
        if (matches) {
          for (const m of matches) {
            const hex = rgbToHex(m);
            if (hex) colorSet.add(hex);
          }
        }
      }
    }

    // Also extract CSS custom properties from :root
    const rootStyles = getComputedStyle(document.documentElement);
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      if (prop.startsWith("--")) {
        const val = rootStyles.getPropertyValue(prop).trim();
        const matches = val.match(rgbRe);
        if (matches) {
          for (const m of matches) {
            const hex = rgbToHex(m);
            if (hex) colorSet.add(hex);
          }
        }
        // Also handle hex values directly in custom properties
        if (/^#[0-9a-fA-F]{3,8}$/.test(val)) {
          colorSet.add(val.toLowerCase());
        }
      }
    }

    // --- Fonts ---
    const fontSet = new Set();
    for (const el of allEls) {
      const ff = getComputedStyle(el).fontFamily;
      if (ff) {
        // Split font stack and take first (primary) font
        const primary = ff.split(",")[0].replace(/['"]/g, "").trim();
        if (primary && !["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"].includes(primary)) {
          fontSet.add(primary);
        }
      }
    }

    // --- Headlines / Hero text ---
    const headlines = [];
    const headingEls = document.querySelectorAll("h1, h2, h3, [class*='hero'] *, [class*='Hero'] *");
    const seen = new Set();
    headingEls.forEach((el) => {
      const text = el.textContent?.trim().replace(/\s+/g, " ");
      if (text && text.length > 2 && text.length < 300 && !seen.has(text)) {
        seen.add(text);
        const cs = getComputedStyle(el);
        headlines.push({
          tag: el.tagName.toLowerCase(),
          text,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          color: cs.color,
        });
      }
    });

    // --- CTAs ---
    const ctas = [];
    const ctaEls = document.querySelectorAll(
      'a[class*="btn"], a[class*="Btn"], a[class*="button"], a[class*="Button"], a[class*="cta"], a[class*="CTA"], ' +
      'button:not([class*="cookie"]):not([class*="consent"]), ' +
      '[role="button"], [class*="cta"], [class*="CTA"]'
    );
    const ctaSeen = new Set();
    ctaEls.forEach((el) => {
      const text = el.textContent?.trim().replace(/\s+/g, " ");
      if (text && text.length > 1 && text.length < 100 && !ctaSeen.has(text)) {
        ctaSeen.add(text);
        const cs = getComputedStyle(el);
        ctas.push({
          text,
          tag: el.tagName.toLowerCase(),
          backgroundColor: cs.backgroundColor,
          color: cs.color,
          borderRadius: cs.borderRadius,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
        });
      }
    });

    // --- Favicon ---
    const faviconEl = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    const favicon = faviconEl ? faviconEl.getAttribute("href") : null;

    return {
      title,
      favicon,
      meta: metas,
      colors: [...colorSet].sort(),
      fonts: [...fontSet].sort(),
      headlines: headlines.slice(0, 20),
      ctas: ctas.slice(0, 15),
    };
  });

  await browser.close();
  return result;
}

console.error(`Fetching ${normalizedUrl} ...`);

try {
  const data = await fetchDesignTokens(normalizedUrl);
  const output = { url: normalizedUrl, fetchedAt: new Date().toISOString(), ...data };
  console.log(JSON.stringify(output, null, 2));
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
