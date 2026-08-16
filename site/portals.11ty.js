const { withBase } = require("./_lib/paths.js");
const { esc, header, footer, head } = require("./_lib/public-shell.js");

const PORTALS = {
  counsel: {
    title: "For Counsel",
    eyebrow: "Professional route · Counsel",
    purpose: "Argument architecture, documentary sequence, adverse case and adjudicated propositions.",
    note: "This route is a reader-specific presentation over the same controlled evidence foundation. It does not create a separate evidential record or alter controlled propositions, facts, tensions or sources."
  },
  expert: {
    title: "For Expert Review",
    eyebrow: "Professional route · Expert review",
    purpose: "Clinical chronology, disputed relationships and questions requiring specialist opinion.",
    note: "This route is a reader-specific presentation over the same controlled evidence foundation. Documentary evidence remains distinct from specialist interpretation and from questions that require expert opinion."
  },
  governance: {
    title: "Governance & Regulatory",
    eyebrow: "Professional route · Governance & regulatory",
    purpose: "Record integrity, administrative sequence, data governance and institutional decision-making.",
    note: "This route is a reader-specific presentation over the same controlled evidence foundation. It does not create a separate record or convert governance questions into documentary findings."
  }
};

module.exports = class {
  data() {
    return {
      pagination: { data: "portalRouteNames", size: 1, alias: "portalName" },
      permalink: data => `/${data.portalName}/index.html`,
      eleventyExcludeFromCollections: true,
      portalRouteNames: Object.keys(PORTALS)
    };
  }

  render({ portalName }) {
    const portal = PORTALS[portalName];
    return `<!doctype html><html lang="en">${head(portal.title, portal.purpose)}<body class="route-portal route-${esc(portalName)}"><a class="skip-link" href="#content">Skip to content</a>${header(portalName)}<main id="content" class="portal-shell"><div class="portal-shell-inner"><div><a class="back-link" href="${esc(withBase('/'))}">← Back to home</a><div class="eyebrow">${esc(portal.eyebrow)}</div></div><article><h1>${esc(portal.title)}</h1><p class="lede">${esc(portal.purpose)}</p><p class="portal-shell-note">${esc(portal.note)}</p><div class="portal-shell-links"><a href="${esc(withBase('/evidence/'))}">Browse Evidence Foundation</a><a href="${esc(withBase('/search/'))}">Search the Evidence</a><a href="${esc(withBase('/case-evidence-ledger_timeline.html'))}">View Timeline</a><a href="${esc(withBase('/method/'))}">Read Methodology</a></div></article></div></main>${footer()}</body></html>`;
  }
};

module.exports.data = { portalRouteNames: Object.keys(PORTALS) };
