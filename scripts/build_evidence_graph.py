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

# Provenance is identical for all objects extracted from a given source file in a
# single build. Cache once per path so parsing remains linear at large EUID counts.
_impl.provenance = lru_cache(maxsize=None)(_impl.provenance)

_original_field_map = _impl.field_map

def _bounded_field_map(block: str):
    """Prevent the final object in a register absorbing following report sections."""
    bounded = re.split(r"(?m)^(?:#{1,2}\s+.+|---\s*)$", block, maxsplit=1)[0]
    return _original_field_map(bounded)

_impl.field_map = _bounded_field_map


def _adjudication_fields(block: str):
    """Extract exact controlled labels by literal position, preserving all body text."""
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
            # The final P-entry can be followed by a horizontal rule and later
            # D-series sections; these are not part of Disposition.
            value = re.split(r"(?m)^---\s*$|^#\s+\d+\.\s+", value, maxsplit=1)[0].strip()
        found[label] = value
    return found


def _parse_adjudication():
    """Parse proposition adjudications using their actual multi-paragraph grammar."""
    path = "ADVERSE_CASE_ADJUDICATION.md"
    text = _impl.read(path)
    rx = re.compile(r"(?m)^##\s+(P\d{3})\s+—\s+(.+)$")
    objects = []
    for m, block in _impl.split_heading_blocks(text, rx):
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
