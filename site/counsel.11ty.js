const { renderPortal } = require("./_lib/portal-shell.js");
module.exports = class {
  data() { return { permalink: "/counsel/index.html", eleventyExcludeFromCollections: true }; }
  render() { return renderPortal({ key: "counsel", title: "For Counsel", eyebrow: "Professional route · Counsel", purpose: "Argument architecture, documentary sequence, adverse case and adjudicated propositions.", note: "This route is a reader-specific presentation over the same controlled evidence foundation. It does not create a separate evidential record or alter controlled propositions, facts, tensions or sources." }); }
};
