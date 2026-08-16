const { withBase } = require("./paths.js");

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function header(current = "") {
  const item = (key, label, path) => `<a${current === key ? ' aria-current="page"' : ""} href="${esc(withBase(path))}">${label}</a>`;
  return `<header class="site-header public-header"><a class="brand" href="${esc(withBase('/'))}"><span>Case Evidence Ledger</span><small>Controlled documentary record</small></a><nav aria-label="Primary">${item("home","Home","/")}${item("counsel","Counsel","/counsel/")}${item("expert","Expert","/expert/")}${item("governance","Governance","/governance/")}${item("evidence","Evidence","/evidence/")}${item("search","Search","/search/")}</nav></header>`;
}

function footer() {
  return `<footer class="site-footer public-footer"><span>Case Evidence Ledger</span><span><a href="${esc(withBase('/case-evidence-ledger_timeline.html'))}">Timeline</a> · <a href="${esc(withBase('/method/'))}">Methodology</a></span><span>Generated documentary interface</span></footer>`;
}

function head(title, description) {
  return `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)} · Case Evidence Ledger</title><meta name="description" content="${esc(description)}"><link rel="stylesheet" href="${esc(withBase('/assets/styles.css'))}"><link rel="stylesheet" href="${esc(withBase('/assets/public.css'))}"></head>`;
}

module.exports = { esc, header, footer, head };
