const basePath = document.body.dataset.basePath || "/";
const withBase = value => {
  const path = String(value || "/");
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("#")) return path;
  const clean = path.replace(/^\/+/, "");
  return basePath === "/" ? `/${clean}` : `${basePath}${clean}`;
};

const form = document.querySelector("#search-form");
const input = document.querySelector("#evidence-query");
const results = document.querySelector("#search-results");
const count = document.querySelector("#result-count");
const status = document.querySelector("#search-status");
const exactJump = document.querySelector("#exact-jump");
const filterBox = document.querySelector("#type-filters");
const defaultTypes = ["source", "fact", "tension", "proposition"];
const labels = {
  source: "SOURCE / EUID",
  fact: "CONTROLLED FACT",
  tension: "EVIDENTIAL TENSION",
  proposition: "CONTROLLED PROPOSITION",
  control: "CONTROL RULE"
};
let idMap = {};
let pagefindPromise;
let debounce;
let lastRequest = 0;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function normalizedQuery() { return input.value.trim(); }
function selectedTypes() { return [...filterBox.querySelectorAll("input:checked")].map(el => el.value); }
function setSelectedTypes(types) {
  const wanted = new Set(types.length ? types : defaultTypes);
  filterBox.querySelectorAll("input").forEach(el => { el.checked = wanted.has(el.value); });
}
function looksLikeId(query) {
  const q = query.toUpperCase().trim();
  return /^(?:F\d{4}|[PTSC]\d{3})$/.test(q) || /^[A-Z0-9]+-(?:\d{8}|GEN|UNMAPPED)-\d{4}$/.test(q);
}
function exactFor(query) { return idMap[query.toUpperCase().trim()] || null; }
function updateUrl(mode = "replace") {
  const params = new URLSearchParams();
  const q = normalizedQuery();
  if (q) params.set("q", q);
  for (const type of selectedTypes()) params.append("type", type);
  const url = `${withBase('/search/')}${params.size ? `?${params}` : ""}`;
  history[mode === "push" ? "pushState" : "replaceState"]({}, "", url);
}
async function loadIdMap() {
  const response = await fetch(withBase("/search/id-map.json"), { credentials: "same-origin" });
  if (!response.ok) throw new Error(`ID map failed: ${response.status}`);
  const payload = await response.json();
  idMap = payload.objects || {};
}
async function loadPagefind() {
  if (!pagefindPromise) {
    pagefindPromise = import(withBase("/pagefind/pagefind.js")).then(async module => {
      await module.options({ baseUrl: basePath, excerptLength: 24 });
      await module.init();
      return module;
    });
  }
  return pagefindPromise;
}
function clearOutput() {
  results.replaceChildren();
  exactJump.hidden = true;
  exactJump.innerHTML = "";
}
function renderExact(record) {
  if (!record) {
    exactJump.hidden = true;
    return;
  }
  exactJump.hidden = false;
  exactJump.innerHTML = `<span class="eyebrow">Exact identifier</span><a href="${escapeHtml(withBase(record.target))}"><code>${escapeHtml(record.id)}</code><span>Open controlled object →</span></a>`;
}
function renderBlank() {
  clearOutput();
  status.className = "search-status blank-state";
  status.innerHTML = `<h3>Two ways into the evidence</h3><p><strong>Exact retrieval:</strong> enter a controlled identifier such as <code>P024</code>, <code>F0162</code>, <code>T022</code> or an EUID.</p><p><strong>Discovery:</strong> search documentary wording, medication, clinician, date or concept. Results retain their evidential type and matching field.</p>`;
  count.textContent = "Enter a term to search the controlled graph.";
}
function renderExactMissing(query) {
  clearOutput();
  status.className = "search-status zero-state";
  status.innerHTML = `<h3>No controlled object with that identifier is present in the current evidence graph.</h3><p><code>${escapeHtml(query.trim())}</code> was treated as an identifier, not fuzzily matched to another evidential ID.</p><p><a href="${escapeHtml(withBase('/evidence/'))}">Return to Evidence Foundation →</a></p>`;
  count.textContent = "Exact identifier not found.";
}
function renderZero(query, filtered) {
  results.replaceChildren();
  status.className = "search-status zero-state";
  status.innerHTML = `<h3>No matching controlled evidence found.</h3><p>${filtered ? "The current evidence-layer filters may exclude otherwise matching results." : "No indexed controlled evidence matched this query."}</p><p><button type="button" id="zero-clear" class="text-button">Clear filters</button> · <a href="${escapeHtml(withBase('/evidence/'))}">Evidence Foundation</a></p><p class="search-examples-inline">Try <button type="button" data-search-example="PRKN">PRKN</button>, <button type="button" data-search-example="Podiatry">Podiatry</button> or <button type="button" data-search-example="Procyclidine">Procyclidine</button>.</p>`;
  count.textContent = `No results for “${query}”.`;
  document.querySelector("#zero-clear")?.addEventListener("click", restoreDefaultFilters);
  wireExamples(status);
}
function sourceStatusLabel(value) {
  if (!value || value === "not-applicable") return "";
  return `<span class="result-source-status">${escapeHtml(value.replaceAll("-", " "))}</span>`;
}
function resultItem(data) {
  const type = data.meta?.["object-type"] || data.filters?.["object-type"]?.[0] || "evidence";
  const id = data.meta?.["object-id"] || data.meta?.title || "Controlled object";
  const title = data.meta?.["object-title"] || id;
  const field = data.meta?.field || "Controlled content";
  const target = data.meta?.target || data.url;
  const sourceStatus = data.meta?.["source-status"];
  const fieldClass = field.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const caution = ["Boundary", "Qualification", "Possible Reconciliation"].includes(field) ? `<strong>Matched in ${escapeHtml(field)}</strong>` : `Matched in ${escapeHtml(field)}`;
  return `<li class="search-result type-${escapeHtml(type)} field-${escapeHtml(fieldClass)}"><div class="result-heading"><span class="result-type">${escapeHtml(labels[type] || type.toUpperCase())}</span><code>${escapeHtml(id)}</code>${sourceStatusLabel(sourceStatus)}</div><h3><a href="${escapeHtml(withBase(target))}">${escapeHtml(title)}</a></h3><p class="match-context">${caution}</p><div class="result-snippet">${data.excerpt || escapeHtml(data.plain_excerpt || "")}</div><a class="result-action" href="${escapeHtml(withBase(target))}">Open controlled ${type === "source" ? "source" : type} →</a></li>`;
}
async function runSearch({ push = false } = {}) {
  const request = ++lastRequest;
  const query = normalizedQuery();
  const types = selectedTypes();
  if (push) updateUrl("push"); else updateUrl("replace");
  if (!query) { renderBlank(); return; }
  const exact = exactFor(query);
  renderExact(exact);
  if (looksLikeId(query) && !exact) { renderExactMissing(query); return; }
  if (!types.length) { renderZero(query, true); return; }
  status.className = "search-status loading-state";
  status.innerHTML = `<p>Searching the controlled index…</p>`;
  count.textContent = "Searching…";
  try {
    const pagefind = await loadPagefind();
    const started = performance.now();
    const search = await pagefind.search(query, { filters: { "object-type": { any: types } } });
    const loaded = await Promise.all(search.results.slice(0, 80).map(result => result.data()));
    if (request !== lastRequest) return;
    const unique = [];
    const seen = new Set();
    for (const item of loaded) {
      const id = item.meta?.["object-id"] || item.url;
      if (seen.has(id)) continue;
      seen.add(id);
      unique.push(item);
      if (unique.length >= 30) break;
    }
    const elapsed = performance.now() - started;
    window.__LEDGER_LAST_SEARCH_MS = elapsed;
    results.innerHTML = unique.map(resultItem).join("");
    if (!unique.length) { renderZero(query, types.length !== defaultTypes.length || types.some(t => !defaultTypes.includes(t))); return; }
    status.className = "search-status";
    status.innerHTML = "";
    count.textContent = `${unique.length}${search.results.length > unique.length ? "+" : ""} controlled object${unique.length === 1 ? "" : "s"} shown for “${query}”.`;
  } catch (error) {
    console.error(error);
    clearOutput();
    status.className = "search-status zero-state";
    status.innerHTML = `<h3>Search index unavailable.</h3><p>The canonical Evidence Foundation remains available. Search did not return uncontrolled fallback results.</p><p><a href="${escapeHtml(withBase('/evidence/'))}">Open Evidence Foundation →</a></p>`;
    count.textContent = "Search index unavailable.";
  }
}
function restoreDefaultFilters() {
  setSelectedTypes(defaultTypes);
  runSearch();
}
function wireExamples(scope = document) {
  scope.querySelectorAll("[data-search-example]").forEach(button => {
    button.addEventListener("click", () => {
      input.value = button.dataset.searchExample || "";
      input.focus();
      runSearch({ push: true });
    });
  });
}
function hydrateFromUrl() {
  const params = new URLSearchParams(location.search);
  input.value = params.get("q") || "";
  const types = params.getAll("type");
  setSelectedTypes(types.length ? types : defaultTypes);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const exact = exactFor(normalizedQuery());
  if (exact) { location.assign(withBase(exact.target)); return; }
  runSearch({ push: true });
});
input.addEventListener("input", () => {
  clearTimeout(debounce);
  const q = normalizedQuery();
  const exact = exactFor(q);
  renderExact(exact);
  debounce = setTimeout(() => runSearch(), 180);
});
input.addEventListener("focus", () => { if (normalizedQuery()) loadPagefind().catch(() => {}); });
filterBox.addEventListener("change", () => runSearch({ push: true }));
document.querySelector("#clear-filters")?.addEventListener("click", restoreDefaultFilters);
document.addEventListener("keydown", event => {
  if (event.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "")) { event.preventDefault(); input.focus(); }
  if (event.key === "Escape" && document.activeElement === input) { input.value = ""; input.focus(); runSearch({ push: true }); }
});
window.addEventListener("popstate", () => { hydrateFromUrl(); runSearch(); });
wireExamples();

try {
  await loadIdMap();
  hydrateFromUrl();
  await runSearch();
} catch (error) {
  console.error(error);
  hydrateFromUrl();
  renderBlank();
}