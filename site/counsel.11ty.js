const { withBase } = require("./_lib/paths.js");
const { esc, header, footer, head } = require("./_lib/public-shell.js");

const LIMBS = [
  { key: "entry", label: "Entry state", ids: ["P001"] },
  { key: "uncertainty", label: "Unresolved relationship", ids: ["P003"] },
  { key: "allocation", label: "Operational allocation", ids: ["P004"] },
  { key: "strategy", label: "Treatment and diagnostic strategy", ids: ["P009", "P010", "P011", "P012"] },
  { key: "updating", label: "Longitudinal updating", ids: ["P023"] },
  { key: "reconstruction", label: "Reconstruction hinge", ids: ["P024"] },
];

const EQ_ORDER = ["EQ001", "EQ002", "EQ003", "EQ004", "EQ005", "EQ006", "EQ007", "EQ009", "EQ008"];

function lines(value = "") {
  return String(value).split(/\n+/).map(line => line.trim()).filter(Boolean);
}

function list(value) {
  const items = lines(value).map(line => line.replace(/^[-*]\s*/, ""));
  return items.length ? `<ul>${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul>` : "";
}

function propositionLink(p) {
  return p?.canonical_url ? `<a href="${esc(withBase(p.canonical_url))}"><code>${esc(p.id)}</code> ${esc(p.title || "Controlled proposition")}</a>` : `<code>${esc(p?.id || "")}</code>`;
}

function auditFor(objects, pid) {
  return objects.find(o => o.object_type === "defence_audit" && o.proposition_id === pid);
}

function adjudicationFor(objects, pid) {
  return objects.find(o => o.object_type === "adjudication" && o.proposition_id === pid);
}

function expertQuestionsFor(objects, pids) {
  const set = new Set(pids);
  return EQ_ORDER.map(id => objects.find(o => o.id === id && o.object_type === "expert_question"))
    .filter(Boolean)
    .filter(q => (q.proposition_ids || q.relationships?.proposition_ids || []).some(pid => set.has(pid)));
}

function propositionCard(p, objects) {
  const audit = auditFor(objects, p.id);
  const adjudication = adjudicationFor(objects, p.id);
  return `<article class="expert-primary"><div class="eyebrow">Controlled documentary proposition · ${esc(p.strength_source || p.strength || "")}</div><h3>${propositionLink(p)}</h3><p>${esc(p.substantive_text || "")}</p><div class="expert-two-col"><section><h3>Boundary</h3><p>${esc(p.boundary || "")}</p></section><section><h3>Strongest adverse answer</h3><p>${esc(audit?.best_defence_answer || "No separate adverse-audit entry is represented for this proposition.")}</p></section></div>${audit ? `<details class="expert-references"><summary>Adverse-case limits</summary><div class="expert-reference-columns"><div><h4>Record permits</h4><p>${esc(audit.claimant_entitled_to_say || "")}</p></div><div><h4>Record does not permit</h4><p>${esc(audit.claimant_not_entitled_to_say || "")}</p></div></div></details>` : ""}${adjudication ? `<section class="expert-boundary"><h3>Adjudication / surviving disposition</h3><p>${esc(adjudication.disposition || "")}</p></section>` : ""}</article>`;
}

function expertDependency(q) {
  const central = q.id === "EQ007";
  const downstream = q.id === "EQ008";
  return `<article class="expert-question ${central ? "expert-question-central" : ""} ${downstream ? "expert-question-downstream" : ""}" id="counsel-${esc(q.id)}"><div class="expert-question-head"><div><code>${esc(q.id)}</code>${central ? '<span class="expert-hinge">Central hinge</span>' : ""}${downstream ? '<span class="expert-hinge">Causation downstream</span>' : ""}</div><h2>${esc(q.title || q.title_or_question || q.id)}</h2></div><section class="expert-primary"><div class="eyebrow">Expert dependency — no outcome selected</div><p>${esc(q.question || "")}</p></section><section class="expert-outcome-block"><h3>Permitted opinion branches</h3><p class="expert-caption">Counsel consequence remains conditional on the independent expert answer.</p>${list(q.permitted_outcome_range)}</section><section class="expert-boundary"><h3>Conditional Counsel consequence</h3><p>${esc(q.counsel_consequence || "")}</p></section><details class="expert-references"><summary>Expert-question boundary</summary><p>${esc(q.boundary || "")}</p></details></article>`;
}

module.exports = class {
  data() { return { permalink: "/counsel/index.html", eleventyExcludeFromCollections: true }; }

  render(data) {
    const ledger = data.ledger;
    const objects = ledger.objects || [];
    const byId = ledger.byId || new Map(objects.map(o => [o.id, o]));
    const limbs = LIMBS.map(limb => ({ ...limb, propositions: limb.ids.map(id => byId.get(id)).filter(Boolean), questions: expertQuestionsFor(objects, limb.ids) }));
    const allQuestions = EQ_ORDER.map(id => byId.get(id)).filter(q => q?.object_type === "expert_question");
    const purpose = "Counsel-facing argument architecture over the controlled documentary graph and conditional expert dependencies.";
    const body = `<main id="content" class="expert-shell"><section class="expert-hero"><div><a class="back-link" href="${esc(withBase('/'))}">← Back to home</a><div class="eyebrow">Professional route · Counsel</div><h1>Documentary case and expert hinges</h1></div><div class="expert-hero-copy"><p class="lede">The documentary case is presented at the level it can safely sustain. Stronger clinical and causal consequences remain conditional on independent expert opinion.</p><p>This route places each controlled proposition beside its boundary, strongest adverse answer and surviving adjudication, then exposes the Expert Questions on which any stronger argument depends.</p><div class="expert-utility-links"><a href="${esc(withBase('/expert/'))}">Expert questions</a><a href="${esc(withBase('/evidence/'))}">Evidence Foundation</a><a href="${esc(withBase('/search/'))}">Search evidence</a><a href="${esc(withBase('/case-evidence-ledger_timeline.html'))}">Timeline</a></div></div></section><section class="expert-orientation"><div><span class="eyebrow">Argument discipline</span><h2>Document first. Opinion second. Consequence last.</h2></div><p>The record can establish documentary propositions without deciding negligence, exclusive mechanism or avoidable harm. Where an argument crosses that boundary, the linked Expert Question makes the dependency explicit and leaves the possible outcomes unselected.</p></section><nav class="expert-index" aria-label="Counsel documentary limbs">${limbs.map((limb, i) => `<a href="#limb-${esc(limb.key)}"><span>${String(i + 1).padStart(2, "0")}</span><code>${esc(limb.ids.join("/"))}</code><strong>${esc(limb.label)}</strong></a>`).join("")}</nav><section class="expert-register">${limbs.map((limb, i) => `<section class="expert-question ${limb.key === "reconstruction" ? "expert-question-central" : ""}" id="limb-${esc(limb.key)}"><div class="expert-question-head"><div><span class="expert-sequence">${String(i + 1).padStart(2, "0")}</span><span class="expert-hinge">Documentary limb</span></div><h2>${esc(limb.label)}</h2></div>${limb.propositions.map(p => propositionCard(p, objects)).join("")}${limb.questions.length ? `<details class="expert-references"><summary>Expert dependencies <span>${limb.questions.length} linked question${limb.questions.length === 1 ? "" : "s"}</span></summary><div>${limb.questions.map(q => `<p><a href="#counsel-${esc(q.id)}"><code>${esc(q.id)}</code> ${esc(q.title || q.title_or_question || "")}</a></p>`).join("")}</div></details>` : ""}</section>`).join("")}</section><section class="expert-closing"><div class="eyebrow">Conditional argument map</div><h2>What changes when the expert answers?</h2><p>The branches below are not predictions and do not select a preferred opinion. They show how the controlled documentary case expands, narrows or falls away under different legitimate expert outcomes.</p></section><section class="expert-register">${allQuestions.map(expertDependency).join("")}</section><section class="expert-closing"><div class="eyebrow">Control</div><h2>The repository does not decide the case.</h2><p>Documentary propositions remain controlled documentary propositions. Expert opinion remains external. Legal characterisation, breach, causation and remedy remain matters for the appropriate professional decision-maker on the full evidence.</p></section></main>`;
    return `<!doctype html><html lang="en">${head("Counsel — Documentary Case and Expert Hinges", purpose)}<body class="route-counsel"><a class="skip-link" href="#content">Skip to Counsel argument</a>${header("counsel")}${body}${footer()}</body></html>`;
  }
};
