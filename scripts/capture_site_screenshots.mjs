import { chromium } from "playwright";
import fs from "node:fs/promises";

const base = process.env.SITE_URL || "http://127.0.0.1:8080";
const shots = [
  ["home", "/"],
  ["foundation", "/evidence/"],
  ["P001", "/evidence/propositions/P001/"],
  ["P003", "/evidence/propositions/P003/"],
  ["P024", "/evidence/propositions/P024/"],
  ["F0162", "/evidence/facts/F0162/"],
  ["T002", "/evidence/tensions/T002/"],
  ["T022", "/evidence/tensions/T022/"],
  ["S001", "/evidence/propositions/S001/"],
  ["EUID", "/evidence/euids/N18-20180424-0054/"],
  ["C001", "/evidence/propositions/#C001"]
];
const viewports = [
  ["desktop", 1440, 1000],
  ["tablet", 900, 1100],
  ["mobile", 390, 844]
];
await fs.mkdir("screenshots", { recursive: true });
const browser = await chromium.launch();
for (const [view, width, height] of viewports) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  for (const [name, route] of shots) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.screenshot({ path: `screenshots/${name}-${view}.png`, fullPage: true });
  }
  await page.close();
}
await browser.close();
