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
function fields(o) {
  if (o.object_type === "source_euid") return [["Source text", o.substantive_text], ["Source family", o.source_family], ["Source type", o.source_type], ["Source status", o.source_status], ["Statement status", o.statement_status], ["Event date", o.event_date], ["Document date", o.document_date]];
  if (o.object_type === "fact") return [["Controlled Fact", o.substantive_text], ["Evidence class", o.evidence_class], ["Qualification", o.qualification]];
  if (o.object_type === "tension") return [["Title", o.title], ["Documentary Tension", o.documentary_tension], ["Why It Matters", o.why_it_matters], ["Possible Reconciliation", o.possible_reconciliation], ["What Would Resolve It", o.what_would_resolve_it], ["Status", (o.resolution_status_source || []).join(" / ")]];
  if (["proposition", "supporting_proposition"].includes(o.object_type)) return [["Title", o.title], ["Controlled Proposition", o.substantive_text], ["Boundary", o.boundary], ["Strength", o.strength_source || o.strength]];
  if (o.object_type === "control_rule") return [["Title", o.title], ["Control Rule", o.substantive_text]];
  return [];
}
function documents(objects) {
  const docs = [];
  for (const object of objects) {
    if (!["source_euid","fact","tension","proposition","supporting_proposition","control_rule"].includes(object.object_type)) continue;
    const target = targetFor(object);
    if (!target) continue;
    for (const [field, value] of fields(object)) {
      if (!value) continue;
      docs.push({ object, field, value: String(value), target, type: searchType(object), key: `${object.id}-${field.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}` });
    }
  }
  return docs;
}

module.exports = class {
  data() {
    return {
      pagination: { data: "ledger.objects", size: 1, alias: "record", before: documents },
      permalink: data => `/search-index/${data.record.key}/index.html`,
      eleventyExcludeFromCollections: true
    };
  }
  render({ record }) {
    const o = record.object;
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>${esc(o.id)} · Search record</title></head><body><main data-pagefind-body data-pagefind-filter="object-type:${esc(record.type)}" data-pagefind-meta="object-id:${esc(o.id)}, object-title:${esc(o.title || o.id)}, target:${esc(record.target)}, field:${esc(record.field)}, source-status:${esc(o.source_status || "not-applicable")}"><h1>${esc(o.id)} — ${esc(o.title || o.id)}</h1><h2>${esc(record.field)}</h2><p>${esc(record.value)}</p></main></body></html>`;
  }
};
