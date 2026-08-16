const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function unwrapObjects(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ["objects", "items", "data"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  throw new Error("site-data/generated/objects.json does not expose an object array");
}

function canonicalUrl(object) {
  if (object.canonical_url) return object.canonical_url;
  if (object.id_kind !== "evidential") return null;
  if (object.object_type === "source_euid") return `/evidence/euids/${object.id}/`;
  if (object.object_type === "fact") return `/evidence/facts/${object.id}/`;
  if (object.object_type === "tension") return `/evidence/tensions/${object.id}/`;
  if (["proposition", "supporting_proposition"].includes(object.object_type)) {
    return `/evidence/propositions/${object.id}/`;
  }
  if (object.object_type === "expert_question") return `/evidence/expert-questions/${object.id}/`;
  return null;
}

function chunk(values, size) {
  const pages = [];
  for (let index = 0; index < values.length; index += size) {
    pages.push(values.slice(index, index + size));
  }
  return pages;
}

module.exports = function() {
  const objectPayload = readJson("site-data/generated/objects.json");
  const relationshipPayload = readJson("site-data/generated/relationships.json");
  const siteVersion = readJson("site-data/generated/site-version.json");
  const objects = unwrapObjects(objectPayload).map(object => ({
    ...object,
    canonical_url: canonicalUrl(object)
  }));
  const byId = new Map(objects.map(object => [object.id, object]));

  const reverse = new Map();
  function register(target, relation, source) {
    if (!reverse.has(target)) reverse.set(target, {});
    const bucket = reverse.get(target);
    if (!bucket[relation]) bucket[relation] = [];
    if (!bucket[relation].includes(source)) bucket[relation].push(source);
  }

  for (const object of objects) {
    for (const target of object.relationships?.source_euids || []) register(target, "facts", object.id);
    for (const target of object.relationships?.fact_ids || []) {
      if (object.object_type === "tension") register(target, "tensions", object.id);
      if (["proposition", "supporting_proposition"].includes(object.object_type)) register(target, "propositions", object.id);
      if (object.object_type === "defence_audit") register(target, "audit", object.id);
    }
    for (const target of object.relationships?.tension_ids || []) {
      if (["proposition", "supporting_proposition"].includes(object.object_type)) register(target, "propositions", object.id);
      if (object.object_type === "defence_audit") register(target, "audit", object.id);
    }
    for (const target of object.relationships?.proposition_ids || []) {
      if (object.object_type === "argument_stage") register(target, "argument", object.id);
      if (object.object_type === "defence_audit") register(target, "audit", object.id);
      if (object.object_type === "adjudication") register(target, "adjudication", object.id);
    }
  }

  for (const value of reverse.values()) {
    for (const ids of Object.values(value)) ids.sort();
  }

  const facts = objects.filter(object => object.object_type === "fact").sort((a, b) => a.id.localeCompare(b.id));
  const euids = objects.filter(object => object.object_type === "source_euid").sort((a, b) => a.id.localeCompare(b.id));
  const tensions = objects.filter(object => object.object_type === "tension").sort((a, b) => a.id.localeCompare(b.id));
  const propositions = objects.filter(object => object.object_type === "proposition").sort((a, b) => a.id.localeCompare(b.id));
  const supporting = objects.filter(object => object.object_type === "supporting_proposition").sort((a, b) => a.id.localeCompare(b.id));
  const controls = objects.filter(object => object.object_type === "control_rule").sort((a, b) => a.id.localeCompare(b.id));
  const expertQuestions = objects.filter(object => object.object_type === "expert_question").sort((a, b) => a.id.localeCompare(b.id));
  const audits = objects.filter(object => object.object_type === "defence_audit");
  const adjudications = objects.filter(object => object.object_type === "adjudication");
  const auditByProposition = new Map(audits.map(object => [object.proposition_id, object]));
  const adjudicationByProposition = new Map(adjudications.map(object => [object.proposition_id, object]));

  function related(id, relation) {
    return (reverse.get(id)?.[relation] || []).map(ref => byId.get(ref)).filter(Boolean);
  }

  function enrich(object) {
    const result = {
      ...object,
      reverse: reverse.get(object.id) || {},
      audit: object.object_type === "proposition" ? auditByProposition.get(object.id) || null : null,
      adjudication: object.object_type === "proposition" ? adjudicationByProposition.get(object.id) || null : null
    };

    if (object.object_type === "source_euid") {
      const sourceFacts = related(object.id, "facts");
      const tensionIds = new Set();
      const propositionIds = new Set();
      for (const fact of sourceFacts) {
        for (const tension of related(fact.id, "tensions")) tensionIds.add(tension.id);
        for (const proposition of related(fact.id, "propositions")) propositionIds.add(proposition.id);
      }
      for (const tensionId of tensionIds) {
        for (const proposition of related(tensionId, "propositions")) propositionIds.add(proposition.id);
      }
      result.used_by = {
        facts: sourceFacts,
        tensions: [...tensionIds].sort().map(id => byId.get(id)).filter(Boolean),
        propositions: [...propositionIds].sort().map(id => byId.get(id)).filter(Boolean)
      };
    }
    return result;
  }

  const canonicalObjects = objects.filter(object => object.canonical_url && object.object_type !== "expert_question").map(enrich);
  const routes = [
    { kind: "landing", url: "/evidence/", title: "Controlled Evidence Foundation" },
    { kind: "method", url: "/method/", title: "Method & provenance" },
    { kind: "collection", collection: "tensions", page: 1, pages: 1, items: tensions.map(enrich), url: "/evidence/tensions/", title: "Evidential Tensions" },
    { kind: "collection", collection: "propositions", page: 1, pages: 1, items: [...propositions, ...supporting].map(enrich), controls, url: "/evidence/propositions/", title: "Controlled Propositions" }
  ];

  for (const [collection, items] of [["facts", facts], ["euids", euids]]) {
    const pages = chunk(items, 60);
    pages.forEach((pageItems, index) => {
      routes.push({
        kind: "collection",
        collection,
        page: index + 1,
        pages: pages.length,
        items: pageItems.map(enrich),
        url: index === 0 ? `/evidence/${collection}/` : `/evidence/${collection}/page/${index + 1}/`,
        title: collection === "facts" ? "Controlled Facts" : "Sources / EUIDs"
      });
    });
  }

  for (const object of canonicalObjects) {
    routes.push({ kind: "object", object, url: object.canonical_url, title: object.title || object.id });
  }

  return {
    objects,
    byId,
    routes,
    relationshipPayload,
    siteVersion,
    counts: {
      euids: euids.length,
      facts: facts.length,
      tensions: tensions.length,
      propositions: propositions.length,
      supporting: supporting.length,
      controls: controls.length,
      expertQuestions: expertQuestions.length,
      total: objects.length
    },
    collections: { facts, euids, tensions, propositions, supporting, controls, expertQuestions },
    related,
    enrich
  };
};
