#!/usr/bin/env python3
from __future__ import annotations
import html
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / os.environ.get("SITE_OUTPUT_DIR", "_site")
OBJECTS = ROOT / "site-data/generated/objects.json"
NOTICE = "Generated from the controlled repository evidence graph. This page is an interface view, not an independent evidential source."

def load_objects():
    payload = json.loads(OBJECTS.read_text(encoding="utf-8"))
    for key in ("objects", "items", "data"):
        if isinstance(payload, dict) and isinstance(payload.get(key), list):
            return payload[key]
    if isinstance(payload, list):
        return payload
    raise AssertionError("objects.json has no object array")

def canonical(o):
    if not o or o.get("id_kind") != "evidential": return None
    oid, typ = o["id"], o["object_type"]
    if typ == "source_euid": return f"/evidence/euids/{oid}/"
    if typ == "fact": return f"/evidence/facts/{oid}/"
    if typ == "tension": return f"/evidence/tensions/{oid}/"
    if typ in {"proposition", "supporting_proposition"}: return f"/evidence/propositions/{oid}/"
    return None

def file_for(url):
    clean = url.strip("/")
    return OUT / clean / "index.html" if clean else OUT / "index.html"

def contains_exact(rendered, value):
    if not value: return True
    encoded = html.escape(str(value), quote=True).replace("&#x27;", "&#39;")
    return encoded in rendered

def main():
    objects = load_objects()
    by_id = {o["id"]: o for o in objects}
    urls = {}
    errors = []
    for o in objects:
        url = canonical(o)
        if not url: continue
        if url in urls: errors.append(f"duplicate canonical path {url}: {urls[url]} / {o['id']}")
        urls[url] = o["id"]
        target = file_for(url)
        if not target.exists():
            errors.append(f"missing object page {url}")
            continue
        rendered = target.read_text(encoding="utf-8")
        if NOTICE not in rendered: errors.append(f"missing generated-view notice {o['id']}")
        if o.get("substantive_text") and not contains_exact(rendered, o["substantive_text"]): errors.append(f"substantive text not preserved {o['id']}")
        if o["object_type"] == "proposition" and not contains_exact(rendered, o.get("boundary")): errors.append(f"missing Proposition Boundary {o['id']}")
        if o["object_type"] == "fact" and not contains_exact(rendered, o.get("qualification")): errors.append(f"missing Fact Qualification {o['id']}")
        if o["object_type"] == "tension" and not contains_exact(rendered, o.get("possible_reconciliation")): errors.append(f"missing Tension Possible Reconciliation {o['id']}")
        for ids in o.get("relationships", {}).values():
            for ref in ids:
                related = by_id.get(ref)
                related_url = canonical(related)
                if related_url and not file_for(related_url).exists(): errors.append(f"broken relationship {o['id']} -> {ref}")
    required = ["/", "/counsel/", "/expert/", "/governance/", "/evidence/", "/evidence/facts/", "/evidence/tensions/", "/evidence/propositions/", "/evidence/euids/", "/method/", "/search/"]
    for url in required:
        if not file_for(url).exists(): errors.append(f"missing site route {url}")
    home = file_for("/").read_text(encoding="utf-8") if file_for("/").exists() else ""
    for phrase in ["For Counsel", "For Expert Review", "Governance &amp; Regulatory", "One Evidential Foundation"]:
        if phrase not in home: errors.append(f"homepage hierarchy missing: {phrase}")
    if not (OUT / "404.html").exists(): errors.append("missing object handling / 404.html")
    for oid in ["P001","P003","P024","F0162","T002","T022","S001"]:
        if oid not in by_id: errors.append(f"representative object absent from graph: {oid}")
        else:
            url = canonical(by_id[oid])
            if not url or not file_for(url).exists(): errors.append(f"representative page not rendered: {oid}")
    props_index = file_for("/evidence/propositions/").read_text(encoding="utf-8") if file_for("/evidence/propositions/").exists() else ""
    if 'id="C001"' not in props_index: errors.append("representative control rule C001 not rendered on propositions index")
    print(f"Checked {len(urls)} canonical evidence pages and {len(required)} site routes in {OUT.name}.")
    if errors:
        for error in errors: print(f"ERROR: {error}")
        return 1
    print("EVIDENCE FOUNDATION SITE CHECK PASSED")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
