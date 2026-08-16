const { withBase } = require("./_lib/paths.js");
const { esc, header, footer, head } = require("./_lib/public-shell.js");

const ORDER = ["EQ001", "EQ002", "EQ003", "EQ004", "EQ005", "EQ006", "EQ007", "EQ009", "EQ008"];

function lines(value = "") {
  return String(value).split(/\n+/).map(line => line.trim()).filter(Boolean);
}

function list(value, className = "") {
  const items = lines(value).map(line => line.replace(/^[-*]\s*/, ""));
  return items.length ? `<ul class="${esc(className)}">${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul>` : "";
}

function outcomes(value = "") {
  const items = lines(value).map(line => line.replace(/^[-*]\s*/, ""));
  return `<ol class="expert-outcomes">${items.map(item => `<li>${esc(item)}</li>`).join("")}</ol>`;
}

function canonicalLink(object) {
  if (!object) return "";
  const url = object.canonical_url;
  const label = object.title ? `${object.id} — ${object.title}` : object.id;
  return url ? `<a href="${esc(withBase(url))}"><code>${esc(object.id)}</code><span>${esc(object.title || object.id)}</span></a>` : `<span><code>${esc(object.id)}</code>${esc(label)}</span>`;
}

function references(question, ledger) {
  const tensions = (question.relationships?.tension_ids || []).map(id => ledger.byId.get(id)).filter(Boolean);
  const propositions = (question.relationships?.proposition_ids || []).map(id => ledger.byId.get(id)).filter(Boolean);
  return `<details class="expert-references"><summary>Documentary basis <span>${tensions.length + propositions.length} controlled objects</span></summary><div class="expert-reference-columns"><div><h4>Tensions</h4>${tensions.map(canonicalLink).join("") || "<p>None mapped.</p>"}</div><div><h4>Propositions</h4>${propositions.map(canonicalLink).join("") || "<p>None mapped.</p>"}</div></div></details>`;
}

function questionCard(question, ledger, index) {
  const central = question.id === "EQ007";
  const causation = question.id === "EQ008";
  const classes = ["expert-question", central ? "expert-question-central" : "", causation ? "expert-question-downstream" : ""].filter(Boolean).join(" ");
  return `<article class="${classes}" id="${esc(question.id)}"><div class="expert-question-head"><div><span class="expert-sequence">${String(index + 1).padStart(2, "0")}</span><code>${esc(question.id)}</code>${central ? '<span class="expert-hinge">Central integration question</span>' : ""}${causation ? '<span class="expert-hinge">Downstream only</span>' : ""}</div><h2>${esc(question.title || question.title_or_question || question.id)}</h2></div><section class="expert-primary"><div class="eyebrow">Question for independent opinion</div><p>${esc(question.question)}</p></section><div class="expert-two-col"><section><h3>What the record establishes</h3>${list(question.documentary_baseline)}</section><section><h3>What requires expert judgment</h3>${list(question.expert_dependent_issues)}</section></div><section class="expert-outcome-block"><h3>Permitted outcome range</h3><p class="expert-caption">The register does not select an answer. These branches keep both claimant-supporting and defence-supporting conclusions available.</p>${outcomes(question.permitted_outcome_range)}</section><section class="expert-boundary"><h3>Boundary</h3><p>${esc(question.boundary)}</p></section>${references(question, ledger)}</article>`;
}

module.exports = class {
  data() { return { permalink: "/expert/index.html", eleventyExcludeFromCollections: true }; }

  render(data) {
    const ledger = data.ledger;
    const questionsById = new Map(ledger.objects.filter(object => object.object_type === "expert_question").map(object => [object.id, object]));
    const questions = ORDER.map(id => questionsById.get(id)).filter(Boolean);
    const purpose = "Independent clinical reconstruction questions generated from the controlled evidential graph.";
    const body = `<main id="content" class="expert-shell"><section class="expert-hero"><div><a class="back-link" href="${esc(withBase('/'))}">← Back to home</a><div class="eyebrow">Professional route · Independent expert review</div><h1>Questions for expert opinion</h1></div><div class="expert-hero-copy"><p class="lede">The documentary record defines the problem. This route identifies the clinical judgments the record cannot make for itself.</p><p>No expert answer is supplied here. Each question preserves the documentary baseline, the issue requiring specialist judgment, a neutral outcome range and the boundary against overstatement.</p><div class="expert-utility-links"><a href="${esc(withBase('/evidence/'))}">Evidence Foundation</a><a href="${esc(withBase('/search/'))}">Search evidence</a><a href="${esc(withBase('/case-evidence-ledger_timeline.html'))}">Timeline</a><a href="${esc(withBase('/method/'))}">Method</a></div></div></section><section class="expert-orientation"><div><span class="eyebrow">Reading sequence</span><h2>Record → question → independent opinion</h2></div><p>The first questions establish phenotype, management and longitudinal clinical meaning. <strong>EQ007</strong> is the integration hinge. <strong>EQ008</strong> is deliberately last because causation and avoidable harm are downstream of the preceding clinical opinions.</p></section><nav class="expert-index" aria-label="Expert questions">${questions.map((q, i) => `<a href="#${esc(q.id)}"><span>${String(i + 1).padStart(2, "0")}</span><code>${esc(q.id)}</code><strong>${esc(q.title || q.title_or_question || q.id)}</strong></a>`).join("")}</nav><section class="expert-register">${questions.map((q, i) => questionCard(q, ledger, i)).join("")}</section><section class="expert-closing"><div class="eyebrow">Control</div><h2>This is not an expert report.</h2><p>The repository controls the chain only through the Expert Question. Expert Opinion remains external and independent. Any legal or Counsel consequence remains conditional on that opinion and the wider evidence.</p></section></main>`;
    return `<!doctype html><html lang="en">${head("Questions for Expert Opinion", purpose)}<body class="route-expert"><a class="skip-link" href="#content">Skip to expert questions</a>${header("expert")}${body}${footer()}</body></html>`;
  }
};
