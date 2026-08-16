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
    "EXPERT_QUESTION_REGISTER.md",
    "CASE_ARGUMENT_ARCHITECTURE.md",
    "DEFENCE_ADVERSE_CASE_AUDIT.md",
    "ADVERSE_CASE_ADJUDICATION.md",
    "scripts/build_evidence_graph.py",
    "scripts/evidence_graph_impl.py",
]

if "EXPERT_QUESTION_REGISTER.md" not in _impl.SOURCE_FILES:
    _impl.SOURCE_FILES.append("EXPERT_QUESTION_REGISTER.md")

# EQ### is already reserved by schema 1.0.0. Promote it into the active controlled-ID
# validator only now that the authoritative register exists.
_impl.CONTROLLED_ID_RE = re.compile(r"^(?:F\d{4}|T\d{3}|P\d{3}|S\d{3}|C\d{3}|EQ\d{3})$")

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


def _question_domain(oid: str):
    if oid == "EQ006":
        return ["movement-disorders", "clinical-genetics"]
    if oid == "EQ008":
        return ["movement-disorders", "clinical-causation"]
    return ["movement-disorders"]


def _parse_expert_questions():
    path = "EXPERT_QUESTION_REGISTER.md"
    text = _impl.read(path)
    rx = re.compile(r"(?m)^#\s+(EQ\d{3})\s+—\s+(.+)$")
    objects = []
    for m, block in _impl.split_heading_blocks(text, rx):
        oid, title = m.group(1), m.group(2).strip()
        fields = _original_field_map(block)
        required = [
            "Question", "Documentary triggers", "Controlled propositions",
            "What the documents establish regardless", "Expert-dependent issues",
            "Permitted outcome range", "Boundary", "Counsel consequence",
        ]
        missing = [x for x in required if x not in fields]
        if missing:
            raise _impl.GateError(f"{oid} missing Expert Question fields: {missing}")
        tensions = _impl.extract_ids(fields["Documentary triggers"], "T")
        propositions = sorted(
            set(_impl.extract_ids(fields["Controlled propositions"], "P") + _impl.extract_ids(fields["Controlled propositions"], "S")),
            key=lambda x: (x[0], int(x[1:])),
        )
        o = _impl.base_obj(oid, "evidential", "expert_question", path, oid)
        o.update({
            "title_or_question": title,
            "title": title,
            "question": fields["Question"],
            "proposition_ids": propositions,
            "tension_ids": tensions,
            "fact_ids": [],
            "expert_domain": _question_domain(oid),
            "status": "controlled-question",
            "documentary_baseline": fields["What the documents establish regardless"],
            "expert_dependent_issues": fields["Expert-dependent issues"],
            "permitted_outcome_range": fields["Permitted outcome range"],
            "boundary": fields["Boundary"],
            "counsel_consequence": fields["Counsel consequence"],
        })
        o["relationships"] = {"proposition_ids": propositions, "tension_ids": tensions, "fact_ids": []}
        objects.append(o)
    if not objects:
        raise _impl.GateError("no controlled Expert Questions found")
    return objects


def _parse_all_with_expert_questions():
    vocab = _impl.parse_vocab()
    objects = []
    objects += _impl.parse_corpus()
    objects += _impl.parse_facts()
    objects += _impl.parse_tensions(vocab)
    objects += _impl.parse_propositions()
    objects += _impl.parse_argument_stages()
    objects += _impl.parse_defence_audit(vocab)
    objects += _impl.parse_adjudication()
    objects += _parse_expert_questions()
    objects.sort(key=lambda o: (o["object_type"], o["id"]))
    return objects, vocab

_impl.parse_all = _parse_all_with_expert_questions

# Expert Questions now have stable public routes. Keep generated id-map/object metadata
# synchronized with the canonical Evidence Foundation route used by the site.
_original_canonical_url = _impl.canonical_url

def _canonical_url(object):
    if object.get("id_kind") == "evidential" and object.get("object_type") == "expert_question":
        return f"/evidence/expert-questions/{object['id']}/"
    return _original_canonical_url(object)

_impl.canonical_url = _canonical_url

# The core validator deliberately uses sets for O(1) integrity lookups. Sort all
# surfaced diagnostics before report generation so Python hash randomization cannot
# change committed JSON/Markdown output between otherwise identical runs.
_original_validate = _impl.validate

def _deterministic_validate(objects, vocab):
    result = _original_validate(objects, vocab)
    by_id = {o["id"]: o for o in objects}
    expert_questions = [o for o in objects if o["object_type"] == "expert_question"]
    for o in expert_questions:
        for field in ["question", "expert_domain", "status", "boundary", "counsel_consequence"]:
            if not o.get(field):
                result["fatal_errors"].append({"id": o["id"], "source_file": o["source_file"], "condition": f"expert question missing {field}"})
    mapped_tensions = {t for o in expert_questions for t in o.get("tension_ids", [])}
    for oid, o in by_id.items():
        if o["object_type"] == "tension" and "requires-expert-evidence" in o.get("resolution_status", []) and oid not in mapped_tensions:
            result["warnings"].append({"id": oid, "source_file": o["source_file"], "condition": "expert-required Tension has no mapped Expert Question"})
    key = lambda item: (item.get("source_file", ""), item.get("id", ""), item.get("condition", ""))
    result["fatal_errors"] = sorted(result.get("fatal_errors", []), key=key)
    result["warnings"] = sorted(result.get("warnings", []), key=key)
    return result

_impl.validate = _deterministic_validate

for _name in dir(_impl):
    if not _name.startswith("_"):
        globals()[_name] = getattr(_impl, _name)

if __name__ == "__main__":
    raise SystemExit(_impl.main())
