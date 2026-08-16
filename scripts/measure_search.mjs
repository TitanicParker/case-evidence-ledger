import { chromium } from "playwright";
import fs from "node:fs/promises";

const base = process.env.SITE_URL || "http://127.0.0.1:8080";
const prefix = process.env.SITE_BASE_PATH || "/";
const root = `${base}${prefix === "/" ? "" : prefix.replace(/\/$/, "")}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

const navStart = performance.now();
await page.goto(`${root}/search/`, { waitUntil: "networkidle" });
const blankLoadMs = performance.now() - navStart;

async function timed(term) {
  const started = performance.now();
  await page.locator("#evidence-query").fill(term);
  await page.waitForFunction(() => {
    const text = document.querySelector("#result-count")?.textContent || "";
    return !/Searching|Enter a term/.test(text);
  }, null, { timeout: 15000 });
  const endToEndMs = performance.now() - started;
  const engineMs = await page.evaluate(() => window.__LEDGER_LAST_SEARCH_MS || null);
  return { term, end_to_end_ms: Math.round(endToEndMs), engine_ms: engineMs == null ? null : Math.round(engineMs * 10) / 10 };
}

const first = await timed("PRKN");
const second = await timed("Procyclidine");
const metrics = { base_path: prefix, blank_search_load_ms: Math.round(blankLoadMs), first_query: first, warm_query: second };
await fs.writeFile("search-metrics.json", JSON.stringify(metrics, null, 2));
console.log(JSON.stringify(metrics));
await browser.close();
