const { withBase } = require("./_lib/paths.js");

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function targetFor(o) {
  if (o.canonical_url) return o.canonical_url;
  if (o.object_type === "control_rule") return `/evidence/propositions/#${o.id}`;
  return null;
}

function searchType(o) {
  if (o.object_type === "source_euid") return "source";
  if (o.object_type === "supporting_proposition") return "proposition";
  if (o.object_type === "control_rule") return "control";
  return o.object_type;
}

function sections(o) {
  if (o.object_type === "source_euid") return [["Source text", o.substantive_text], ["Source family", o.source_family], ["Source type", o.source_type], ["Source status", o.source_status], ["Statement status", o.statement_status], ["Event date", o.event_date], ["Document date", o.document_date]];
  if (o.object_type === "fact") return [["Controlled Fact", o.substantive_text], ["Evidence class", o.evidence_class], ["Qualification", o.qualification]];
  if (o.object_type === "tension") return [["Documentary Tension", o.documentary_tension], ["Why It Matters", o.why_it_matters], ["Possible Reconciliation", o.possible_reconciliation], ["What Would Resolve It", o.what_would_resolve_it], ["Status", (o.resolution_status_source || []).join(" / ")]];
  if (["proposition", "supporting_proposition"].includes(o.object_type)) return [["Controlled Proposition", o.substantive_text], ["Boundary", o.boundary], ["Strength", o.strength_source || o.strength]];
  if (o.object_type === "control_rule") return [["Control Rule", o.substantive_text]];
  return [];
}

module.exports = class {
  data() {
    return {
      pagination: {
        data: "ledger.objects",
        size: 1,
        alias: "object",
        before: objects => objects.filter(o => ["source_euid","fact","tension","proposition","supporting_proposition","control_rule"].includes(o.object_type))
      },
      permalink: data => `/search-index/${data.object.id}/index.html`,
      eleventyExcludeFromCollections: true
    };
  }
  render({ object }) {
    const target = targetFor(object);
    if (!target) return "";
    const type = searchType(object);
    const title = object.title || object.id;
    const metadata = `object-id:${object.id}, object-type:${type}, target:${target}, source-status:${object.source_status || "not-applicable"}`;
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>${esc(object.id)} · Search record</title></head><body><main data-pagefind-body data-pagefind-filter="object-type:${esc(type)}" data-pagefind-meta="${esc(metadata)}"><h1 data-pagefind-meta="title">${esc(object.id)} — ${esc(title)}</h1>${sections(object).filter(([,value]) => value).map(([label,value]) => `<section><h2>${esc(label)}</h2><p>${esc(value)}</p></section>`).join("")}</main><p><a href="${esc(withBase(target))}">Open controlled object</a></p></body></html>`;
  }
};
