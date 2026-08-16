const { renderPortal } = require("./_lib/portal-shell.js");
module.exports = class {
  data() { return { permalink: "/governance/index.html", eleventyExcludeFromCollections: true }; }
  render() { return renderPortal({ key: "governance", title: "Governance & Regulatory", eyebrow: "Professional route · Governance & regulatory", purpose: "Record integrity, administrative sequence, data governance and institutional decision-making.", note: "This route is a reader-specific presentation over the same controlled evidence foundation. It does not create a separate record or convert governance questions into documentary findings." }); }
};
