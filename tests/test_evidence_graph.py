import copy
import importlib.util
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("evidence_graph", ROOT / "scripts" / "build_evidence_graph.py")
mod = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(mod)


class EvidenceGraphTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.vocab = mod.parse_vocab()
        cls.objects, _ = mod.parse_all()
        cls.by_id = {o["id"]: o for o in cls.objects}

    def test_fact_parsing_real_record(self):
        f = self.by_id["F0002"]
        self.assertEqual(f["object_type"], "fact")
        self.assertIn("abnormal gait and foot pain bilat", f["substantive_text"])
        self.assertEqual(f["evidence_ids"], ["GP17-20170410-0001"])
        self.assertEqual(f["qualification"], "None.")

    def test_tension_parsing_real_record(self):
        t = self.by_id["T001"]
        self.assertEqual(t["tension_type_source"], "reasoning gap / operational-epistemic mismatch")
        self.assertEqual(t["tension_type"], ["reasoning-gap", "operational-epistemic-mismatch"])
        self.assertEqual(t["resolution_status_source"], ["UNRESOLVED", "REQUIRES ADDITIONAL SOURCE"])
        self.assertEqual(t["resolution_status"], ["unresolved", "requires-additional-source"])

    def test_resolution_status_special_values(self):
        self.assertEqual(self.by_id["T018"]["resolution_status"], ["resolved-by-record"])
        self.assertEqual(self.by_id["T020"]["resolution_status"], ["representation-issue-only"])

    def test_defence_position_normalization_real_records(self):
        audits = [o for o in self.objects if o["object_type"] == "defence_audit"]
        p13 = next(o for o in audits if o["proposition_id"] == "P013")
        self.assertEqual(p13["defence_position_source"], "PARTIALLY CONTEST")
        self.assertEqual(p13["defence_position"], "partially-contest")

    def test_proposition_boundary_enforcement(self):
        p = copy.deepcopy(self.by_id["P001"])
        p["boundary"] = ""
        result = mod.validate([o if o["id"] != "P001" else p for o in self.objects], self.vocab)
        self.assertTrue(any("without Boundary" in e["condition"] for e in result["fatal_errors"]))

    def test_missing_reference_failure(self):
        p = copy.deepcopy(self.by_id["P001"])
        p["relationships"]["fact_ids"] = p["relationships"]["fact_ids"] + ["F9999"]
        result = mod.validate([o if o["id"] != "P001" else p for o in self.objects], self.vocab)
        self.assertTrue(any("unresolved required Fact reference F9999" in e["condition"] for e in result["fatal_errors"]))

    def test_duplicate_id_failure(self):
        duplicate = copy.deepcopy(self.by_id["F0001"])
        result = mod.validate(self.objects + [duplicate], self.vocab)
        self.assertTrue(any("duplicate normalized ID" in e["condition"] for e in result["fatal_errors"]))

    def test_deterministic_impl_ids(self):
        audits = [o for o in self.objects if o["object_type"] == "defence_audit"]
        p1 = next(o for o in audits if o["proposition_id"] == "P001")
        expected = mod.impl_id("defence_audit", p1["source_file"], p1["source_anchor"])
        self.assertEqual(p1["id"], expected)
        self.assertEqual(p1["id_kind"], "implementation")

    def test_reverse_relationship_generation(self):
        rev = mod.generate_reverse(self.objects)
        self.assertIn("T001", rev["F0162"]["used_by_tensions"])
        self.assertIn("P003", rev["F0162"]["used_by_propositions"])

    def test_json_object_order_is_deterministic(self):
        keys = [(o["object_type"], o["id"]) for o in self.objects]
        self.assertEqual(keys, sorted(keys))
        validation = mod.validate(self.objects, self.vocab)
        out1 = json.dumps(mod.make_outputs(self.objects, validation), sort_keys=True, ensure_ascii=False)
        out2 = json.dumps(mod.make_outputs(self.objects, validation), sort_keys=True, ensure_ascii=False)
        self.assertEqual(out1, out2)

    def test_unknown_controlled_value_failure(self):
        bad = copy.deepcopy(self.by_id["F0001"])
        bad["id"] = "impl:not-a-real-type:x#y"
        bad["id_kind"] = "implementation"
        bad["object_type"] = "not-a-real-type"
        result = mod.validate(self.objects + [bad], self.vocab)
        self.assertTrue(any("unknown object_type" in e["condition"] for e in result["fatal_errors"]))

    def test_unknown_tension_component_mapping_is_not_permitted(self):
        self.assertNotIn("invented type", self.vocab["tension_type_source_component_map"])

    def test_argument_stage_has_non_evidential_impl_id(self):
        stages = [o for o in self.objects if o["object_type"] == "argument_stage"]
        self.assertEqual(len(stages), 6)
        self.assertTrue(all(o["id_kind"] == "implementation" and o["id"].startswith("impl:argument_stage:") for o in stages))


if __name__ == "__main__":
    unittest.main()
