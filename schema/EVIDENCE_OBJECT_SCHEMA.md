# Evidence Object Schema

**Status:** Frozen schema `1.0.0` for parser/validator implementation  
**Scope:** Structural representation only. This schema does not alter, restate, or adjudicate substantive evidence.  
**Primary rule:** Human-readable repository sources remain authoritative for controlled content; generated structured representations are derived interface artifacts.

## 1. Purpose

This schema defines the minimum object and relationship model required for the repository to act as a maintainable static documentary database while preserving the repository's existing evidential distinctions.

The model is designed to support stable source and evidence identifiers, controlled Facts/Tensions/Propositions, argument structures, adverse audit and adjudication, audience-specific retrieval without substantive duplication, traceability to source evidence, build-time validation, static GitHub Pages generation, search and printable views.

The website and generated JSON must be projections of these controlled objects, not independent evidence sources.

## 2. Evidential hierarchy

```text
SOURCE / EUID
→ FACT
→ EVIDENTIAL TENSION
→ PROPOSITION
→ ARGUMENT ARCHITECTURE
→ ADVERSE AUDIT
→ ADJUDICATION
→ AUDIENCE-SPECIFIC VIEW
```

This chain expresses dependency and traceability, not a rule that every object has exactly one parent. Objects form a graph.

## 3. Authority tiers

### Tier 0 — controlling source representation
Native exhibits or their controlling public repository representations remain evidentially controlling where the repository says they control.

### Tier 1 — controlled repository objects
Human-readable repository documents containing EUIDs, Facts, Tensions, Propositions, argument structures, audit and adjudication are authoritative for the repository's controlled interpretation layer.

### Tier 2 — generated structured interface
Generated JSON, search indexes, relationship manifests, timelines and site metadata are derived and reproducible. They are not independent evidential sources.

### Tier 3 — generated audience views
Expert, Counsel, Governance and Evidence Foundation pages are views over Tier 1 objects. They may select, order and progressively disclose controlled objects but must not create competing substantive versions.

## 4. Global normalized object contract

Every normalized object MUST expose this universal field set:

| Field | Required | Meaning |
|---|---:|---|
| `id` | yes | Unique normalized object identifier |
| `id_kind` | yes | `evidential` or `implementation` |
| `object_type` | yes | Controlled type from `vocabulary.yml` |
| `source_file` | yes | Repository file containing the authoritative controlled text |
| `source_anchor` | yes | Stable parser/build anchor for the object |
| `relationships` | yes | Typed references; may be empty where structurally valid |
| `metadata` | yes | Controlled classificatory metadata; `{}` is valid |
| `provenance` | yes | Build/source provenance fields defined below |

`title` and `substantive_text` are object-dependent rather than globally required. Where an object is represented by several controlled textual fields (for example an argument stage or adjudication), the parser MUST preserve those fields separately and MUST NOT synthesize replacement `substantive_text` merely to satisfy a generic contract.

All object-specific contracts below inherit the universal fields. Their lists therefore specify additional required fields only.

### 4.1 Evidential versus implementation IDs

Existing repository identifiers are evidential IDs and MUST be preserved exactly.

Some controlled analytical objects currently have stable source anchors but no explicit evidential ID. They still require a deterministic normalized `id` for parsing and graph operations.

For such objects the parser MUST derive an implementation ID as:

```text
impl:<object_type>:<source_file>#<source_anchor>
```

Rules:

1. `id_kind` MUST be `evidential` for existing EUID/F/T/P/S/C IDs and future explicitly controlled IDs.
2. `id_kind` MUST be `implementation` for derived parser IDs.
3. Implementation IDs are deterministic internal identifiers, not evidential identifiers.
4. Public UI MUST NOT present an implementation ID as though it were a controlled evidential ID.
5. If an explicit stable evidential ID is later introduced for the same source object, migration must be reviewed; the parser must not silently substitute it.

## 5. Stable ID namespaces

Existing namespaces:

- EUID — source-level evidence identifiers.
- `F####` — controlled Facts.
- `T###` — Evidential Tensions.
- `P###` — core Propositions.
- `S###` — supporting Propositions.
- `C###` — evidential control rules where represented as controlled objects.

Reserved future evidential namespaces:

- `A###` — argument stages if explicitly introduced.
- `DA###` — defence-audit entries if explicitly introduced.
- `AJ###` — adjudication entries if explicitly introduced.
- `EQ###` — expert questions.

Changing wording MUST NOT change an existing stable evidential ID unless the repository intentionally retires the object and creates a distinct object.

## 6. Object types

### 6.1 `source_euid`

Additional required fields:

```text
substantive_text
source_family
source_status
```

Optional:

```text
event_date
document_date
finalised_date
received_date
source_type
source_document_id
repository_source_path
```

Rules:

- source text must not be silently clinically corrected;
- OCR uncertainty, redactions and source damage remain visible;
- later reproduction does not automatically become independent corroboration;
- source/event dates remain distinct from repository/build dates.

### 6.2 `fact`

Additional required fields:

```text
substantive_text
evidence_ids[]
evidence_class
qualification
```

Rules:

- every `evidence_ids` value MUST resolve to an addressable evidence/source object or explicitly recognized source identifier;
- source Fact wording and Qualification remain separate;
- a Fact must not be automatically promoted into negligence, causation, motive, dishonesty, legal effect or clinical-standard conclusions.

### 6.3 `tension`

Additional required fields:

```text
title
facts_engaged[]
tension_type_source
tension_type[]
documentary_tension
why_it_matters
possible_reconciliation
what_would_resolve_it
resolution_status_source[]
resolution_status[]
```

Rules:

1. Every `facts_engaged` ID MUST resolve to a Fact.
2. A Tension is not a historical Fact.
3. `possible_reconciliation` remains distinct from `documentary_tension`.
4. `what_would_resolve_it` is an evidential requirement, not proof that missing evidence exists.
5. Source status wording MUST be preserved in `resolution_status_source[]` and normalized deterministically via `resolution_status_source_map` in `vocabulary.yml`.

#### 6.3.1 Tension-type normalization

The source `**Type:**` field may contain one or more components separated by the literal slash `/`, for example:

```text
reasoning gap / operational-epistemic mismatch
operational / epistemic mismatch
documentary tension / mixed-mechanism issue
```

The parser MUST:

1. preserve the complete original field in `tension_type_source`;
2. split on `/`;
3. trim surrounding whitespace from each component;
4. preserve component order;
5. map each component using `tension_type_source_component_map` in `vocabulary.yml`;
6. emit the ordered mapped values in `tension_type[]`;
7. fail validation if any component has no controlled mapping.

The parser MUST NOT collapse a composite type into a guessed single category.

Example:

```text
source: reasoning gap / operational-epistemic mismatch
normalized: [reasoning-gap, operational-epistemic-mismatch]
```

#### 6.3.2 Resolution-status normalization

The source may carry multiple controlled statuses separated by `/`. The parser MUST preserve each source label and normalize each independently using the explicit map.

The frozen source-to-normalized mappings include:

```text
UNRESOLVED                → unresolved
PARTIALLY RECONCILABLE    → partially-reconcilable
REQUIRES ADDITIONAL SOURCE→ requires-additional-source
REQUIRES EXPERT EVIDENCE  → requires-expert-evidence
RESOLVED BY RECORD        → resolved-by-record
REPRESENTATION ISSUE ONLY → representation-issue-only
```

No source status may be silently renamed to a semantically different category.

### 6.4 `proposition`

Additional required fields:

```text
title
substantive_text
primary_fact_ids[]
tension_ids[]
strength
boundary
```

Rules:

- every referenced Fact and Tension MUST resolve;
- `strength` uses the controlled proposition-strength vocabulary;
- `boundary` remains independently displayable and travels with the proposition in every generated professional view;
- audience relevance is retrieval metadata, not a distinct proposition version.

### 6.5 `supporting_proposition`

Additional required fields:

```text
title
substantive_text
fact_ids[]
tension_ids[]
```

Rules mirror core propositions except no core-proposition strength is required unless supplied by the source.

### 6.6 `control_rule`

Additional required fields:

```text
title
substantive_text
```

Control rules are display/validation constraints and not historical evidence.

### 6.7 `argument_stage`

Additional required fields:

```text
title
question
controlling_proposition_ids[]
argument
strongest_alternative_explanation
surviving_point
evidential_status
```

Rules:

1. Argument stages do not add historical Facts.
2. All controlling Proposition IDs MUST resolve.
3. Document-only and expert-dependent conclusions remain distinguishable.
4. Until explicit `A###` IDs exist, `id` MUST be a deterministic implementation ID under section 4.1 and `id_kind` MUST be `implementation`.

### 6.8 `defence_audit`

Additional required fields:

```text
proposition_id
defence_position_source
defence_position
best_defence_answer
fact_ids[]
tension_ids[]
claimant_entitled_to_say
claimant_not_entitled_to_say
defence_vulnerability
evidence_needed
```

Rules:

1. `proposition_id` MUST resolve.
2. Audit text is an adverse-analysis layer, not a Fact.
3. Search/UI must label audit content as audit material.
4. Until explicit `DA###` IDs exist, `id` MUST be a deterministic implementation ID and `id_kind` MUST be `implementation`.
5. The original Defence Audit label MUST be preserved in `defence_position_source` and normalized only through the explicit map in `vocabulary.yml`.

The frozen source labels are:

```text
ACCEPT
ACCEPT BUT NEUTRALISE
PARTIALLY CONTEST
CONTEST
REQUIRES EXPERT EVIDENCE
```

Their normalized values are respectively:

```text
accept
accept-but-neutralise
partially-contest
contest
requires-expert-evidence
```

`PARTIALLY CONTEST` must never be normalized as `partially-accept`, and `CONTEST` must never be silently replaced by a generic `dispute` category.

### 6.9 `adjudication`

Additional required fields:

```text
proposition_id
defence_answer
adjudication_classes[]
why
disposition
```

Rules:

1. `proposition_id` MUST resolve.
2. Every adjudication class comes from the controlled vocabulary.
3. Disposition text must be available wherever the proposition is materially used in a Counsel-facing generated view.
4. Expert-adjudication classes must not be rendered as if the expert conclusion has already been determined.
5. Until explicit `AJ###` IDs exist, `id` MUST be a deterministic implementation ID and `id_kind` MUST be `implementation`.

### 6.10 `expert_question`

Additional required fields when introduced:

```text
title_or_question
question
proposition_ids[]
tension_ids[]
fact_ids[]
expert_domain[]
status
```

Rules:

- referenced controlled IDs MUST resolve;
- questions must request specialist determination without silently encoding the desired answer;
- expert conclusions are represented separately from the documentary proposition that generated the question.

## 7. Relationship model

Relationships MUST be typed. A generic untyped ID list is insufficient.

Normalized relationship keys:

```text
source_euids
fact_ids
tension_ids
proposition_ids
supporting_proposition_ids
control_rule_ids
argument_stage_refs
defence_audit_refs
adjudication_refs
expert_question_ids
```

Reverse relationships may be generated for convenience but do not change direction of authority.

## 8. Audience metadata

Allowed values:

```text
expert
counsel
governance
foundation
```

Rules:

- an object may belong to multiple audiences;
- `foundation` means directly discoverable in the Evidence Foundation, not more authoritative;
- audience metadata must not change substantive text, Fact qualifications, Tension reconciliation/status, Proposition boundaries, adjudication or provenance;
- no route may create an audience-specific canonical copy.

## 9. Controlled topic metadata

The initial topic vocabulary is deliberately small and defined in `vocabulary.yml`. Topics are retrieval aids only and MUST NOT replace explicit ID relationships.

## 10. Temporal model

A single undifferentiated `date` field is prohibited where the source architecture distinguishes temporal states.

Optional normalized temporal fields:

```text
event_date
document_date
finalised_date
received_date
recorded_date
```

Rules:

1. fields may be absent where the repository does not establish them;
2. unknown times must not be synthesized;
3. build/generated date is provenance, never evidential event date;
4. `UNMAPPED` source chronology remains representable.

## 11. Source-status and statement-status distinctions

The parser/UI must preserve, where represented:

- patient report versus clinician observation;
- clinical opinion/assessment versus objective documentary fact;
- structural pathology versus neurological phenomenon;
- administrative classification versus etiological conclusion;
- original source versus later reproduction;
- contemporaneous material versus retrospective account;
- document-state certainty versus clinical/etiological certainty.

The parser MUST NOT infer a stronger status than the controlled source provides.

## 12. Mandatory boundaries and qualifications

The following fields are mandatory display companions where present:

- Fact `qualification`;
- Tension `possible_reconciliation` and `resolution_status`;
- Proposition `boundary`;
- Adjudication `disposition`.

Generated routes may initially collapse them under progressive disclosure but may not omit them from canonical object representation or print output where substantively relied upon.

## 13. Provenance model

Every generated object MUST include:

```text
repository
source_file
source_anchor
source_blob_sha_or_commit
site_build_commit
generated_at
schema_version
```

Where available, source objects SHOULD include:

```text
source_manifest_id
source_hash
native_or_public_source_reference
```

Generated pages must visibly distinguish evidential/source date, repository-controlled version and site-generation date.

## 14. Generated-interface contract

Generated JSON/HTML MAY add:

```text
canonical_url
search_text
display_summary
reverse_relationships
reader_route_relevance
```

Rules:

- generated summary text never replaces controlled substantive text;
- generated summaries are labelled as generated/interface text;
- canonical object URLs remain audience-independent;
- generated files declare generated provenance;
- generated files are reproducible from repository-controlled inputs.

## 15. Canonical URL mapping

```text
/evidence/euids/{EUID}/
/evidence/facts/{F-ID}/
/evidence/tensions/{T-ID}/
/evidence/propositions/{P-ID}/
/evidence/propositions/{S-ID}/
```

Argument, audit, adjudication and expert-question public URLs may be added after their stable public-ID policy is separately frozen. Implementation IDs alone do not create public canonical URLs.

Professional routes link to canonical objects rather than create copies under `/expert/`, `/counsel/` or `/governance/`.

## 16. Parser validation requirements

The parser/validator MUST fail the build on:

1. duplicate normalized IDs;
2. duplicate controlled evidential IDs;
3. malformed controlled evidential IDs;
4. non-deterministic or missing implementation IDs;
5. a Proposition referencing a missing Fact;
6. a Proposition referencing a missing Tension;
7. a Tension referencing a missing Fact;
8. an Adjudication or Defence Audit referencing a missing Proposition;
9. invalid controlled-vocabulary values;
10. unknown source-to-normalized Defence Audit position;
11. unknown source-to-normalized Tension resolution status;
12. unknown tension-type source component;
13. a core Proposition without a Boundary;
14. an object without a stable source anchor;
15. a normalized object without `metadata` (use `{}` when no metadata is assigned);
16. duplicate canonical URL targets.

The parser SHOULD warn on:

1. orphan Facts not used by any higher object;
2. orphan Tensions;
3. expert-required Tensions with no mapped expert question once expert-question objects exist;
4. unresolved evidence identifiers;
5. missing provenance fields not yet available in the current repository;
6. duplicate substantive text under different IDs where accidental duplication is plausible.

## 17. Metadata sidecar policy

At this stage substantive controlled Markdown remains unchanged.

Audience and topic metadata SHOULD initially live in tightly controlled sidecar files keyed by stable evidential object ID.

Example:

```yaml
P024:
  audience: [expert, counsel, governance, foundation]
  topic: [reconstruction, treatment-state, representation]
  expert_dependency: contextual
```

Sidecars may classify existing objects but MUST NOT contain replacement proposition/fact text.

Implementation-only objects may receive build metadata programmatically; such metadata does not create an evidential identifier.

## 18. No-duplication rules

Architectural invariants:

1. a controlled Fact has one authoritative controlled text;
2. a controlled Tension has one authoritative controlled text;
3. a controlled Proposition has one authoritative controlled text and Boundary;
4. audience routes query those same objects;
5. search resolves to canonical object pages where a public canonical object exists;
6. print views are generated from the same graph;
7. timelines and summaries link back to controlled IDs rather than becoming independent evidence stores.

## 19. Schema versioning

Frozen schema version:

```text
1.0.0
```

Versioning rules:

- PATCH: clarification that does not change parser contract;
- MINOR: backward-compatible new optional field, mapping or controlled object type;
- MAJOR: breaking field, relationship or semantic change.

A schema-version change must not by itself change evidential IDs.

## 20. Freeze decision

Schema `1.0.0` is frozen for the parser/validator gate because:

- existing repository distinctions can be represented without substantive rewriting;
- Fact qualifications remain first-class;
- Tension reconciliation, source type wording and source resolution statuses remain first-class;
- composite tension types have deterministic, source-preserving normalization;
- Proposition boundaries remain first-class;
- Defence Audit categories map one-to-one from actual controlled source labels;
- adverse audit and adjudication remain distinguishable from Facts and Propositions;
- every normalized object has deterministic `id`, `id_kind`, `metadata`, relationships and provenance fields;
- implementation IDs are explicitly non-evidential and non-public;
- source-date/document-date/finalisation/receipt distinctions remain representable;
- audience routes can retrieve shared objects without copying them;
- the future parser can validate explicit relationships and controlled normalization deterministically.

No UI implementation should begin before the parser/validator gate is implemented and validated against this frozen contract.
