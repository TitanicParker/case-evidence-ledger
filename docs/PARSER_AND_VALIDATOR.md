# Parser and Validator

## Purpose

The parser implements evidence-object schema `1.0.0` as a deterministic build step. Human-readable Markdown remains authoritative. Generated JSON and reports are derived interface artifacts and are never independent evidential sources.

## Why Python

The implementation uses Python and the standard library only. The controlled Markdown grammar is explicit and modest, so a small source-specific parser is easier to review and maintain than a framework or database. Avoiding runtime dependencies also makes GitHub Actions and local reproduction simpler.

## Commands

Validate without writing generated artifacts:

```bash
python scripts/build_evidence_graph.py --validate
```

Build generated artifacts after successful validation:

```bash
python scripts/build_evidence_graph.py --build
```

Run tests:

```bash
python -m unittest discover -s tests -p 'test_*.py'
```

Exit code `0` means the parser gate has no fatal schema violations. Any fatal validation or parsing error returns a non-zero code. Warnings do not fail the build unless the schema is later changed to make that condition fatal.

## Architecture

The parser contains explicit source-specific parsers for:

- `sources-consolidated-evidence-corpus.md`
- `FACT_REGISTER.md`
- `EVIDENTIAL_TENSIONS.md`
- `PROPOSITION_REGISTER.md`
- `CASE_ARGUMENT_ARCHITECTURE.md`
- `DEFENCE_ADVERSE_CASE_AUDIT.md`
- `ADVERSE_CASE_ADJUDICATION.md`

The parser does not infer record grammar from one universal Markdown parser. Each controlled layer keeps its own source structure and is converted into the common normalized object contract only after source-specific extraction.

## Generated files

`--build` writes:

- `site-data/generated/objects.json`
- `site-data/generated/relationships.json`
- `site-data/generated/id-map.json`
- `site-data/generated/validation-report.json`
- `site-data/generated/site-version.json`
- `PARSER_VALIDATION_REPORT.md`

All generated JSON contains `generated: true` and `schema_version`. Objects are sorted by object type and ID. Relationship arrays are sorted deterministically.

## Deterministic IDs

Existing EUID, Fact, Tension, Proposition, Supporting Proposition and Control Rule IDs are preserved exactly and marked `id_kind: evidential`.

Objects without an explicit evidential ID use the frozen implementation-ID rule:

```text
impl:<object_type>:<source_file>#<source_anchor>
```

These IDs are deterministic graph identifiers only. They are marked `id_kind: implementation` and must not be presented as public evidential identifiers.

## Source anchors

Controlled IDs are used as anchors where they already exist. Analytical objects without explicit IDs use deterministic heading-derived slugs. Duplicate normalized IDs and missing anchors are fatal validation errors.

## Normalization rules

Normalization occurs only where schema `1.0.0` explicitly permits it.

### Tension types

The source `Type` field is preserved as `tension_type_source`. Composite types are split on the literal `/`, trimmed, kept in source order, and each component is mapped through `tension_type_source_component_map` in `schema/vocabulary.yml`.

Unknown components are fatal. The parser never guesses a replacement category.

### Resolution status

Every source status is preserved in `resolution_status_source` and normalized one-to-one through `resolution_status_source_map`. `RESOLVED BY RECORD` and `REPRESENTATION ISSUE ONLY` therefore remain distinct controlled states.

### Defence position

Every source Defence Position is preserved in `defence_position_source` and normalized through `defence_position_source_map`. `PARTIALLY CONTEST` is not converted to `partially-accept`, and `CONTEST` is not replaced by a generic dispute label.

### Proposition strength

The existing human-readable Strength values are mapped to the frozen strength slugs. Any unknown Strength is fatal.

## Typed relationships

Forward relationships are stored under controlled relationship keys such as:

- `source_euids`
- `fact_ids`
- `tension_ids`
- `proposition_ids`

Reverse relationships are generated convenience fields in `relationships.json`. They are explicitly marked generated and do not change evidential authority.

## Errors versus warnings

Fatal errors include duplicate IDs, malformed controlled IDs, missing required references, invalid controlled values, impossible normalization, missing Proposition Boundary, missing source anchor, invalid `id_kind`, missing mandatory metadata, and duplicate canonical URLs.

Warnings include orphan Facts/Tensions, unresolved non-canonical evidence identifiers, unavailable optional Git provenance, and potentially accidental duplicate substantive text.

The parser does not silently repair either category.

## Provenance

Every object records repository, source file, source anchor, schema version, source blob/commit where Git can supply it, build commit, and generated timestamp. When Git metadata is unavailable, the parser emits the explicit value `unavailable`; it never fabricates hashes or timestamps.

The generated timestamp is derived from the checked-out commit timestamp where Git is available, which keeps output deterministic for a given commit.

## Adding a new object type

A new object type requires:

1. schema/vocabulary review;
2. a source-specific grammar definition;
3. a deterministic ID/anchor rule;
4. relationship rules;
5. fatal validation rules;
6. representative tests;
7. any canonical-URL policy needed for public exposure.

Do not add a parser branch first and backfill schema later.

## Schema-version changes

PATCH changes may clarify behavior without changing the parser contract. MINOR changes may add backward-compatible optional fields, mappings, or object types. MAJOR changes cover breaking fields, relationships, or semantics.

The parser version is recorded separately from schema version so implementation changes can be audited without implying a change to evidential meaning.
