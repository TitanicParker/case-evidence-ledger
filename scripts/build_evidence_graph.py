#!/usr/bin/env python3
"""Stable CLI wrapper for the evidence graph parser.

The core implementation lives in evidence_graph_impl.py. This wrapper applies two
cross-cutting parser safeguards before exposing the implementation API:

1. Git provenance is cached per source file, so large EUID corpora do not spawn
   one Git subprocess set per object.
2. Bold-field parsing is clipped at the next Markdown section boundary so the
   final controlled object in a register cannot absorb following report sections.
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

# Provenance is identical for all objects extracted from the same source file in
# one build. Cache it once per path rather than invoking Git for every object.
_impl.provenance = lru_cache(maxsize=None)(_impl.provenance)

_original_field_map = _impl.field_map

def _bounded_field_map(block: str):
    # Object blocks are already bounded by the next controlled-object heading.
    # The final object in a register can instead be followed by a report section
    # (e.g. "## Direct Contradictions"). Do not let that prose become part of the
    # final bold field value.
    bounded = re.split(r"(?m)^(?:#{1,2}\s+.+|---\s*)$", block, maxsplit=1)[0]
    return _original_field_map(bounded)

_impl.field_map = _bounded_field_map

# Re-export the implementation API so tests and documented imports continue to
# use scripts/build_evidence_graph.py as the stable entrypoint.
for _name in dir(_impl):
    if not _name.startswith("_"):
        globals()[_name] = getattr(_impl, _name)

if __name__ == "__main__":
    raise SystemExit(_impl.main())
