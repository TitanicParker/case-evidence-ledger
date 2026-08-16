const { withBase } = require("./_lib/paths.js");
const { esc, header, footer, head } = require("./_lib/public-shell.js");

const GOVERNANCE_TENSIONS = ["T018", "T019", "T020", "T021"];
const GOVERNANCE_PROPOSITIONS = ["P024"];
const CONTROL_IDS = ["C001", "C002", "C003", "C004", "C005"];

function objectLink(o) {
  if (!o) return "";
  return o.canonical_url
    ? `<a href="${esc(withBase(o.canonical_url))}"><code>${esc(o.id)}</code> ${esc(o.title || o.id)}</a>`
    : `<code>${esc(o.id)}</code> ${esc(o.title || "")}`;
}

function tensionCard(t) {
  const statuses = (t.resolution_status_source || t.resolution_status || []).join(" · ");
  return `<article class="expert-question" id="gov-${esc(t.id)}"><div class="expert-question-head"><div><code>${esc(t.id)}</code>${statuses ? `<span class="expert-hinge">${esc(statuses)}</span>` : ""}</div><h2>${esc(t.title || t.id)}</h2></div><section class="expert-primary"><div class="eyebrow">Documentary tension</div><p>${esc(t.documentary_tension || "")}</p></section><div class="expert-two-col"><section><h3>Why it matters</h3><p>${esc(t.why_it_matters || "")}</p></section><section><h3>Possible reconciliation</h3><p>${esc(t.possible_reconciliation || "")}</p></section></div><section class="expert-boundary"><h3>What would resolve it</h3><p>${esc(t.what_would_resolve_it || "")}</p></section><details class="expert-references"><summary>Canonical object</summary><p>${objectLink(t)}</p></details></article>`;
}

function propositionCard(p) {
  return `<article class="expert-question expert-question-central" id="gov-${esc(p.id)}"><div class="expert-question-head"><div><code>${esc(p.id)}</code><span class="expert-hinge">Reconstruction control</span></div><h2>${esc(p.title || p.id)}</h2></div><section class="expert-primary"><div class="eyebrow">Controlled proposition</div><p>${esc(p.substantive_text || "")}</p></section><section class="expert-boundary"><h3>Boundary</h3><p>${esc(p.boundary || "")}</p></section><details class="expert-references"><summary>Canonical object</summary><p>${objectLink(p)}</p></details></article>`;
}

function controlCard(c) {
  return `<article class="expert-primary"><div class="eyebrow">Evidential control</div><h3>${objectLink(c)}</h3><p>${esc(c.substantive_text || "")}</p></article>`;
}

module.exports = class {
  data() { return { permalink: "/governance/index.html", eleventyExcludeFromCollections: true }; }

  render(data) {
    const ledger = data.ledger;
    const byId = ledger.byId || new Map((ledger.objects || []).map(o => [o.id, o]));
    const tensions = GOVERNANCE_TENSIONS.map(id => byId.get(id)).filter(Boolean);
    const propositions = GOVERNANCE_PROPOSITIONS.map(id => byId.get(id)).filter(Boolean);
    const controls = CONTROL_IDS.map(id => byId.get(id)).filter(Boolean);
    const purpose = "Governance-facing view of documentary chronology, representation, missing bridges, reconstruction and evidential controls.";
    const body = `<main id="content" class="expert-shell"><section class="expert-hero"><div><a class="back-link" href="${esc(withBase('/'))}">← Back to home</a><div class="eyebrow">Professional route · Governance & regulatory</div><h1>Record integrity and institutional sequence</h1></div><div class="expert-hero-copy"><p class="lede">This route asks what the controlled record shows about chronology, representation, missing documentary bridges and later reconstruction.</p><p>It does not convert a documentary tension into a clinical conclusion, legal breach or finding of motive. Where the record is incomplete, the incompleteness remains visible.</p><div class="expert-utility-links"><a href="${esc(withBase('/evidence/'))}">Evidence Foundation</a><a href="${esc(withBase('/search/'))}">Search evidence</a><a href="${esc(withBase('/case-evidence-ledger_timeline.html'))}">Timeline</a><a href="${esc(withBase('/method/'))}">Method</a></div></div></section><section class="expert-orientation"><div><span class="eyebrow">Governance discipline</span><h2>Sequence, representation, provenance.</h2></div><p>The four tensions below are intentionally documentary rather than medical: discharge/finalisation chronology, transmission chronology, representation scope, and a later treatment-state bridge that is not represented in the current corpus. They remain separate from the Expert Questions for that reason.</p></section><nav class="expert-index" aria-label="Governance documentary issues">${tensions.map((t, i) => `<a href="#gov-${esc(t.id)}"><span>${String(i + 1).padStart(2, "0")}</span><code>${esc(t.id)}</code><strong>${esc(t.title || t.id)}</strong></a>`).join("")}${propositions.map((p, i) => `<a href="#gov-${esc(p.id)}"><span>${String(tensions.length + i + 1).padStart(2, "0")}</span><code>${esc(p.id)}</code><strong>${esc(p.title || p.id)}</strong></a>`).join("")}</nav><section class="expert-register">${tensions.map(tensionCard).join("")}${propositions.map(propositionCard).join("")}</section><section class="expert-closing"><div class="eyebrow">Evidential controls</div><h2>What the record may not be made to prove.</h2><p>These controls travel with the governance view so duplication, patient report, administrative classification, medication response and documentary absence are not silently upgraded into stronger conclusions.</p></section><section class="expert-register">${controls.map(controlCard).join("")}</section><section class="expert-closing"><div class="eyebrow">Control</div><h2>A governance question is not a governance finding.</h2><p>This interface exposes the represented sequence and its controlled gaps. Any regulatory or legal conclusion must be made by the competent decision-maker under the applicable framework and on the complete record.</p></section></main>`;
    return `<!doctype html><html lang="en">${head("Governance — Record Integrity and Institutional Sequence", purpose)}<body class="route-governance"><a class="skip-link" href="#content">Skip to Governance record</a>${header("governance")}${body}${footer()}</body></html>`;
  }
};
