#!/usr/bin/env python3
from __future__ import annotations
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / os.environ.get("SITE_OUTPUT_DIR", "_site")
BASE = os.environ.get("SITE_BASE_PATH", "/")
if not BASE.startswith("/"): BASE = "/" + BASE
if not BASE.endswith("/"): BASE += "/"

ABS_ATTR = re.compile(r'''(?:href|src)=["'](/[^"']*)["']''')

def main() -> int:
    errors: list[str] = []
    required = [
        OUT / "search" / "index.html",
        OUT / "search" / "id-map.json",
        OUT / "assets" / "search.js",
        OUT / "assets" / "search.css",
        OUT / "pagefind" / "pagefind.js",
        OUT / "404.html",
    ]
    for path in required:
        if not path.exists(): errors.append(f"missing search artifact: {path.relative_to(ROOT)}")

    id_map_path = OUT / "search" / "id-map.json"
    if id_map_path.exists():
        payload = json.loads(id_map_path.read_text(encoding="utf-8"))
        objects = payload.get("objects", {})
        expected = {
            "P024": "/evidence/propositions/P024/",
            "F0162": "/evidence/facts/F0162/",
            "T022": "/evidence/tensions/T022/",
            "N18-20180424-0054": "/evidence/euids/N18-20180424-0054/",
            "C001": "/evidence/propositions/#C001",
        }
        for oid, target in expected.items():
            actual = objects.get(oid, {}).get("target")
            if actual != target: errors.append(f"exact-ID map mismatch {oid}: {actual!r} != {target!r}")

    html_files = list(OUT.rglob("*.html"))
    for path in html_files:
        text = path.read_text(encoding="utf-8", errors="replace")
        for match in ABS_ATTR.finditer(text):
            value = match.group(1)
            if BASE == "/":
                continue
            if not value.startswith(BASE):
                errors.append(f"unprefixed absolute site link in {path.relative_to(OUT)}: {value}")
        if path.name == "index.html" and path.parent.name == "search":
            for needle in ["Evidence Search", "Search results are generated from the controlled evidence graph", "data-base-path"]:
                if needle not in text: errors.append(f"search page missing {needle!r}")

    records = list((OUT / "search-index").glob("*/index.html")) if (OUT / "search-index").exists() else []
    if len(records) < 1000: errors.append(f"unexpectedly small field-labelled search corpus: {len(records)} records")
    joined_sample = "\n".join(p.read_text(encoding="utf-8", errors="replace") for p in records[:3000])
    for field in ["Qualification", "Possible Reconciliation", "Boundary"]:
        if field not in joined_sample: errors.append(f"search corpus missing labelled field: {field}")

    search_js = (OUT / "assets" / "search.js").read_text(encoding="utf-8") if (OUT / "assets" / "search.js").exists() else ""
    if "defence_audit" in search_js or "adjudication" in search_js:
        errors.append("default browser search unexpectedly references analytical object types")

    print(f"Checked {len(html_files)} HTML files at base path {BASE} and {len(records)} field-labelled search records.")
    if errors:
        for error in errors[:100]: print("ERROR:", error)
        if len(errors) > 100: print(f"ERROR: {len(errors)-100} additional errors omitted")
        return 1
    print("EVIDENCE SEARCH STATIC CHECK PASSED")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
