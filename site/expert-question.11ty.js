const { withBase } = require("./_lib/paths.js");
const { esc, header, footer, head } = require("./_lib/public-shell.js");

function lines(value = "") {
  return String(value).split(/\n+/).map(line => line.trim()).filter(Boolean);
}

function list(value) {
  const items = lines(value).map(line => line.replace(/^[-*]\s*/, ""));
  return items.length ? `<ul>${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul>` : "";
}

function link(object) {
  if (!object) return "";
  const label = object.title || object.substantive_text?.slice(0, 120) || object.id;
  return object.canonical_url
    ? `<a href="${esc(withBase(object.canonical_url))}"><code>${esc(object.id)}</code><span>${esc(label)}</span></a>`
    : `<span><code>${esc(object.id)}</code><span>${esc(label)}</span></span>`;
}

module.exports = class {
  data() {
    return {
      pagination: { data: "ledger.collections.expertQuestions", size: 1, alias: "question" },
      permalink: data => `/evidence/expert-questions/${data.question.id}/index.html`,
      eleventyExcludeFromCollections: true
    };
  }

  render(data) {
    const { question, ledger } = data;
    const tensions = (question.relationships?.tension_ids || []).map(id => ledger.byId.get(id)).filter(Boolean);
    const propositions = (question.relationships?.proposition_ids || []).map(id => ledger.byId.get(id)).filter(Boolean);
    const purpose = `Canonical controlled Expert Question ${question.id}. This page identifies the expert judgment required by the documentary graph and does not supply the opinion.`;
    const body = `<main id="content" class="expert-shell"><section class="expert-hero"><div><a class="back-link" href="${esc(withBase('/evidence/'))}">← Back to Evidence Foundation</a><div class="eyebrow">Canonical controlled object · Expert Question</div><h1>${esc(question.id)}</h1></div><div class="expert-hero-copy"><p class="lede">${esc(question.title || question.title_or_question || question.id)}</p><p>This page is the canonical interface representation of a controlled Expert Question. It does not answer the question and is not an expert report.</p><div class="expert-utility-links"><a href="${esc(withBase('/expert/'))}">Expert route</a><a href="${esc(withBase('/counsel/'))}">Counsel route</a><a href="${esc(withBase('/search/'))}">Search evidence</a></div></div></section><article class="expert-question expert-question-central"><section class="expert-primary"><div class="eyebrow">Question for independent opinion</div><p>${esc(question.question || "")}</p></section><div class="expert-two-col"><section><h3>What the record establishes regardless</h3>${list(question.documentary_baseline)}</section><section><h3>What requires expert judgment</h3>${list(question.expert_dependent_issues)}</section></div><section class="expert-outcome-block"><h3>Permitted outcome range</h3><p class="expert-caption">The controlled register preserves the legitimate outcome branches without selecting one.</p>${list(question.permitted_outcome_range)}</section><section class="expert-boundary"><h3>Boundary</h3><p>${esc(question.boundary || "")}</p></section><details class="expert-references" open><summary>Documentary basis <span>${tensions.length + propositions.length} controlled objects</span></summary><div class="expert-reference-columns"><div><h4>Tensions</h4>${tensions.map(link).join("") || "<p>None mapped.</p>"}</div><div><h4>Propositions</h4>${propositions.map(link).join("") || "<p>None mapped.</p>"}</div></div></details><details class="expert-references"><summary>Provenance</summary><div class="expert-reference-columns"><div><h4>Controlled source</h4><p><code>${esc(question.source_file || "EXPERT_QUESTION_REGISTER.md")}</code></p><p>Anchor: <code>${esc(question.source_anchor || question.id)}</code></p></div><div><h4>Graph status</h4><p>${esc(question.status || "controlled-question")}</p><p>Schema ${esc(ledger.siteVersion.schema_version || "1.0.0")}</p></div></div></details></article><section class="expert-closing"><div class="eyebrow">Control</div><h2>Question, not conclusion.</h2><p>The repository controls the documentary basis and the formulation of the question. Independent expert opinion remains external. Counsel consequences remain conditional on that opinion and the wider evidence.</p></section></main>`;
    return `<!doctype html><html lang="en">${head(`${question.id} — ${question.title || question.title_or_question || "Expert Question"}`, purpose)}<body class="route-expert-question"><a class="skip-link" href="#content">Skip to Expert Question</a>${header("evidence")}${body}${footer()}</body></html>`;
  }
};
