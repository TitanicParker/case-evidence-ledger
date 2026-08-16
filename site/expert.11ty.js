const { renderPortal } = require("./_lib/portal-shell.js");
module.exports = class {
  data() { return { permalink: "/expert/index.html", eleventyExcludeFromCollections: true }; }
  render() { return renderPortal({ key: "expert", title: "For Expert Review", eyebrow: "Professional route · Expert review", purpose: "Clinical chronology, disputed relationships and questions requiring specialist opinion.", note: "This route is a reader-specific presentation over the same controlled evidence foundation. Documentary evidence remains distinct from specialist interpretation and from questions that require expert opinion." }); }
};
