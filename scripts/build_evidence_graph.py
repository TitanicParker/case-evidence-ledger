#!/usr/bin/env python3
"""Stable CLI wrapper for the evidence graph parser.

The core implementation lives in evidence_graph_impl.py. This wrapper applies
cross-cutting parser safeguards and explicit grammar handling discovered by running
against the real repository.
"""
from __future__ import annotations

import re
import sys
from functools import lru_cache
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import evidence_graph_impl as _impl

# Generated files cannot truthfully embed the commit that stores those same files
# without creating a self-referential diff on every rebuild. Define the build/source
# commit as the latest commit that changed an authoritative source, schema, or parser
# input. A later generated-artifact-only commit therefore reproduces byte-for-byte.
_original_git_value = _impl.git_value
_GRAPH_INPUTS = [
    "schema/EVIDENCE_OBJECT_SCHEMA.md",
    "schema/vocabulary.yml",
    "sources-consolidated-evidence-corpus.md",
    "FACT_REGISTER.md",
    "EVIDENTIAL_TENSIONS.md",
    "PROPOSITION_REGISTER.md",
    "CASE_ARGUMENT_ARCHITECTURE.md",
    "DEFENCE_ADVERSE_CASE_AUDIT.md",
    "ADVERSE_CASE_ADJUDICATION.md",
    "scripts/build_evidence_graph.py",
    "scripts/evidence_graph_impl.py",
]

@lru_cache(maxsize=1)
def _graph_source_commit():
    return _original_git_value("log", "-1", "--format=%H", "--", *_GRAPH_INPUTS) or "unavailable"


def _stable_git_value(*args: str):
    if args == ("rev-parse", "HEAD"):
        return _graph_source_commit()
    if args == ("show", "-s", "--format=%cI", "HEAD"):
        commit = _graph_source_commit()
        return _original_git_value("show", "-s", "--format=%cI", commit) if commit != "unavailable" else None
    return _original_git_value(*args)

_impl.git_value = _stable_git_value
_impl.provenance = lru_cache(maxsize=None)(_impl.provenance)

_original_field_map = _impl.field_map

def _bounded_field_map(block: str):
    bounded = re.split(r"(?m)^(?:#{1,2}\s+.+|---\s*)$", block, maxsplit=1)[0]
    return _original_field_map(bounded)

_impl.field_map = _bounded_field_map


def _adjudication_fields(block: str):
    labels = ["Defence answer", "Adjudication", "Why", "Disposition"]
    markers = [f"**{label}:**" for label in labels]
    positions = []
    cursor = 0
    for marker in markers:
        pos = block.find(marker, cursor)
        if pos < 0:
            return {}
        positions.append(pos)
        cursor = pos + len(marker)
    found = {}
    for i, (label, marker, pos) in enumerate(zip(labels, markers, positions)):
        start = pos + len(marker)
        end = positions[i + 1] if i + 1 < len(positions) else len(block)
        value = block[start:end].strip()
        if i == len(labels) - 1:
            value = re.split(r"(?m)^---\s*$|^#\s+\d+\.\s+", value, maxsplit=1)[0].strip()
        found[label] = value
    return found


def _parse_adjudication():
    path = "ADVERSE_CASE_ADJUDICATION.md"
    text = _impl.read(path)
    start_marker = "# 3. Proposition-by-proposition adjudication"
    end_marker = "# 4. Defence propositions adjudicated"
    start = text.find(start_marker)
    end = text.find(end_marker, start + len(start_marker)) if start >= 0 else -1
    if start < 0 or end < 0:
        raise _impl.GateError("adjudication controlled register section boundaries not found")
    register = text[start + len(start_marker):end]
    rx = re.compile(r"(?m)^##\s+(P\d{3})\s+—\s+(.+)$")
    objects = []
    for m, block in _impl.split_heading_blocks(register, rx):
        fields = _adjudication_fields(block)
        required = ["Defence answer", "Adjudication", "Why", "Disposition"]
        missing = [x for x in required if x not in fields]
        if missing:
            raise _impl.GateError(f"adjudication {m.group(1)} missing fields: {missing}")
        raw = _impl.clean_code(fields["Adjudication"])
        classes = re.findall(r"(?<![A-Z])([ABCD])(?![A-Z])", raw)
        if not classes:
            raise _impl.GateError(f"adjudication {m.group(1)} has no valid A-D class: {raw}")
        anchor = _impl.slugify(f"{m.group(1)}-{m.group(2)}")
        oid = _impl.impl_id("adjudication", path, anchor)
        o = _impl.base_obj(oid, "implementation", "adjudication", path, anchor)
        o.update({
            "title": m.group(2).strip(),
            "proposition_id": m.group(1),
            "defence_answer": fields["Defence answer"],
            "adjudication_source": raw,
            "adjudication_classes": classes,
            "why": fields["Why"],
            "disposition": fields["Disposition"],
        })
        o["relationships"] = {"proposition_ids": [m.group(1)]}
        objects.append(o)
    return objects

_impl.parse_adjudication = _parse_adjudication

for _name in dir(_impl):
    if not _name.startswith("_"):
        globals()[_name] = getattr(_impl, _name)

if __name__ == "__main__":
    raise SystemExit(_impl.main())
