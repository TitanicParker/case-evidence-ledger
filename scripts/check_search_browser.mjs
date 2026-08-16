import { chromium } from "playwright";

const base = process.env.SITE_URL || "http://127.0.0.1:8080";
const prefix = process.env.SITE_BASE_PATH || "/";
const path = value => `${base}${prefix === "/" ? "" : prefix.replace(/\/$/, "")}${value}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

async function openSearch(query = "") {
  await page.goto(path(`/search/${query ? `?q=${encodeURIComponent(query)}` : ""}`), { waitUntil: "networkidle" });
}
async function waitResults() {
  await page.waitForFunction(() => {
    const text = document.querySelector("#result-count")?.textContent || "";
    return !/Searching|Enter a term/.test(text);
  }, null, { timeout: 15000 });
}
async function query(term) {
  await openSearch(term);
  await waitResults();
  return page.locator("#search-results .search-result");
}

await openSearch();
assert(await page.locator("h1").textContent() === "Evidence Search", "blank Search landing failed");
assert(await page.locator('link[href$="/assets/styles.css"]').count() === 1, "base stylesheet missing");
assert(await page.locator('link[href$="/assets/search.css"]').count() === 1, "search stylesheet missing");

for (const [id, expected] of [
  ["P024", "/evidence/propositions/P024/"],
  ["F0162", "/evidence/facts/F0162/"],
  ["T022", "/evidence/tensions/T022/"],
  ["N18-20180424-0054", "/evidence/euids/N18-20180424-0054/"],
]) {
  await openSearch();
  await page.locator("#evidence-query").fill(` ${id.toLowerCase()} `);
  const expectedUrl = path(expected);
  await Promise.all([
    page.waitForURL(url => url.pathname.endsWith(expected), { waitUntil: "networkidle" }),
    page.locator("#search-form").evaluate(form => form.requestSubmit()),
  ]);
  assert(page.url().startsWith(expectedUrl), `exact Enter failed for ${id}: ${page.url()}`);
}

await openSearch("C001");
await waitResults();
const quick = page.locator("#exact-jump a");
assert(await quick.count() === 1, "C001 quick jump missing");
assert((await quick.getAttribute("href"))?.endsWith("/evidence/propositions/#C001"), "C001 did not resolve to collection anchor");

await openSearch("F9999");
await waitResults();
assert((await page.locator("#search-status").textContent()).includes("No controlled object with that identifier"), "unknown ID state is not explicit");
assert(await page.locator("#search-results .search-result").count() === 0, "unknown ID was fuzzily returned as evidence");

for (const term of ["Not clear", "PRKN", "Procyclidine", "OFF", "Podiatry"]) {
  const results = await query(term);
  assert(await results.count() > 0, `no discovery results for ${term}`);
  const first = results.first();
  assert(await first.locator(".result-type").count() === 1, `result type missing for ${term}`);
  assert(await first.locator(".match-context").count() === 1, `field context missing for ${term}`);
  const href = await first.locator("h3 a").getAttribute("href");
  assert(Boolean(href) && href.startsWith(prefix), `result target not base-prefixed for ${term}: ${href}`);
}

const reconciliation = await query("possible reconciliation");
if (await reconciliation.count()) {
  const texts = await reconciliation.locator(".match-context").allTextContents();
  assert(texts.some(text => /Possible Reconciliation/i.test(text)) || texts.every(text => /Matched in/.test(text)), "reconciliation context was flattened");
}

await openSearch("PRKN");
await page.locator('input[value="source"]').uncheck();
await page.locator('input[value="fact"]').uncheck();
await page.locator('input[value="tension"]').uncheck();
await page.waitForTimeout(800);
await waitResults();
const types = await page.locator("#search-results .result-type").allTextContents();
assert(types.every(t => t.includes("PROPOSITION")), `filtered results leaked other layers: ${types.join(", ")}`);
assert(new URL(page.url()).searchParams.getAll("type").includes("proposition"), "filter state is not shareable in URL");

await query("definitely-no-controlled-evidence-zzqxy");
assert((await page.locator("#search-status").textContent()).includes("No matching controlled evidence found"), "zero-result state missing");

await page.goto(path("/evidence/"), { waitUntil: "networkidle" });
for (const selector of ['a[href*="/search/"]','a[href*="/case-evidence-ledger_timeline.html"]','a[href*="/method/"]']) {
  const href = await page.locator(selector).first().getAttribute("href");
  assert(Boolean(href) && href.startsWith(prefix), `Foundation navigation not base-prefixed: ${href}`);
}
await page.goto(path("/evidence/propositions/P024/"), { waitUntil: "networkidle" });
assert((await page.locator("body").textContent()).includes("P024"), "P024 failed to load");
await page.goto(path("/evidence/facts/F0162/"), { waitUntil: "networkidle" });
assert((await page.locator("body").textContent()).includes("F0162"), "F0162 failed to load");
await page.goto(path("/evidence/tensions/T022/"), { waitUntil: "networkidle" });
assert((await page.locator("body").textContent()).includes("T022"), "T022 failed to load");
await page.goto(path("/evidence/euids/N18-20180424-0054/"), { waitUntil: "networkidle" });
assert((await page.locator("body").textContent()).includes("N18-20180424-0054"), "representative EUID failed to load");

await browser.close();
if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}
console.log(`SEARCH BROWSER CHECK PASSED at ${base}${prefix}`);
