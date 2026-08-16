module.exports = class {
  data() { return { permalink: "/search/id-map.json", eleventyExcludeFromCollections: true }; }
  render({ ledger }) {
    const map = {};
    for (const o of ledger.objects) {
      if (o.id_kind !== "evidential") continue;
      let target = o.canonical_url;
      if (!target && o.object_type === "control_rule") target = `/evidence/propositions/#${o.id}`;
      if (!target) continue;
      map[o.id.toUpperCase()] = { id: o.id, object_type: o.object_type, target };
    }
    return JSON.stringify({ generated: true, schema_version: ledger.siteVersion.schema_version || "1.0.0", objects: map }, null, 2);
  }
};
