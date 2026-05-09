#!/usr/bin/env node
const HOST = process.env.SCREENSHOT_HOST || "http://localhost:8081";
const TIMEOUT_MS = Number(process.env.WAIT_TIMEOUT_MS || 90000);
const start = Date.now();

while (Date.now() - start < TIMEOUT_MS) {
  try {
    const res = await fetch(HOST, { method: "GET" });
    if (res.ok) {
      const text = await res.text();
      if (text.includes("<html") || text.includes("<!DOCTYPE")) {
        console.log(`[wait] ready @ ${HOST} (${Date.now() - start}ms)`);
        process.exit(0);
      }
    }
  } catch (_) {}
  await new Promise(r => setTimeout(r, 1500));
}
console.error(`[wait] TIMEOUT after ${TIMEOUT_MS}ms — ${HOST} not responding`);
process.exit(1);
