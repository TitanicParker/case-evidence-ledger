const { withBase } = require("./_lib/paths.js");

const LABELS = {
  source_euid: "Source / EUID",
  fact: "Controlled Fact",
  tension: "Evidential Tension",
  proposition: "Controlled Proposition",
  supporting_proposition: "Supporting Proposition",
  control_rule: "Control Rule",
  adjudication: "Adjudication"
};

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function pathFor(object) { return object?.canonical_url || null; }
function link(object, text = null) {
  if (!object) return "";
  const label = text || `${object.id}${object.title ? ` — ${object.title}` : ""}`;
  const path = pathFor(object);
  return path ? `<a href="${esc(withBase(path))}">${esc(label)}</a>` : `<span>${esc(label)}</span>`;
}
function copy(value, extra = "") { return `<div class="controlled-copy ${extra}">${esc(value || "")}</div>`; }
function objectLabel(object) { return LABELS[object.object_type] || object.object_type.replaceAll("_", " "); }
function notice() { return `<p class="generated-notice">Generated from the controlled repository evidence graph. This page is an interface view, not an independent evidential source.</p>`; }
function header(current = "evidence") {
  const item = (key, label, path) => `<a${current === key ? ' aria-current="page"' : ""} href="${esc(withBase(path))}">${label}</a>`;
  return `<header class="site-header"><a class="brand" href="${esc(withBase('/evidence/'))}"><span>Case Evidence Ledger</span><small>Controlled documentary system</small></a><nav aria-label="Primary">${item("evidence","Evidence","/evidence/")}${item("search","Search","/search/")}${item("timeline","Timeline","/case-evidence-ledger_timeline.html")}${item("method","Method","/method/")}<a href="https://github.com/TitanicParker/case-evidence-ledger">Repository</a></nav></header>`;
}
function provenance(object, version) {
  const prov = object?.provenance || {};
  return `<details class="disclosure provenance"><summary>Provenance</summary><dl class="metadata-list"><div><dt>Object ID</dt><dd><code>${esc(object.id)}</code></dd></div><div><dt>Source file</dt><dd><code>${esc(object.source_file)}</code></dd></div><div><dt>Source anchor</dt><dd><code>${esc(object.source_anchor)}</code></dd></div><div><dt>Schema</dt><dd>${esc(version.schema_version || prov.schema_version || "1.0.0")}</dd></div><div><dt>Repository/build</dt><dd><code>${esc(version.site_build_commit || prov.site_build_commit || "unavailable")}</code></dd></div>${prov.source_blob_sha_or_commit ? `<div><dt>Source blob/commit</dt><dd><code>${esc(prov.source_blob_sha_or_commit)}</code></dd></div>` : ""}</dl>${notice()}</details>`;
}
function shell(route, body, version, object = null) {
  const title = route.title || "Evidence Foundation";
  const klass = object ? ` object-${object.object_type}` : ` route-${route.kind}`;
  const current = route.kind === "method" ? "method" : "evidence";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)} · Case Evidence Ledger</title><meta name="description" content="Canonical Evidence Foundation for the Case Evidence Ledger"><link rel="stylesheet" href="${esc(withBase('/assets/styles.css'))}"></head><body class="${klass}"><a class="skip-link" href="#content">Skip to evidence</a>${header(current)}<main id="content">${body}</main><footer class="site-footer"><span>Case Evidence Ledger</span><span>Schema ${esc(version.schema_version || "1.0.0")}</span><span>Generated documentary interface</span></footer></body></html>`;
}
function identity(object) { return `<div class="object-kicker"><span class="object-type">${esc(objectLabel(object))}</span><code class="object-id">${esc(object.id)}</code></div>${object.title ? `<h1>${esc(object.title)}</h1>` : `<h1>${esc(object.id)}</h1>`}`; }
function refs(title, items, open = false) {
  if (!items?.length) return "";
  return `<details class="disclosure relationships"${open ? " open" : ""}><summary>${esc(title)} <span>${items.length}</span></summary><div class="reference-list">${items.map(item => `<div class="reference-row"><code>${esc(item.id)}</code><div>${link(item, item.title || item.substantive_text?.slice(0, 120) || item.id)}</div></div>`).join("")}</div></details>`;
}
function pageBack() { return `<a class="back-link" href="${esc(withBase('/evidence/'))}">← Back to Evidence Foundation</a>`; }
function proposition(object, ledger) {
  const facts = (object.relationships?.fact_ids || []).map(id => ledger.byId.get(id)).filter(Boolean);
  const tensions = (object.relationships?.tension_ids || []).map(id => ledger.byId.get(id)).filter(Boolean);
  const audit = object.audit;
  const adjudication = object.adjudication;
  return `<div class="object-layout"><aside class="context-rail">${pageBack()}<div class="layer-marker">Proposition<br><span>↓ Tension<br>↓ Fact<br>↓ Source</span></div></aside><article class="reading-column">${identity(object)}<section class="primary-section"><h2>Controlled proposition</h2>${copy(object.substantive_text)}</section>${object.strength ? `<section class="field-section"><h2>Strength</h2><p class="field-value">${esc(object.strength_source || object.strength)}</p></section>` : ""}${object.boundary ? `<section class="boundary-block"><h2>Boundary</h2>${copy(object.boundary)}</section>` : ""}${refs("Connected tensions", tensions, true)}${refs("Show supporting facts", facts)}${audit ? `<details class="disclosure adverse"><summary>Adverse case <span>View strongest defence answer</span></summary><div class="separate-analysis"><p class="separation-label">Separate adverse-analysis layer</p><h3>${esc(audit.defence_position_source || "Defence position")}</h3>${copy(audit.best_defence_answer)}</div></details>` : ""}${adjudication ? `<section class="adjudication-block"><div class="section-eyebrow">Separate adjudication layer</div><h2>Adjudication</h2><p class="field-value">${esc(adjudication.adjudication_source || adjudication.adjudication_classes?.join(" + ") || "")}</p>${copy(adjudication.disposition)}</section>` : ""}${notice()}</article><aside class="provenance-rail">${provenance(object, ledger.siteVersion)}<details class="disclosure path" open><summary>Evidence path</summary><ol><li><strong>${esc(object.id)}</strong><span>Proposition</span></li>${tensions.slice(0,2).map(t => `<li>${link(t,t.id)}<span>Tension</span></li>`).join("")}${facts.slice(0,3).map(f => `<li>${link(f,f.id)}<span>Fact</span></li>`).join("")}${facts[0]?.relationships?.source_euids?.[0] && ledger.byId.get(facts[0].relationships.source_euids[0]) ? `<li>${link(ledger.byId.get(facts[0].relationships.source_euids[0]), facts[0].relationships.source_euids[0])}<span>Source / EUID</span></li>` : ""}</ol></details></aside></div>`;
}
function fact(object, ledger) {
  const sources = (object.relationships?.source_euids || []).map(id => ledger.byId.get(id)).filter(Boolean);
  const tensions = ledger.related(object.id, "tensions");
  const propositions = ledger.related(object.id, "propositions");
  return `<div class="object-layout"><aside class="context-rail">${pageBack()}<div class="layer-marker">Fact<br><span>↓ Source evidence</span></div></aside><article class="reading-column">${identity(object)}<section class="primary-section"><h2>Controlled fact</h2>${copy(object.substantive_text)}</section><section class="qualification-block"><h2>Qualification</h2>${copy(object.qualification)}</section><section class="field-section"><h2>Evidence class</h2><p class="field-value">${esc(object.evidence_class)}</p></section>${refs("Source evidence", sources, true)}${refs("Connected tensions", tensions)}${refs("Used by propositions", propositions)}${notice()}</article><aside class="provenance-rail">${provenance(object, ledger.siteVersion)}</aside></div>`;
}
function tension(object, ledger) {
  const facts = (object.relationships?.fact_ids || []).map(id => ledger.byId.get(id)).filter(Boolean);
  const propositions = ledger.related(object.id, "propositions");
  return `<div class="object-layout"><aside class="context-rail">${pageBack()}<div class="layer-marker">Tension<br><span>between controlled records</span></div></aside><article class="reading-column">${identity(object)}<section class="primary-section"><h2>Documentary tension</h2>${copy(object.documentary_tension)}</section><section class="field-section"><h2>Why it matters</h2>${copy(object.why_it_matters)}</section><section class="reconciliation-block"><div class="section-eyebrow">Interpretive reconciliation — not documentary fact</div><h2>Possible reconciliation</h2>${copy(object.possible_reconciliation)}</section><section class="field-section"><h2>What would resolve it</h2>${copy(object.what_would_resolve_it)}</section><section class="field-section"><h2>Status</h2><p class="field-value">${esc((object.resolution_status_source || object.resolution_status || []).join(" / "))}</p></section>${refs("Facts engaged", facts, true)}${refs("Used by propositions", propositions)}${notice()}</article><aside class="provenance-rail">${provenance(object, ledger.siteVersion)}</aside></div>`;
}
function source(object, ledger) {
  const used = object.used_by || {facts:[],tensions:[],propositions:[]};
  const dates = [["Event date",object.event_date],["Document date",object.document_date],["Finalised",object.finalised_date],["Received",object.received_date]].filter(([,v])=>v);
  return `<div class="object-layout"><aside class="context-rail">${pageBack()}<div class="layer-marker">Source / EUID<br><span>controlled corpus representation</span></div></aside><article class="reading-column">${identity(object)}<dl class="source-metadata"><div><dt>Source family</dt><dd>${esc(object.source_family || "—")}</dd></div><div><dt>Source type</dt><dd>${esc(object.source_type || "—")}</dd></div><div><dt>Source status</dt><dd>${esc(object.source_status || "—")}</dd></div>${object.statement_status ? `<div><dt>Statement status</dt><dd>${esc(object.statement_status)}</dd></div>` : ""}${dates.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl><section class="source-text"><h2>Source text</h2>${copy(object.substantive_text,"source-copy")}</section>${refs("Used by Facts", used.facts, true)}${refs("Used by Tensions", used.tensions)}${refs("Used by Propositions", used.propositions)}${notice()}</article><aside class="provenance-rail">${provenance(object, ledger.siteVersion)}</aside></div>`;
}
function objectPage(route, ledger) {
  const o = route.object;
  if (o.object_type === "fact") return fact(o,ledger);
  if (o.object_type === "tension") return tension(o,ledger);
  if (o.object_type === "source_euid") return source(o,ledger);
  return proposition(o,ledger);
}
function landing(ledger) {
  const c = ledger.counts;
  const cards = [
    ["Sources / EUIDs",c.euids,"Controlled corpus representations","/evidence/euids/"],
    ["Facts",c.facts,"Controlled factual statements with qualifications","/evidence/facts/"],
    ["Tensions",c.tensions,"Documentary tensions, reconciliations and resolution status","/evidence/tensions/"],
    ["Propositions",c.propositions + c.supporting,"Controlled propositions with boundaries and traceability","/evidence/propositions/"]
  ];
  return `<section class="foundation-hero"><div class="eyebrow">Evidence Foundation · Schema ${esc(ledger.siteVersion.schema_version || "1.0.0")}</div><h1>Controlled Evidence Foundation</h1><p>The documentary substrate of the case, organised as Sources, Facts, Evidential Tensions and Controlled Propositions.</p><div class="hierarchy-line" aria-label="Evidence hierarchy"><span>Source</span><b>→</b><span>Fact</span><b>→</b><span>Tension</span><b>→</b><span>Proposition</span></div></section><section class="foundation-grid">${cards.map(([title,count,desc,url])=>`<a class="entry-card" href="${esc(withBase(url))}"><span class="entry-count">${count.toLocaleString("en-GB")}</span><h2>${title}</h2><p>${desc}</p><span class="entry-action">Enter collection →</span></a>`).join("")}</section><section class="foundation-secondary"><div><div class="eyebrow">Controlled retrieval</div><h2>Evidence search</h2><p>Search by exact identifier or discover controlled evidence by documentary wording, medication, clinician, date or evidential layer.</p><a class="active-control" href="${esc(withBase('/search/'))}">Open Evidence Search →</a></div><div><div class="eyebrow">Orientation</div><h2>Timeline & method</h2><p>The existing documentary timeline remains unchanged. Method explains provenance, generated-view status and repository authority.</p><p><a href="${esc(withBase('/case-evidence-ledger_timeline.html'))}">Open documentary timeline →</a><br><a href="${esc(withBase('/method/'))}">Read methodology →</a></p></div></section><section class="version-strip"><span>Repository build</span><code>${esc(ledger.siteVersion.site_build_commit || "unavailable")}</code><span>${c.total.toLocaleString("en-GB")} normalized objects</span></section>`;
}
function collection(route, ledger) {
  const label = route.collection === "euids" ? "Sources / EUIDs" : route.title;
  const intro = route.collection === "facts" ? "Controlled Facts are shown in stable ID order. Each canonical page keeps its Qualification and source evidence attached." : route.collection === "euids" ? "Controlled evidence identifiers represent the corpus layer. Large collections are paginated to preserve a calm reading surface." : route.collection === "tensions" ? "Each Tension preserves documentary tension, possible reconciliation, resolution requirement and status as separate fields." : "Core and supporting propositions remain distinct. Core proposition pages keep Strength and Boundary prominent.";
  const items = route.items.map(o => `<li id="${esc(o.id)}" class="index-row type-${esc(o.object_type)}"><div><span class="index-type">${esc(objectLabel(o))}</span><code>${esc(o.id)}</code></div><div><h2>${link(o,o.title || o.substantive_text?.slice(0,150) || o.id)}</h2>${o.boundary ? `<p class="index-boundary">Boundary: ${esc(o.boundary)}</p>` : o.qualification ? `<p>${esc(o.qualification)}</p>` : o.documentary_tension ? `<p>${esc(o.documentary_tension)}</p>` : `<p>${esc((o.substantive_text || "").slice(0,240))}</p>`}</div></li>`).join("");
  const prev = route.page > 1 ? (route.page === 2 ? `/evidence/${route.collection}/` : `/evidence/${route.collection}/page/${route.page-1}/`) : null;
  const next = route.page < route.pages ? `/evidence/${route.collection}/page/${route.page+1}/` : null;
  const controls = route.collection === "propositions" && route.controls?.length ? `<section class="control-rules"><div class="eyebrow">Evidential controls</div><h2>Control rules</h2><p>Controls constrain interpretation; they are not historical facts and do not receive invented canonical URLs.</p>${route.controls.map(o=>`<article id="${esc(o.id)}" class="control-rule"><div class="object-kicker"><span class="object-type">Control Rule</span><code class="object-id">${esc(o.id)}</code></div><h3>${esc(o.title || "")}</h3>${copy(o.substantive_text)}</article>`).join("")}</section>` : "";
  return `<div class="collection-shell"><div class="collection-heading">${pageBack()}<div class="eyebrow">Canonical collection</div><h1>${esc(label)}</h1><p>${esc(intro)}</p>${route.pages > 1 ? `<p class="page-count">Page ${route.page} of ${route.pages}</p>` : ""}</div><ol class="index-list">${items}</ol>${controls}<nav class="pagination" aria-label="Collection pages">${prev ? `<a href="${esc(withBase(prev))}">← Previous</a>` : `<span></span>`}<span>Page ${route.page} / ${route.pages}</span>${next ? `<a href="${esc(withBase(next))}">Next →</a>` : `<span></span>`}</nav></div>`;
}
function method(ledger) {
  return `<div class="method-page">${pageBack()}<div class="eyebrow">Authority & provenance</div><h1>Method</h1><p class="lede">This site is a generated interface over the controlled repository evidence graph. It does not replace the repository, the controlling source representations, or the evidential distinctions encoded by schema 1.0.0.</p><section><h2>Authority chain</h2><div class="method-chain"><span>Controlled Markdown</span><b>→</b><span>Schema 1.0.0</span><b>→</b><span>Parser / validator</span><b>→</b><span>Normalized graph</span><b>→</b><span>Canonical HTML</span></div></section><section><h2>Reading discipline</h2><p>Facts remain distinct from source evidence. Tensions remain distinct from their possible reconciliations. Proposition boundaries remain attached to the propositions they constrain. Defence analysis and adjudication are shown as separate analytical layers.</p></section><section><h2>Search-index provenance</h2><p>Search results are generated from the controlled evidence graph and are not independent evidential sources. Search snippets retain matching-field context and link through to canonical controlled pages.</p><p><a href="${esc(withBase('/search/'))}">Open Evidence Search →</a></p></section><section><h2>Generated-view status</h2>${notice()}<dl class="metadata-list"><div><dt>Repository</dt><dd>TitanicParker/case-evidence-ledger</dd></div><div><dt>Schema</dt><dd>${esc(ledger.siteVersion.schema_version || "1.0.0")}</dd></div><div><dt>Parser</dt><dd>${esc(ledger.siteVersion.parser_version || "1.0.0")}</dd></div><div><dt>Build commit</dt><dd><code>${esc(ledger.siteVersion.site_build_commit || "unavailable")}</code></dd></div></dl></section></div>`;
}

module.exports = class {
  data() {
    return {
      pagination: { data: "ledger.routes", size: 1, alias: "route" },
      permalink: data => data.route.url,
      eleventyExcludeFromCollections: true
    };
  }
  render(data) {
    const { route, ledger } = data;
    let body;
    if (route.kind === "landing") body = landing(ledger);
    else if (route.kind === "collection") body = collection(route,ledger);
    else if (route.kind === "method") body = method(ledger);
    else body = objectPage(route,ledger);
    return shell(route,body,ledger.siteVersion,route.object || null);
  }
};
