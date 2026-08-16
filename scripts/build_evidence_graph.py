#!/usr/bin/env python3
"""Build and validate the Case Evidence Ledger normalized evidence graph.

Parser output is a derived interface artifact, not a new evidential source.
Standard-library only by design: the repository grammar is explicit enough that the
frozen schema/vocabulary can be consumed without a general framework or database.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "1.0.0"
PARSER_VERSION = "1.0.0"
REPOSITORY = "TitanicParker/case-evidence-ledger"
GENERATED_DIR = ROOT / "site-data" / "generated"

SOURCE_FILES = [
    "sources-consolidated-evidence-corpus.md",
    "FACT_REGISTER.md",
    "EVIDENTIAL_TENSIONS.md",
    "PROPOSITION_REGISTER.md",
    "CASE_ARGUMENT_ARCHITECTURE.md",
    "DEFENCE_ADVERSE_CASE_AUDIT.md",
    "ADVERSE_CASE_ADJUDICATION.md",
]

CONTROLLED_ID_RE = re.compile(r"^(?:F\d{4}|T\d{3}|P\d{3}|S\d{3}|C\d{3})$")
EUID_RE = re.compile(r"^[A-Z0-9]+-(?:\d{8}|GEN|UNMAPPED)-\d{4}$")

class GateError(Exception):
    pass


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def git_value(*args: str) -> str | None:
    try:
        p = subprocess.run(["git", *args], cwd=ROOT, text=True, capture_output=True, check=True)
        return p.stdout.strip() or None
    except Exception:
        return None


def provenance(path: str) -> dict[str, Any]:
    commit = git_value("rev-parse", "HEAD")
    blob = git_value("rev-parse", f"HEAD:{path}")
    generated_at = git_value("show", "-s", "--format=%cI", "HEAD") or "unavailable"
    return {
        "repository": REPOSITORY,
        "source_file": path,
        "source_anchor": None,
        "source_blob_sha_or_commit": blob or commit or "unavailable",
        "site_build_commit": commit or "unavailable",
        "generated_at": generated_at,
        "schema_version": SCHEMA_VERSION,
    }


def slugify(text: str) -> str:
    text = text.lower().replace("’", "'")
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "section"


def impl_id(object_type: str, source_file: str, anchor: str) -> str:
    return f"impl:{object_type}:{source_file}#{anchor}"


def split_heading_blocks(text: str, pattern: re.Pattern[str]) -> list[tuple[re.Match[str], str]]:
    matches = list(pattern.finditer(text))
    out = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        out.append((m, text[m.end():end].strip()))
    return out


def field_map(block: str) -> dict[str, str]:
    """Parse bold Markdown fields, preserving multiline field bodies."""
    rx = re.compile(r"(?m)^\*\*([^*]+):\*\*\s*(.*)$")
    matches = list(rx.finditer(block))
    result: dict[str, str] = {}
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(block)
        first = m.group(2).rstrip()
        tail = block[m.end():end].strip()
        value = first
        if tail:
            value = (first + "\n" + tail).strip() if first else tail
        result[m.group(1).strip()] = value.strip()
    return result


def clean_code(value: str) -> str:
    return value.replace("`", "").strip().rstrip(".")


def extract_ids(value: str, prefix: str) -> list[str]:
    width = {"F": 4, "T": 3, "P": 3, "S": 3, "C": 3}[prefix]
    token = rf"{prefix}\d{{{width}}}"
    ids: list[str] = []
    for a, b in re.findall(rf"`({token})`\s*[–—-]\s*`({token})`", value):
        start, stop = int(a[1:]), int(b[1:])
        if stop >= start and stop - start <= 1000:
            ids.extend(f"{prefix}{i:0{width}d}" for i in range(start, stop + 1))
    ids.extend(re.findall(token, value))
    return sorted(set(ids), key=lambda x: int(x[1:]))


def parse_vocab() -> dict[str, Any]:
    text = read("schema/vocabulary.yml")
    def list_section(name: str) -> list[str]:
        m = re.search(rf"(?ms)^{re.escape(name)}:\s*\n((?:  - .*\n)+)", text)
        return [ln.strip()[2:].strip() for ln in m.group(1).splitlines()] if m else []
    def map_section(name: str) -> dict[str, str]:
        m = re.search(rf"(?ms)^{re.escape(name)}:\s*\n((?:  [^\n]+\n)+)", text)
        out: dict[str, str] = {}
        if not m:
            return out
        for line in m.group(1).splitlines():
            if ":" not in line:
                continue
            key, val = line.strip().split(":", 1)
            key = key.strip().strip('"').strip("'")
            val = val.strip().strip('"').strip("'")
            out[key] = val
        return out
    return {
        "object_type": list_section("object_type"),
        "id_kind": list_section("id_kind"),
        "proposition_strength": list_section("proposition_strength"),
        "resolution_status": list_section("resolution_status"),
        "tension_type": list_section("tension_type"),
        "defence_position": list_section("defence_position"),
        "resolution_status_source_map": map_section("resolution_status_source_map"),
        "tension_type_source_component_map": map_section("tension_type_source_component_map"),
        "defence_position_source_map": map_section("defence_position_source_map"),
    }


def normalize_strength(source: str) -> str:
    mapping = {
        "Direct documentary": "direct-documentary",
        "Near-direct documentary inference": "near-direct-documentary-inference",
        "Strong documentary inference": "strong-documentary-inference",
        "Qualified documentary inference": "qualified-documentary-inference",
    }
    if source not in mapping:
        raise GateError(f"unknown proposition strength: {source}")
    return mapping[source]


def base_obj(object_id: str, id_kind: str, object_type: str, source_file: str, anchor: str) -> dict[str, Any]:
    p = provenance(source_file)
    p["source_anchor"] = anchor
    return {
        "id": object_id,
        "id_kind": id_kind,
        "object_type": object_type,
        "source_file": source_file,
        "source_anchor": anchor,
        "relationships": {},
        "metadata": {},
        "provenance": p,
    }


def parse_corpus() -> list[dict[str, Any]]:
    path = "sources-consolidated-evidence-corpus.md"
    text = read(path)
    heading_rx = re.compile(r"(?m)^##\s+([^\n]+)$")
    entry_rx = re.compile(r"(?m)^\[([A-Z0-9]+-(?:\d{8}|GEN|UNMAPPED)-\d{4})\]\s*$")
    headings = list(heading_rx.finditer(text))
    entries = list(entry_rx.finditer(text))
    objects = []
    for i, m in enumerate(entries):
        end = entries[i + 1].start() if i + 1 < len(entries) else len(text)
        next_heading = next((h.start() for h in headings if h.start() > m.start()), None)
        if next_heading is not None and next_heading < end:
            end = next_heading
        body = text[m.end():end].strip()
        heading = None
        for h in headings:
            if h.start() < m.start():
                heading = h.group(1).strip()
            else:
                break
        family = (heading.split("—", 1)[0].strip() if heading else m.group(1).split("-", 1)[0])
        euid = m.group(1)
        o = base_obj(euid, "evidential", "source_euid", path, euid)
        o.update({
            "substantive_text": body,
            "source_family": family,
            "source_status": "controlled-derived-corpus",
        })
        dm = re.search(r"-(\d{8})-", euid)
        if dm:
            raw = dm.group(1)
            o["event_date"] = f"{raw[:4]}-{raw[4:6]}-{raw[6:]}"
        objects.append(o)
    return objects


def parse_facts() -> list[dict[str, Any]]:
    path = "FACT_REGISTER.md"
    text = read(path)
    rx = re.compile(r"(?m)^###\s+(F\d{4})\s*$")
    objects = []
    for m, block in split_heading_blocks(text, rx):
        fields = field_map(block)
        missing = [x for x in ["Fact", "Evidence", "Evidence class", "Qualification"] if x not in fields]
        if missing:
            raise GateError(f"{m.group(1)} missing Fact fields: {missing}")
        evidence = extract_ids(fields["Evidence"], "F")  # never expected; avoids accidental Fact refs
        euid_candidates = re.findall(r"`?([A-Z0-9]+-(?:\d{8}|GEN|UNMAPPED)-\d{4})`?", fields["Evidence"])
        if not euid_candidates:
            euid_candidates = re.findall(r"`([^`]+)`", fields["Evidence"])
        o = base_obj(m.group(1), "evidential", "fact", path, m.group(1))
        o.update({
            "substantive_text": fields["Fact"],
            "evidence_ids": sorted(set(euid_candidates)),
            "evidence_class": fields["Evidence class"],
            "qualification": fields["Qualification"],
        })
        o["relationships"] = {"source_euids": sorted(set(euid_candidates))}
        objects.append(o)
    return objects


def parse_tensions(vocab: dict[str, Any]) -> list[dict[str, Any]]:
    path = "EVIDENTIAL_TENSIONS.md"
    text = read(path)
    rx = re.compile(r"(?m)^###\s+(T\d{3})\s+—\s+(.+)$")
    objects = []
    for m, block in split_heading_blocks(text, rx):
        fields = field_map(block)
        required = ["Facts engaged", "Type", "Documentary tension", "Why it matters", "Possible reconciliation", "What would resolve it", "Status"]
        missing = [x for x in required if x not in fields]
        if missing:
            raise GateError(f"{m.group(1)} missing Tension fields: {missing}")
        type_source = clean_code(fields["Type"])
        components = [x.strip() for x in type_source.split("/")]
        types = []
        for c in components:
            if c not in vocab["tension_type_source_component_map"]:
                raise GateError(f"{m.group(1)} unknown tension type component: {c}")
            types.append(vocab["tension_type_source_component_map"][c])
        status_source = [clean_code(x).strip() for x in re.split(r"\s*/\s*", fields["Status"])]
        statuses = []
        for s in status_source:
            if s not in vocab["resolution_status_source_map"]:
                raise GateError(f"{m.group(1)} unknown resolution status: {s}")
            statuses.append(vocab["resolution_status_source_map"][s])
        facts = extract_ids(fields["Facts engaged"], "F")
        o = base_obj(m.group(1), "evidential", "tension", path, m.group(1))
        o.update({
            "title": m.group(2).strip(),
            "facts_engaged": facts,
            "tension_type_source": type_source,
            "tension_type": types,
            "documentary_tension": fields["Documentary tension"],
            "why_it_matters": fields["Why it matters"],
            "possible_reconciliation": fields["Possible reconciliation"],
            "what_would_resolve_it": fields["What would resolve it"],
            "resolution_status_source": status_source,
            "resolution_status": statuses,
        })
        o["relationships"] = {"fact_ids": facts}
        objects.append(o)
    return objects


def parse_propositions() -> list[dict[str, Any]]:
    path = "PROPOSITION_REGISTER.md"
    text = read(path)
    rx = re.compile(r"(?m)^##\s+([PSC]\d{3})\s+—\s+(.+)$")
    objects = []
    for m, block in split_heading_blocks(text, rx):
        oid, title = m.group(1), m.group(2).strip()
        fields = field_map(block)
        if oid.startswith("P"):
            required = ["Proposition", "Primary facts", "Tensions", "Strength", "Boundary"]
            missing = [x for x in required if x not in fields]
            if missing:
                raise GateError(f"{oid} missing Proposition fields: {missing}")
            facts = extract_ids(fields["Primary facts"], "F")
            tensions = extract_ids(fields["Tensions"], "T")
            o = base_obj(oid, "evidential", "proposition", path, oid)
            o.update({"title": title, "substantive_text": fields["Proposition"], "primary_fact_ids": facts,
                      "tension_ids": tensions, "strength_source": clean_code(fields["Strength"]),
                      "strength": normalize_strength(clean_code(fields["Strength"])), "boundary": fields["Boundary"]})
            o["relationships"] = {"fact_ids": facts, "tension_ids": tensions}
        elif oid.startswith("S"):
            # Supporting proposition prose precedes field lines.
            body_before = re.split(r"(?m)^\*\*Facts:\*\*", block, maxsplit=1)[0].strip()
            facts = extract_ids(fields.get("Facts", ""), "F")
            tensions = extract_ids(fields.get("Tension", fields.get("Tensions", "")), "T")
            o = base_obj(oid, "evidential", "supporting_proposition", path, oid)
            o.update({"title": title, "substantive_text": body_before, "fact_ids": facts, "tension_ids": tensions})
            rel = {"fact_ids": facts}
            if tensions: rel["tension_ids"] = tensions
            o["relationships"] = rel
        else:
            # Control rule prose ends before the next controlled heading.
            body = re.split(r"(?m)^---$|^#\s", block, maxsplit=1)[0].strip()
            o = base_obj(oid, "evidential", "control_rule", path, oid)
            o.update({"title": title, "substantive_text": body})
        objects.append(o)
    return objects


def parse_argument_stages() -> list[dict[str, Any]]:
    path = "CASE_ARGUMENT_ARCHITECTURE.md"
    text = read(path)
    rx = re.compile(r"(?m)^#\s+(\d+)\.\s+(Stage\s+[^—\n]+—\s+.+)$")
    objects = []
    for m, block in split_heading_blocks(text, rx):
        title = m.group(2).strip()
        anchor = slugify(f"{m.group(1)}-{title}")
        fields_by_heading: dict[str, str] = {}
        subrx = re.compile(r"(?m)^##\s+([^\n]+)$")
        subs = list(subrx.finditer(block))
        for i, sm in enumerate(subs):
            end = subs[i + 1].start() if i + 1 < len(subs) else len(block)
            fields_by_heading[sm.group(1).strip()] = block[sm.end():end].strip()
        required = ["Question", "Controlling propositions", "Argument", "Strongest alternative explanation", "Surviving point after the alternative explanation", "Evidential status"]
        missing = [x for x in required if x not in fields_by_heading]
        if missing:
            raise GateError(f"argument stage {title} missing sections: {missing}")
        pids = extract_ids(fields_by_heading["Controlling propositions"], "P") + extract_ids(fields_by_heading["Controlling propositions"], "S")
        oid = impl_id("argument_stage", path, anchor)
        o = base_obj(oid, "implementation", "argument_stage", path, anchor)
        o.update({"title": title, "question": fields_by_heading["Question"], "controlling_proposition_ids": pids,
                  "argument": fields_by_heading["Argument"], "strongest_alternative_explanation": fields_by_heading["Strongest alternative explanation"],
                  "surviving_point": fields_by_heading["Surviving point after the alternative explanation"], "evidential_status": fields_by_heading["Evidential status"]})
        o["relationships"] = {"proposition_ids": pids}
        objects.append(o)
    return objects


def parse_defence_audit(vocab: dict[str, Any]) -> list[dict[str, Any]]:
    path = "DEFENCE_ADVERSE_CASE_AUDIT.md"
    text = read(path)
    rx = re.compile(r"(?m)^###\s+(P\d{3})\s+—\s+(.+)$")
    objects = []
    for m, block in split_heading_blocks(text, rx):
        fields = field_map(block)
        required = ["Defence position", "Best defence answer", "Facts supporting defence", "Tensions supporting defence", "What claimant is entitled to say", "What claimant is NOT entitled to say", "Defence vulnerability", "Evidence needed to improve defence"]
        missing = [x for x in required if x not in fields]
        if missing:
            raise GateError(f"audit {m.group(1)} missing fields: {missing}")
        source_pos = clean_code(fields["Defence position"])
        if source_pos not in vocab["defence_position_source_map"]:
            raise GateError(f"audit {m.group(1)} unknown Defence Position: {source_pos}")
        anchor = slugify(f"{m.group(1)}-{m.group(2)}")
        oid = impl_id("defence_audit", path, anchor)
        facts = extract_ids(fields["Facts supporting defence"], "F")
        tensions = extract_ids(fields["Tensions supporting defence"], "T")
        o = base_obj(oid, "implementation", "defence_audit", path, anchor)
        o.update({"title": m.group(2).strip(), "proposition_id": m.group(1), "defence_position_source": source_pos,
                  "defence_position": vocab["defence_position_source_map"][source_pos], "best_defence_answer": fields["Best defence answer"],
                  "fact_ids": facts, "tension_ids": tensions, "claimant_entitled_to_say": fields["What claimant is entitled to say"],
                  "claimant_not_entitled_to_say": fields["What claimant is NOT entitled to say"], "defence_vulnerability": fields["Defence vulnerability"],
                  "evidence_needed": fields["Evidence needed to improve defence"]})
        o["relationships"] = {"proposition_ids": [m.group(1)], "fact_ids": facts, "tension_ids": tensions}
        objects.append(o)
    return objects


def parse_adjudication() -> list[dict[str, Any]]:
    path = "ADVERSE_CASE_ADJUDICATION.md"
    text = read(path)
    rx = re.compile(r"(?m)^##\s+(P\d{3})\s+—\s+(.+)$")
    objects = []
    for m, block in split_heading_blocks(text, rx):
        fields = field_map(block)
        required = ["Defence answer", "Adjudication", "Why", "Disposition"]
        missing = [x for x in required if x not in fields]
        if missing:
            raise GateError(f"adjudication {m.group(1)} missing fields: {missing}")
        raw = clean_code(fields["Adjudication"])
        classes = re.findall(r"(?<![A-Z])([ABCD])(?![A-Z])", raw)
        if not classes:
            raise GateError(f"adjudication {m.group(1)} has no valid A-D class: {raw}")
        anchor = slugify(f"{m.group(1)}-{m.group(2)}")
        oid = impl_id("adjudication", path, anchor)
        o = base_obj(oid, "implementation", "adjudication", path, anchor)
        o.update({"title": m.group(2).strip(), "proposition_id": m.group(1), "defence_answer": fields["Defence answer"],
                  "adjudication_source": raw, "adjudication_classes": classes, "why": fields["Why"], "disposition": fields["Disposition"]})
        o["relationships"] = {"proposition_ids": [m.group(1)]}
        objects.append(o)
    return objects


def canonical_url(o: dict[str, Any]) -> str | None:
    oid, typ = o["id"], o["object_type"]
    if o["id_kind"] != "evidential": return None
    if typ == "source_euid": return f"/evidence/euids/{oid}/"
    if typ == "fact": return f"/evidence/facts/{oid}/"
    if typ == "tension": return f"/evidence/tensions/{oid}/"
    if typ in {"proposition", "supporting_proposition"}: return f"/evidence/propositions/{oid}/"
    return None


def generate_reverse(objects: list[dict[str, Any]]) -> dict[str, dict[str, list[str]]]:
    reverse: dict[str, dict[str, set[str]]] = defaultdict(lambda: defaultdict(set))
    keymap = {
        "source_euids": "used_by_facts", "fact_ids": "used_by_objects", "tension_ids": "used_by_objects",
        "proposition_ids": "used_by_objects", "supporting_proposition_ids": "used_by_objects",
        "control_rule_ids": "used_by_objects", "expert_question_ids": "used_by_objects",
    }
    for o in objects:
        for key, targets in o.get("relationships", {}).items():
            for target in targets:
                reverse[target][keymap.get(key, "used_by_objects")].add(o["id"])
    # Add more useful typed aliases for Facts/Tensions/Propositions.
    by_id = {o["id"]: o for o in objects}
    for source in objects:
        for target in source.get("relationships", {}).get("fact_ids", []):
            if source["object_type"] == "tension": reverse[target]["used_by_tensions"].add(source["id"])
            if source["object_type"] in {"proposition", "supporting_proposition"}: reverse[target]["used_by_propositions"].add(source["id"])
        for target in source.get("relationships", {}).get("tension_ids", []):
            if source["object_type"] in {"proposition", "supporting_proposition"}: reverse[target]["used_by_propositions"].add(source["id"])
    return {k: {rk: sorted(rv) for rk, rv in sorted(v.items())} for k, v in sorted(reverse.items()) if k in by_id}


def validate(objects: list[dict[str, Any]], vocab: dict[str, Any]) -> dict[str, Any]:
    errors: list[dict[str, str]] = []
    warnings: list[dict[str, str]] = []
    ids = [o["id"] for o in objects]
    counts = Counter(ids)
    for oid, n in counts.items():
        if n > 1: errors.append({"id": oid, "source_file": "multiple", "condition": "duplicate normalized ID"})
    by_id = {o["id"]: o for o in objects}
    evidential = {o["id"] for o in objects if o["id_kind"] == "evidential"}
    facts = {x for x in evidential if re.fullmatch(r"F\d{4}", x)}
    tensions = {x for x in evidential if re.fullmatch(r"T\d{3}", x)}
    props = {x for x in evidential if re.fullmatch(r"[PS]\d{3}", x)}
    euids = {x for x in evidential if EUID_RE.fullmatch(x)}
    urls: dict[str, str] = {}
    for o in objects:
        oid = o["id"]
        if o["id_kind"] not in vocab["id_kind"]:
            errors.append({"id": oid, "source_file": o["source_file"], "condition": "invalid id_kind"})
        if o["id_kind"] == "evidential" and o["object_type"] != "source_euid" and not CONTROLLED_ID_RE.fullmatch(oid):
            errors.append({"id": oid, "source_file": o["source_file"], "condition": "malformed controlled evidential ID"})
        if not o.get("source_anchor"):
            errors.append({"id": oid, "source_file": o["source_file"], "condition": "missing source_anchor"})
        if "metadata" not in o:
            errors.append({"id": oid, "source_file": o["source_file"], "condition": "missing metadata"})
        if o["object_type"] not in vocab["object_type"]:
            errors.append({"id": oid, "source_file": o["source_file"], "condition": "unknown object_type"})
        if o["id_kind"] == "implementation" and not oid.startswith(f"impl:{o['object_type']}:{o['source_file']}#"):
            errors.append({"id": oid, "source_file": o["source_file"], "condition": "non-deterministic implementation ID"})
        url = canonical_url(o)
        if url:
            if url in urls: errors.append({"id": oid, "source_file": o["source_file"], "condition": f"duplicate canonical URL also used by {urls[url]}"})
            urls[url] = oid
        rel = o.get("relationships", {})
        for f in rel.get("fact_ids", []):
            if f not in facts: errors.append({"id": oid, "source_file": o["source_file"], "condition": f"unresolved required Fact reference {f}"})
        for t in rel.get("tension_ids", []):
            if t not in tensions: errors.append({"id": oid, "source_file": o["source_file"], "condition": f"unresolved required Tension reference {t}"})
        for p in rel.get("proposition_ids", []):
            if p not in props: errors.append({"id": oid, "source_file": o["source_file"], "condition": f"unresolved required Proposition reference {p}"})
        if o["object_type"] == "proposition" and not o.get("boundary", "").strip():
            errors.append({"id": oid, "source_file": o["source_file"], "condition": "core Proposition without Boundary"})
        if o["object_type"] == "fact":
            for e in o.get("evidence_ids", []):
                if e not in euids:
                    warnings.append({"id": oid, "source_file": o["source_file"], "condition": f"unresolved non-canonical evidence identifier {e}"})
        prov = o.get("provenance", {})
        if prov.get("source_blob_sha_or_commit") == "unavailable" or prov.get("site_build_commit") == "unavailable":
            warnings.append({"id": oid, "source_file": o["source_file"], "condition": "optional Git provenance unavailable"})
    reverse = generate_reverse(objects)
    for f in facts:
        if f not in reverse or not reverse[f]: warnings.append({"id": f, "source_file": by_id[f]["source_file"], "condition": "orphan Fact"})
    for t in tensions:
        if t not in reverse or not reverse[t]: warnings.append({"id": t, "source_file": by_id[t]["source_file"], "condition": "orphan Tension"})
    # Duplicate substantive text check by hash, excluding very short strings.
    seen: dict[str, str] = {}
    for o in objects:
        text = o.get("substantive_text")
        if isinstance(text, str) and len(text) >= 80:
            h = hashlib.sha256(text.encode()).hexdigest()
            if h in seen and seen[h] != o["id"]:
                warnings.append({"id": o["id"], "source_file": o["source_file"], "condition": f"duplicate substantive text also present in {seen[h]}"})
            else: seen[h] = o["id"]
    return {"fatal_errors": errors, "warnings": warnings, "reverse_relationships": reverse, "canonical_urls": urls}


def parse_all() -> tuple[list[dict[str, Any]], dict[str, Any]]:
    vocab = parse_vocab()
    objects: list[dict[str, Any]] = []
    objects += parse_corpus()
    objects += parse_facts()
    objects += parse_tensions(vocab)
    objects += parse_propositions()
    objects += parse_argument_stages()
    objects += parse_defence_audit(vocab)
    objects += parse_adjudication()
    objects.sort(key=lambda o: (o["object_type"], o["id"]))
    return objects, vocab


def envelope(payload_name: str, payload: Any, generated_at: str, commit: str) -> dict[str, Any]:
    return {"generated": True, "schema_version": SCHEMA_VERSION, "parser_version": PARSER_VERSION,
            "repository": REPOSITORY, "site_build_commit": commit, "generated_at": generated_at, payload_name: payload}


def make_outputs(objects: list[dict[str, Any]], validation: dict[str, Any]) -> dict[str, Any]:
    commit = git_value("rev-parse", "HEAD") or "unavailable"
    generated_at = git_value("show", "-s", "--format=%cI", "HEAD") or "unavailable"
    relationships = []
    reverse = validation["reverse_relationships"]
    for o in objects:
        relationships.append({"id": o["id"], "relationships": {k: sorted(v) for k, v in sorted(o.get("relationships", {}).items())},
                              "reverse_relationships": reverse.get(o["id"], {}), "generated_reverse_relationships": True})
    id_map = {}
    for o in objects:
        id_map[o["id"]] = {"object_type": o["object_type"], "id_kind": o["id_kind"], "source_file": o["source_file"],
                            "source_anchor": o["source_anchor"], "canonical_url": canonical_url(o)}
    report = {
        "passed": not validation["fatal_errors"],
        "fatal_errors": validation["fatal_errors"],
        "warnings": validation["warnings"],
        "object_counts": dict(sorted(Counter(o["object_type"] for o in objects).items())),
        "relationship_counts": dict(sorted(Counter(k for o in objects for k, vals in o.get("relationships", {}).items() for _ in vals).items())),
        "source_files_parsed": SOURCE_FILES,
        "normalization_mappings_used": ["tension_type_source_component_map", "resolution_status_source_map", "defence_position_source_map", "proposition_strength"],
        "source_grammar_exceptions": ["Supporting propositions use prose bodies plus Facts/Tension fields", "Argument stages use section headings rather than bold fields", "Audit Fact references may use numeric ranges", "Adjudication classes may be composite (for example B + C)"],
        "provenance_limitations": [] if commit != "unavailable" else ["Git metadata unavailable in this execution mode; unavailable values emitted explicitly"],
    }
    site_version = {"schema_version": SCHEMA_VERSION, "parser_version": PARSER_VERSION, "repository": REPOSITORY,
                    "site_build_commit": commit, "generated_at": generated_at}
    return {
        "objects.json": envelope("objects", objects, generated_at, commit),
        "relationships.json": envelope("relationships", relationships, generated_at, commit),
        "id-map.json": envelope("id_map", id_map, generated_at, commit),
        "validation-report.json": envelope("validation", report, generated_at, commit),
        "site-version.json": {"generated": True, **site_version},
        "_report": report,
    }


def markdown_report(report: dict[str, Any]) -> str:
    lines = ["# Parser Validation Report", "", f"**Parser version:** {PARSER_VERSION}  ", f"**Schema version:** {SCHEMA_VERSION}", "",
             "## Source files parsed", ""]
    lines += [f"- `{x}`" for x in report["source_files_parsed"]]
    lines += ["", "## Object counts", ""] + [f"- `{k}`: {v}" for k, v in report["object_counts"].items()]
    lines += ["", "## Relationship counts", ""] + ([f"- `{k}`: {v}" for k, v in report["relationship_counts"].items()] or ["- None"])
    lines += ["", "## Fatal errors", ""]
    lines += [f"- `{e['id']}` · `{e['source_file']}` — {e['condition']}" for e in report["fatal_errors"]] or ["- None"]
    lines += ["", "## Warnings", ""]
    lines += [f"- `{e['id']}` · `{e['source_file']}` — {e['condition']}" for e in report["warnings"]] or ["- None"]
    lines += ["", "## Unresolved references", ""]
    unresolved = [e for e in report["fatal_errors"] + report["warnings"] if "unresolved" in e["condition"]]
    lines += [f"- `{e['id']}` — {e['condition']}" for e in unresolved] or ["- None"]
    lines += ["", "## Duplicate checks", "", "Duplicate normalized IDs and canonical URLs are fatal. Duplicate substantive text is a warning for review.",
              "", "## Normalization mappings used", ""] + [f"- `{x}`" for x in report["normalization_mappings_used"]]
    lines += ["", "## Source grammar exceptions", ""] + [f"- {x}" for x in report["source_grammar_exceptions"]]
    lines += ["", "## Provenance limitations", ""] + ([f"- {x}" for x in report["provenance_limitations"]] or ["- None"])
    lines += ["", "## Final gate verdict", "", "PARSER GATE PASSED" if report["passed"] else "PARSER GATE FAILED", ""]
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--validate", action="store_true", help="validate without writing generated artifacts")
    mode.add_argument("--build", action="store_true", help="validate and write generated artifacts")
    args = ap.parse_args()
    try:
        objects, _ = parse_all()
        validation = validate(objects, parse_vocab())
        outputs = make_outputs(objects, validation)
        report = outputs.pop("_report")
        if args.build:
            GENERATED_DIR.mkdir(parents=True, exist_ok=True)
            for name, payload in outputs.items():
                (GENERATED_DIR / name).write_text(json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
            (ROOT / "PARSER_VALIDATION_REPORT.md").write_text(markdown_report(report), encoding="utf-8")
        else:
            print(markdown_report(report))
        return 0 if report["passed"] else 2
    except GateError as exc:
        print(f"PARSER GATE FAILED: {exc}", file=sys.stderr)
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
