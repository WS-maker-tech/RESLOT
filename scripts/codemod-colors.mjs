#!/usr/bin/env node
/**
 * codemod-colors.mjs
 *
 * Ersätter hårdkodade hex-färger med tokens från `@/lib/theme`.
 * Kör per fil — säkerställer att `C` är importerat innan replace.
 *
 * Skip:
 *   - mobile/src/lib/theme.ts (canonical source)
 *   - filer utan @/lib/theme import (manuellt fix krävs)
 *
 * Usage:
 *   node scripts/codemod-colors.mjs          # dry-run, visar diff-stats
 *   node scripts/codemod-colors.mjs --write  # skriv ändringar
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "mobile/src";
const SKIP_FILES = new Set(["mobile/src/lib/theme.ts"]);

// Mappning: hex (case-insensitive) → token-uttryck
const COLOR_MAP = {
  "#111827": "C.dark",
  "#FFFFFF": "C.white",
  "#ffffff": "C.white",
  "#fff": "C.white",
  "#7EC87A": "C.pistachio",
  "#7ec87a": "C.pistachio",
  "#6B7280": "C.textSecondary",
  "#6b7280": "C.textSecondary",
  "#FAFAF8": "C.bg",
  "#fafaf8": "C.bg",
  "#F59E0B": "C.warning",
  "#f59e0b": "C.warning",
  "#EF4444": "C.error",
  "#ef4444": "C.error",
  "#3B82F6": "C.info",
  "#3b82f6": "C.info",
  "#9CA3AF": "C.grayLight",
  "#9ca3af": "C.grayLight",
  "#22C55E": "C.successBright",
  "#22c55e": "C.successBright",
  "#C9A96E": "C.gold",
  "#c9a96e": "C.gold",
  "#DC2626": "C.danger",
  "#dc2626": "C.danger",
  "#F0F0EE": "C.bgInput",
  "#f0f0ee": "C.bgInput",
};

const WRITE = process.argv.includes("--write");

function walk(dir, out = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    if (entry === "node_modules" || entry === ".git" || entry.startsWith(".")) continue;
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(full);
  }
  return out;
}

function hasThemeImport(src) {
  return /from\s+["']@\/lib\/theme["']/.test(src) || /from\s+["']\.\.?\/.*\/theme["']/.test(src);
}

function importsC(src) {
  // Match destructure-import that includes C
  const m = src.match(/import\s*\{\s*([^}]+)\}\s*from\s*["'][^"']*theme["']/);
  if (!m) return false;
  const named = m[1].split(",").map((s) => s.trim().replace(/\s+as\s+\w+/i, ""));
  return named.includes("C");
}

function ensureCImport(src) {
  if (importsC(src)) return src;
  const m = src.match(/import\s*\{\s*([^}]+)\}\s*from\s*(["'][^"']*theme["'])/);
  if (m) {
    const inner = m[1].trim().replace(/,$/, "");
    return src.replace(m[0], `import { ${inner}, C } from ${m[2]}`);
  }
  return src;
}

let totalReplacements = 0;
const fileStats = [];

const files = walk(ROOT).filter((f) => !SKIP_FILES.has(f));

for (const file of files) {
  let src = readFileSync(file, "utf8");
  if (!hasThemeImport(src)) continue;

  let fileReplacements = 0;
  const before = src;

  for (const [hex, token] of Object.entries(COLOR_MAP)) {
    // Match `'#xxx'` and `"#xxx"` as standalone string literals
    const patterns = [
      new RegExp(`(['"])${hex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\1`, "g"),
    ];
    for (const re of patterns) {
      src = src.replace(re, (match) => {
        fileReplacements++;
        return token;
      });
    }
  }

  if (fileReplacements > 0) {
    src = ensureCImport(src);
    fileStats.push({ file: relative(".", file), count: fileReplacements });
    totalReplacements += fileReplacements;
    if (WRITE) writeFileSync(file, src, "utf8");
  }
}

console.log(`\n${WRITE ? "[written]" : "[dry-run]"} Total replacements: ${totalReplacements}`);
console.log(`Files touched: ${fileStats.length}`);
console.log("\nTop files by replacements:");
fileStats
  .sort((a, b) => b.count - a.count)
  .slice(0, 20)
  .forEach((s) => console.log(`  ${s.count.toString().padStart(3)} — ${s.file}`));
if (!WRITE) console.log("\nRun with --write to apply.");
