const { withBase } = require("./paths.js");
const { esc, header, footer, head } = require("./public-shell.js");

function renderPortal({ key, title, eyebrow, purpose, note }) {
  return `<!doctype html><html lang="en">${head(title, purpose)}<body class="route-portal route-${esc(key)}"><a class="skip-link" href="#content">Skip to content</a>${header(key)}<main id="content" class="portal-shell"><div class="portal-shell-inner"><div><a class="back-link" href="${esc(withBase('/'))}">← Back to home</a><div class="eyebrow">${esc(eyebrow)}</div></div><article><h1>${esc(title)}</h1><p class="lede">${esc(purpose)}</p><p class="portal-shell-note">${esc(note)}</p><div class="portal-shell-links"><a href="${esc(withBase('/evidence/'))}">Browse Evidence Foundation</a><a href="${esc(withBase('/search/'))}">Search the Evidence</a><a href="${esc(withBase('/case-evidence-ledger_timeline.html'))}">View Timeline</a><a href="${esc(withBase('/method/'))}">Read Methodology</a></div></article></div></main>${footer()}</body></html>`;
}

module.exports = { renderPortal };
