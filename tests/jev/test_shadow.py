"""Offline helper tests. Fixtures are not real API or game observations."""
import copy
import importlib.util
import json
import os
import subprocess
import tempfile
import unittest
import time
from concurrent.futures import ThreadPoolExecutor
import urllib.error
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("jev_shadow", ROOT / "tools/jev-shadow.py")
jev = importlib.util.module_from_spec(spec)
spec.loader.exec_module(jev)
FAKE_KEY = "unit-test-credential-never-a-real-secret"


def state(identity="hold-01"):
    return {"finding_id": identity, "problem": "Holding a control produces a menu before release.", "observed": ["pointerdown emitted; contextmenu emitted after1200ms; no pointerup observed."], "expected": "Hold then release triggers exactly one jump.", "unknown": ["Whether pointercancel occurred", "Real device behavior"], "viewport": {"width": 390, "height": 844}, "provenance": "synthetic-unit-fixture"}


def response(action=.44, risk=.8):
    answers = {}
    for name, question in jev.QUESTIONS.items():
        if question["type"] == "choice":
            selected = "PRODUCT_BUG" if name == "PRIMARY_CAUSE" else "LIVE_INTERACTION"
            answers[name] = {"type": "choice", "choice": selected, "probabilities": {c: 1.0 if c == selected else 0.0 for c in question["criteria"]}}
        else:
            answers[name] = {"type": "noul", "noul": action if name == "CODEX_ACTION_REQUIRED" else risk}
    return {"model": "typesafe/jev-1.13-fixture", "answers": answers, "usage": {"input_tokens": 100, "output_tokens": 40, "cost": .00001}}


def judgment(identity="hold-01", action=True, risk=False):
    return {"finding_id": identity, "PRIMARY_CAUSE": "PRODUCT_BUG", "CODEX_ACTION_REQUIRED": action, "NEXT_EVIDENCE": "LIVE_INTERACTION", "RELEASE_RISK_IF_UNRESOLVED": risk, "reviewer": "offline-unit-fixture", "rationale": "Fixture comparison only; not an actual independent game verdict.", "evidence": ["synthetic-fixture://pointer-events"], "actual_next_action": {"method": "LIVE_INTERACTION", "description": "Fixture action record", "evidence": ["synthetic-fixture://replay"]}}


class ShadowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.log = Path(self.temp.name) / "JEV_SHADOW.jsonl"
        self.env = patch.dict(os.environ, {"OPENROUTER_API_KEY": FAKE_KEY})
        self.env.start()
        self.calls = []

    def tearDown(self):
        self.env.stop()
        self.temp.cleanup()

    def transport(self, body, key):
        self.calls.append(copy.deepcopy(body))
        self.assertEqual(key, FAKE_KEY)
        self.assertNotIn(FAKE_KEY, json.dumps(body))
        return 200, response()

    def record(self, **kwargs):
        return jev.record("B", state(), "game020", self.log, transport=kwargs.pop("transport", self.transport), **kwargs)

    def test_four_questions_and_all_probability_choices(self):
        self.assertEqual(set(jev.QUESTIONS), {"PRIMARY_CAUSE", "CODEX_ACTION_REQUIRED", "NEXT_EVIDENCE", "RELEASE_RISK_IF_UNRESOLVED"})
        row = self.record()
        self.assertEqual(row["schema_version"], 2)
        self.assertEqual(row["NEXT_EVIDENCE"]["selected"], "LIVE_INTERACTION")
        self.assertEqual(len(row["PRIMARY_CAUSE"]["probabilities"]), 5)
        self.assertEqual(len(row["NEXT_EVIDENCE"]["probabilities"]), 7)
        self.assertEqual((row["input_tokens"], row["output_tokens"], row["cost_usd"]), (100, 40, .00001))
        self.assertGreaterEqual(row["latency_seconds"], 0)
        self.assertNotIn(FAKE_KEY, self.log.read_text())

    def test_dry_run_no_fake_answers_usage_or_network(self):
        row = self.record(dry_run=True)
        self.assertEqual(row["status"], "DRY_RUN")
        self.assertEqual(self.calls, [])
        self.assertIsNone(row["PRIMARY_CAUSE"])
        self.assertIsNone(row["cost_usd"])
        self.assertEqual(jev.summarize([row])["jev_invocations"], 0)

    def test_missing_key_falls_back_without_network(self):
        with patch.dict(os.environ, {"OPENROUTER_API_KEY": ""}):
            row = self.record()
        self.assertEqual(row["status"], "UNAVAILABLE")
        self.assertFalse(row["api_attempted"])
        self.assertEqual(self.calls, [])
        self.assertIsNone(row["CODEX_ACTION_REQUIRED"])

    def test_all_http_failures_single_attempt_no_body_or_header_log(self):
        for code in (401, 402, 403, 429, 500, 503):
            calls = []
            def fail(body, key):
                calls.append(body)
                raise urllib.error.HTTPError("https://fixture.invalid/" + FAKE_KEY, code, FAKE_KEY, {"Authorization": FAKE_KEY}, None)
            log = Path(self.temp.name) / f"http{code}.jsonl"
            row = jev.record("B", state(), "game020", log, transport=fail)
            self.assertEqual(row["status"], "UNAVAILABLE")
            self.assertEqual(row["http_status"], code)
            self.assertEqual(len(calls), 1)
            self.assertNotIn(FAKE_KEY, log.read_text())

    def test_network_timeout_single_attempt(self):
        for exception in (TimeoutError(FAKE_KEY), urllib.error.URLError(FAKE_KEY)):
            calls = []
            def fail(body, key):
                calls.append(body)
                raise exception
            row = jev.record("B", state(), "game020", Path(self.temp.name)/f"network{len(str(exception))}.jsonl", transport=fail)
            self.assertEqual(row["error"], "network_or_timeout")
            self.assertEqual(len(calls), 1)

    def test_malformed_scores_never_become_negative_signal(self):
        for value in (True, False, float("nan"), float("inf"), -.1, 1.1, "0.4", None):
            data = response()
            data["answers"]["CODEX_ACTION_REQUIRED"]["noul"] = value
            with self.assertRaises(ValueError):
                jev.parse_response(data)
        row = self.record(transport=lambda body, key: (200, {"answers": {}}))
        self.assertEqual(row["status"], "UNAVAILABLE")
        self.assertIsNone(row["CODEX_ACTION_REQUIRED"])
        self.assertIsNone(row["codex_false_pass"])

    def test_invalid_choice_keys_sum_and_selection_rejected(self):
        for change in ("missing", "extra", "bad-sum", "unknown-choice", "boolean"):
            data = response()
            choice = data["answers"]["NEXT_EVIDENCE"]
            if change == "missing": choice["probabilities"].pop("UNKNOWN")
            if change == "extra": choice["probabilities"]["HUMAN_ONLY"] = 0
            if change == "bad-sum": choice["probabilities"]["UNKNOWN"] = .5
            if change == "unknown-choice": choice["choice"] = "HUMAN_ONLY"
            if change == "boolean": choice["probabilities"]["UNKNOWN"] = False
            with self.assertRaises(ValueError): jev.parse_response(data)

    def test_missing_or_invalid_usage_is_null_not_zero(self):
        data = response(); data.pop("usage")
        parsed = jev.parse_response(data)
        self.assertIsNone(parsed["input_tokens"])
        self.assertIsNone(parsed["cost_usd"])
        data["usage"] = {"input_tokens": True, "output_tokens": 1.5, "cost": float("nan")}
        self.assertIsNone(jev.parse_response(data)["output_tokens"])

    def test_raw_response_extra_headers_are_not_copied(self):
        data = response(); data["Authorization"] = FAKE_KEY; data["raw"] = FAKE_KEY
        row = self.record(transport=lambda body,key: (200,data))
        self.assertEqual(row["status"], "AVAILABLE")
        self.assertNotIn(FAKE_KEY, self.log.read_text())

    def test_reflected_secret_in_model_is_rejected(self):
        data = response(); data["model"] = FAKE_KEY
        row = self.record(transport=lambda body,key: (200,data))
        self.assertEqual(row["status"], "UNAVAILABLE")
        self.assertNotIn(FAKE_KEY, self.log.read_text())

    def test_label_leakage_and_unbounded_state_rejected_before_call(self):
        for label in ("ground_truth", "修正済み", "P1", "P2", "製品バグと判明した", "テスト側の問題だった", "既知の正解", "Codex_final_judgment", "PRODUCT_BUG", FAKE_KEY):
            payload = state(); payload["observed"] = [label]
            with self.assertRaises(ValueError): jev.record("B",payload,"game020",self.log,transport=self.transport)
        payload=state();payload["ground_truth"]=True
        with self.assertRaises(ValueError): jev.validate_state(payload)
        payload=state();payload["observed"]=["x"*501]
        with self.assertRaises(ValueError): jev.validate_state(payload)
        self.assertEqual(self.calls, [])

    def test_no_duplicate_call_but_different_finding_allowed(self):
        self.record()
        with self.assertRaises(ValueError): self.record()
        jev.record("B",state("hold-02"),"game020",self.log,transport=self.transport)
        self.assertEqual(len(self.calls),2)

    def test_interrupted_request_is_reserved_and_cannot_be_repeated(self):
        calls=[]
        def interrupted(body,key):
            calls.append(body)
            raise KeyboardInterrupt()
        with self.assertRaises(KeyboardInterrupt): self.record(transport=interrupted)
        row=json.loads(self.log.read_text())
        self.assertEqual(row["status"],"UNAVAILABLE")
        self.assertEqual(row["error"],"attempt_not_completed")
        self.assertTrue(row["api_attempted"])
        with self.assertRaises(ValueError): self.record(transport=interrupted)
        self.assertEqual(len(calls),1)

    def test_duplicate_summary_paths_do_not_double_count(self):
        self.record()
        self.assertEqual(jev.summary_files([self.log,self.log])["totals"]["entries"],1)

    def test_concurrent_same_finding_is_sent_once(self):
        def slow(body,key):
            time.sleep(.03)
            return self.transport(body,key)
        def attempt():
            try:
                self.record(transport=slow)
                return "recorded"
            except ValueError:
                return "duplicate"
        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes=list(pool.map(lambda _:attempt(),range(2)))
        self.assertEqual(sorted(outcomes),["duplicate","recorded"])
        self.assertEqual(len(self.calls),1)
        self.assertEqual(len(self.log.read_text().splitlines()),1)

    def test_false_pass_and_release_miss_are_distinct(self):
        self.record()
        row=jev.annotate("B",judgment(),"game020",self.log)
        self.assertTrue(row["codex_false_pass"])
        self.assertFalse(row["release_risk_miss"])
        self.assertFalse(row["agreement"]["CODEX_ACTION_REQUIRED"])
        with self.assertRaises(ValueError): jev.annotate("B",judgment(),"game020",self.log)

    def test_risk_miss_without_codex_false_pass(self):
        self.record(transport=lambda body,key:(200,response(.8,.49)))
        row=jev.annotate("B",judgment(risk=True),"game020",self.log)
        self.assertFalse(row["codex_false_pass"])
        self.assertTrue(row["release_risk_miss"])

    def test_candidate_boundary_is_not_false_pass(self):
        self.record(transport=lambda body,key:(200,response(.45,.5)))
        row=jev.annotate("B",judgment(risk=True),"game020",self.log)
        self.assertFalse(row["codex_false_pass"])
        self.assertFalse(row["release_risk_miss"])

    def test_unavailable_keeps_independent_review_without_probabilities(self):
        with patch.dict(os.environ,{"OPENROUTER_API_KEY":""}): self.record()
        row=jev.annotate("B",judgment(),"game020",self.log)
        self.assertIsNotNone(row["codex_independent_judgment"])
        self.assertIsNone(row["agreement"])
        self.assertIsNone(row["codex_false_pass"])

    def test_historical_bytes_and_meaning_preserved(self):
        old={"status":"available","game_id":"game017","checkpoint_id":"old-B","PRIMARY_CAUSE":{"choice":"PRODUCT_BUG"},"CODEX_ACTION_REQUIRED":.2,"HUMAN_ONLY_JUDGMENT_REQUIRED":.9,"RELEASE_RISK_IF_UNRESOLVED":.2,"codex_final_judgment":{"PRIMARY_CAUSE":"PRODUCT_BUG","CODEX_ACTION_REQUIRED":True,"RELEASE_RISK_IF_UNRESOLVED":True}}
        original=json.dumps(old,separators=(",",":"))+"\n"
        self.log.write_text(original)
        self.record();jev.annotate("B",judgment(),"game020",self.log)
        self.assertEqual(self.log.read_text().splitlines(keepends=True)[0],original)
        result=jev.summarize([old])
        self.assertEqual(result["codex_false_pass"],1)
        self.assertEqual(result["release_risk_miss"],1)
        self.assertEqual(result["agreement"]["NEXT_EVIDENCE"]["compared"],0)

    def test_summary_unreviewed_is_not_agreement_or_false_negative(self):
        row=self.record()
        result=jev.summarize([row])
        self.assertEqual(result["unreviewed_available"],1)
        self.assertEqual(sum(result["codex_action_confusion"].values()),0)
        self.assertEqual(result["below_045_independently_reviewed"],0)
        self.assertEqual(result["codex_false_pass"],0)

    def test_summary_confusion_denominators_usage_and_cohort(self):
        row=self.record();row=jev.annotate("B",judgment(),"game020",self.log)
        result=jev.summary_files([self.log])
        totals=result["totals"]
        self.assertEqual(totals["codex_action_confusion"],{"TP":0,"TN":0,"FP":0,"FN":1})
        self.assertEqual(totals["below_045_with_actual_problem"],1)
        self.assertEqual(totals["agreement"]["NEXT_EVIDENCE"]["rate"],1)
        self.assertEqual(result["groups"][0]["provenance"],"synthetic-unit-fixture")

    def test_cli_new_game_dry_run_blind_no_secret_stdout(self):
        payload=Path(self.temp.name)/"state.json";payload.write_text(json.dumps(state()))
        command=["python3",str(ROOT/"tools/jev-shadow.py"),"--game-id","game020","--log",str(self.log),"record","B",str(payload),"--dry-run"]
        result=subprocess.run(command,capture_output=True,text=True,check=True)
        output=json.loads(result.stdout)
        self.assertEqual(output["status"],"DRY_RUN")
        self.assertNotIn("PRIMARY_CAUSE",output)
        self.assertNotIn(FAKE_KEY,result.stdout+result.stderr)

    def test_annotate_not_found_does_not_silently_succeed(self):
        self.record()
        with self.assertRaises(ValueError): jev.annotate("X",judgment(),"game020",self.log)

    def test_human_route_is_separate_from_recorded_human_verdict(self):
        self.record()
        actual=judgment();actual["NEXT_EVIDENCE"]="HUMAN_FEEL_TEST";actual["actual_next_action"]["method"]="HUMAN_FEEL_TEST"
        row=jev.annotate("B",actual,"game020",self.log)
        stats=jev.summarize([row])
        self.assertEqual(stats["human_routed"],0)
        self.assertEqual(stats["actual_human_actions"],1)
        self.assertEqual(stats["human_judgment_recorded"],0)


if __name__ == "__main__":
    unittest.main()
