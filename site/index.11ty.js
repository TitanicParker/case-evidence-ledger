const { withBase } = require("./_lib/paths.js");
const { esc, header, footer, head } = require("./_lib/public-shell.js");

module.exports = class {
  data() {
    return { permalink: "/", eleventyExcludeFromCollections: true };
  }

  render() {
    const portals = [
      {
        number: "01",
        title: "For Counsel",
        path: "/counsel/",
        purpose: "Argument architecture, documentary sequence, adverse case and adjudicated propositions.",
        details: ["Case theory", "Proposition sequence", "Documentary support", "Adverse case", "Expert-gated boundaries"],
        action: "Enter counsel view"
      },
      {
        number: "02",
        title: "For Expert Review",
        path: "/expert/",
        purpose: "Clinical chronology, disputed relationships and questions requiring specialist opinion.",
        details: ["Source-led chronology", "Medication-state evidence", "Unresolved clinical relationships", "Expert questions", "Limits of inference"],
        action: "Enter expert view"
      },
      {
        number: "03",
        title: "Governance & Regulatory",
        path: "/governance/",
        purpose: "Record integrity, administrative sequence, data governance and institutional decision-making.",
        details: ["Accuracy and completeness", "Administrative sequence", "Complaints / governance", "Reliance", "Regulatory questions"],
        action: "Enter governance view"
      }
    ];

    const cards = portals.map(portal => `<a class="portal-card" href="${esc(withBase(portal.path))}"><span class="portal-number">${portal.number}</span><h2>${esc(portal.title)}</h2><p>${esc(portal.purpose)}</p><div class="portal-detail">${portal.details.map(detail => `<span>${esc(detail)}</span>`).join("")}</div><span class="portal-action">${esc(portal.action)}</span></a>`).join("");

    return `<!doctype html><html lang="en">${head("A Controlled Documentary Record", "One controlled evidential foundation presented through three professional reader routes.")}<body class="route-home"><a class="skip-link" href="#content">Skip to content</a>${header("home")}<main id="content" class="home-main"><section class="home-hero"><div class="eyebrow">Case Evidence Ledger</div><h1>A Controlled Documentary Record</h1><div class="home-intro"><p class="strap">One evidential foundation, presented through three reader-specific routes.</p><p>The represented record is separated into source evidence, controlled facts, evidential tensions and propositions so that interpretation remains distinguishable from documentary fact and each proposition can be traced back to the record.</p></div></section><section class="portal-section" aria-labelledby="portal-heading"><div class="portal-section-heading"><div><div class="eyebrow">Three professional routes</div><h2 id="portal-heading" class="visually-hidden">Choose a professional route into the record</h2></div><p>Different readings. One controlled evidence base.</p></div><div class="portal-grid">${cards}</div></section><section class="foundation-band" aria-labelledby="foundation-heading"><div><div class="eyebrow">Common infrastructure</div><h2 id="foundation-heading">One Evidential Foundation</h2></div><div class="foundation-copy"><p>All three routes are generated from the same controlled evidence graph. Reader-specific views do not create separate versions of the evidence.</p><div class="foundation-links"><a href="${esc(withBase('/evidence/'))}">Browse Evidence Foundation</a><a href="${esc(withBase('/search/'))}">Search the Evidence</a><a href="${esc(withBase('/case-evidence-ledger_timeline.html'))}">View Timeline</a><a href="${esc(withBase('/method/'))}">Read Methodology</a></div></div></section></main>${footer()}</body></html>`;
  }
};
