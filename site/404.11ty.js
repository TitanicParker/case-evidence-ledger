const { basePath, withBase } = require("./_lib/paths.js");

module.exports = class {
  data() { return { permalink: "/404.html" }; }
  render() {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Evidence object not found · Case Evidence Ledger</title><link rel="stylesheet" href="${withBase('/assets/styles.css')}"></head><body data-base-path="${basePath}"><main class="not-found"><p class="eyebrow">Case Evidence Ledger</p><h1>Evidence object not found</h1><p>This generated Evidence Foundation has no canonical object at that path.</p><p id="missing-id-action"><a href="${withBase('/search/')}">Search the controlled evidence graph</a></p><p><a href="${withBase('/evidence/')}">Return to the Evidence Foundation</a></p></main><script>const base=document.body.dataset.basePath||'/';const clean=location.pathname.startsWith(base)?location.pathname.slice(base.length):location.pathname.replace(/^\\/+/, '');const parts=clean.split('/').filter(Boolean);const candidate=(parts.at(-1)||'').toUpperCase();if(/^(?:F\\d{4}|[PTSC]\\d{3}|[A-Z0-9]+-(?:\\d{8}|GEN|UNMAPPED)-\\d{4})$/.test(candidate)){const a=document.querySelector('#missing-id-action a');a.textContent='Search '+candidate+' →';a.href=base+'search/?q='+encodeURIComponent(candidate);}</script></body></html>`;
  }
};
