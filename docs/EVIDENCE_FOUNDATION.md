# Canonical Evidence Foundation

## Status

Gate 3 implementation for the Case Evidence Ledger. The static interface is a generated projection of the validated evidence graph and is not an independent evidential source.

## Build flow

```text
controlled Markdown
→ schema 1.0.0
→ existing parser / validator
→ site-data/generated/*.json
→ Eleventy
→ canonical static HTML
```

Eleventy reads the generated graph through `site/_data/ledger.js`. It does not parse the large controlled Markdown files and it does not duplicate substantive evidence into templates.

## Routes

Canonical object routes follow schema 1.0.0:

- `/evidence/`
- `/evidence/euids/{EUID}/`
- `/evidence/facts/{F-ID}/`
- `/evidence/tensions/{T-ID}/`
- `/evidence/propositions/{P-ID}/`
- `/evidence/propositions/{S-ID}/`

Collection routes are provided for EUIDs, Facts, Tensions and Propositions. Large EUID and Fact collections are paginated at build time. Control rules are displayed in the propositions collection but do not receive invented canonical URLs.

## Progressive disclosure

Object pages prioritize identity and controlled text. Boundaries, qualifications and reconciliations are prominent rather than hidden. Relationships, adverse analysis and provenance use native `<details>` disclosures where appropriate. All controlled content remains present in semantic HTML and usable without client JavaScript.

## Traceability

Canonical pages resolve typed relationships from the normalized graph. Proposition pages expose Tension and Fact links plus an evidence-path rail that can continue to a Source/EUID. Reverse relationships support navigation back from Sources, Facts and Tensions.

## Design system

The interface uses a bespoke CSS system with paper/ink surfaces, restrained object-layer accents, editorial serif display typography, compact monospace IDs, controlled line length, generous whitespace, responsive rails and print-specific rules. Colour is supplementary; every layer is also identified textually and structurally.

## Accessibility

The site uses semantic headings, landmarks, labels, native disclosure controls, visible focus states, high-contrast text, reduced-motion compatibility and responsive layouts without permanent mobile drawers or horizontal overflow.

## Print

Proposition, Fact and Tension pages remove navigation chrome and retain controlled text, Boundary/Qualification/Reconciliation, relationships, provenance and the generated-view notice. Print output remains visibly a generated repository view.

## Search and timeline scope

Full search is intentionally excluded from Gate 3. The Evidence Foundation includes a polished Gate 4 search affordance only. The existing documentary timeline is linked unchanged and is not regenerated.

## Validation

`python scripts/check_evidence_site.py` checks canonical path generation, object rendering, preserved substantive text, required Boundary/Qualification/Reconciliation fields, generated-view notices, relationship targets, duplicate canonical paths, missing-object handling and representative object coverage.

CI runs the existing parser tests and validation before building the static site. It then runs site checks and captures desktop, tablet and mobile screenshots for representative evidence pages.
