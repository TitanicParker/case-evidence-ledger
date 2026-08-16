# Evidence Search and GitHub Pages

## Status

Gate 4 adds static Evidence Search, exact-ID retrieval and deployment base-path hardening over the Gate 3 Canonical Evidence Foundation. Search is a derived interface over the controlled evidence graph and is not an independent evidential source.

## Search architecture

```text
controlled Markdown
→ schema 1.0.0
→ parser / validator
→ normalized graph
→ Eleventy canonical HTML + field-labelled search documents
→ Pagefind static index
→ lightweight browser search UI
```

The browser does not receive or parse the 4,956-object normalized graph. Pagefind indexes build-time search documents generated from the normalized graph. Each indexed field is emitted as a separate search document so a returned snippet retains its documentary context.

## Exact-ID resolution

`/search/id-map.json` is generated at build time from the graph-derived object set. The browser normalizes safe identifier input by trimming whitespace and comparing case-insensitively.

Supported controlled IDs include:

- EUIDs;
- `F####` Facts;
- `T###` Tensions;
- `P###` core Propositions;
- `S###` supporting Propositions;
- `C###` Control Rules.

Canonical evidence objects open their existing canonical route. Control Rules do not acquire invented canonical object URLs: exact retrieval resolves them to the existing Propositions collection anchor such as `/evidence/propositions/#C001`.

An ID-shaped query absent from the generated map returns an explicit not-found state and is not fuzzily redirected to another evidence ID.

## Indexed evidence layers

Default search includes:

- Source / EUID;
- Fact;
- Tension;
- Proposition, including supporting Propositions.

Control Rules are indexed but are opt-in in the object-type filters. Defence Audit and Adjudication text are deliberately excluded from the initial Gate 4 search corpus so analytical statements cannot appear as controlled factual evidence.

Indexed fields are intentionally source-aware:

- Sources / EUIDs: identifier/title metadata, source text, family, type, status and represented dates;
- Facts: controlled Fact, Evidence class and Qualification;
- Tensions: title, Documentary Tension, Why It Matters, Possible Reconciliation, What Would Resolve It and Status;
- Propositions: title, controlled proposition, Boundary and Strength;
- Control Rules: title and controlled rule text.

## Field-labelled snippets

Each field is indexed separately. Search results therefore identify `Matched in Boundary`, `Matched in Qualification`, `Matched in Possible Reconciliation`, or another explicit field label instead of concatenating unrelated content into an apparent sentence.

Pagefind determines normal full-text ranking. The interface does not expose raw scores or add case-theory importance weighting. Exact controlled IDs are handled separately and deterministically.

## Filters and URL state

The initial filter is intentionally restrained to evidence layer. Default filters are Source / EUID, Fact, Tension and Proposition. Control Rules can be enabled explicitly. Search query and selected object types are stored in the URL, for example:

`/search/?q=PRKN&type=proposition`

Browser back/forward navigation restores query and filter state.

## Base-path architecture

Evidential identity and deployment location are separate concepts.

A Fact retains the logical canonical evidence identity:

`/evidence/facts/F0162/`

A GitHub project Pages deployment may expose that identity at:

`/case-evidence-ledger/evidence/facts/F0162/`

`site/_lib/paths.js` is the single deployment-path helper. `SITE_BASE_PATH` configures navigation, assets, collection pagination, Evidence Paths, Timeline, Method, Search, exact-ID targets, 404 recovery and future deployment without placing the repository name into evidential IDs.

Supported build modes:

```bash
SITE_BASE_PATH=/ SITE_OUTPUT_DIR=_site-root npm run build
SITE_BASE_PATH=/case-evidence-ledger/ SITE_OUTPUT_DIR=_site-project npm run build
```

After Eleventy, run `npm run search:index` with the same `SITE_OUTPUT_DIR`.

## GitHub Pages deployment

`.github/workflows/pages.yml` prepares an Actions-based production deployment from `main` only. The build job runs parser tests, validation, graph consistency checks, the project-path Eleventy build, Pagefind indexing and site/search integrity checks before uploading a Pages artifact. The deployment job alone receives `pages: write` and `id-token: write`.

Pull requests never deploy production. `.github/workflows/evidence-search.yml` builds and browser-tests both root-host and project-Pages modes and uploads review screenshots/metrics instead.

The repository currently has legacy Pages configured from `main`. Gate 4 does not switch production publishing while Gates 2–4 remain stacked. Safe merge order is Gate 2 → Gate 3 → Gate 4. After those dependencies are on `main`, Pages can be switched to GitHub Actions and the prepared workflow can deploy the complete site.

A later custom domain can change deployment configuration without altering evidence IDs or templates because the site path remains configurable.

## 404 / identifier handling

The generated 404 page never creates an object dynamically. If the requested path ends in an ID-shaped token such as `F9999`, the page offers a Search link pre-populated with that identifier and a return to the Evidence Foundation.

## Accessibility

Search uses a labelled search field, semantic result headings, a polite live result-count region, fieldset/legend filter semantics, visible focus inherited from the Foundation, explicit textual evidence-layer labels, keyboard-safe native controls, `/` focus shortcut, Enter for unambiguous exact-ID opening and Escape to clear the search field.

## Performance

The browser loads the lightweight search UI and Pagefind index assets on demand. It does not ship the full normalized graph. Gate 4 CI records:

- browser search-page load time;
- first-query end-to-end and Pagefind engine time;
- warm-query time;
- Pagefind index size;
- search UI JavaScript bytes.

These measurements are included in the `evidence-search-review` workflow artifact.

## Test modes

Gate 4 CI verifies:

1. Gate 2 parser tests;
2. evidence validation;
3. evidence graph consistency;
4. Gate 3 canonical site checks;
5. Pagefind index generation;
6. exact-ID behavior;
7. discovery queries and result type/target semantics;
8. root-host mode (`/`);
9. project-Pages mode (`/case-evidence-ledger/`) served beneath the actual prefix;
10. base-path/broken-link checks;
11. responsive screenshots at 1440×1000, 900×1100 and 390×844.

The required query review includes `P024`, `F0162`, `T022`, `N18-20180424-0054`, `Not clear`, `PRKN`, `Procyclidine`, `OFF`, `Podiatry`, a zero-result state and a filtered search state.
