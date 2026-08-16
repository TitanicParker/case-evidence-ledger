import { chromium } from "playwright";
import fs from "node:fs/promises";

const base = process.env.SITE_URL || "http://127.0.0.1:8080";
const prefix = process.env.SITE_BASE_PATH || "/";
const url = q => `${base}${prefix === "/" ? "" : prefix.replace(/\/$/, "")}/search/${q ? `?q=${encodeURIComponent(q)}` : ""}`;
const states = [
  ["blank", ""],
  ["P024", "P024"],
  ["not-clear", "Not clear"],
  ["PRKN", "PRKN"],
  ["Procyclidine", "Procyclidine"],
  ["OFF", "OFF"],
  ["zero", "definitely-no-controlled-evidence-zzqxy"],
];
const viewports = [["desktop",1440,1000],["tablet",900,1100],["mobile",390,844]];
await fs.mkdir("screenshots-search", { recursive: true });
const browser = await chromium.launch();
for (const [view,width,height] of viewports) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  for (const [name, query] of states) {
    await page.goto(url(query), { waitUntil: "networkidle" });
    if (query) await page.waitForFunction(() => !/Searching/.test(document.querySelector('#result-count')?.textContent || ''), null, { timeout: 15000 });
    await page.screenshot({ path: `screenshots-search/${name}-${view}.png`, fullPage: true });
  }
  await page.goto(url("PRKN"), { waitUntil: "networkidle" });
  await page.locator('input[value="source"]').uncheck();
  await page.locator('input[value="fact"]').uncheck();
  await page.locator('input[value="tension"]').uncheck();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `screenshots-search/filtered-${view}.png`, fullPage: true });
  await page.close();
}
await browser.close();
