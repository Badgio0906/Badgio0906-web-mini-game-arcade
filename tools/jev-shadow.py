"""Development-only Jev Decisions shadow logger. Never imported by the game."""
import argparse
import datetime
import json
import math
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

QUESTIONS = {
    "PRIMARY_CAUSE": {
        "type": "choice",
        "instructions": "このcheckpointの観測で示される問題の主原因を1つ選ぶ。問題を観測できない、または情報が不十分ならUNKNOWN。",
        "criteria": {
            "PRODUCT_BUG": "ゲーム・UI・入力・ロジックなど製品コード側が主原因",
            "TEST_INFRA_BUG": "テストコード・テストデータ・テスト環境など開発検証側が主原因",
            "CONTENT_OR_SPEC_ISSUE": "問題文・表示内容・仕様・要求との不一致が主原因",
            "VISUAL_OR_FEEL_ISSUE": "視認性・美観・操作感・テンポ・難度感・ゲームフィールが主原因",
            "UNKNOWN": "情報不足または分類困難",
        },
    },
    "CODEX_ACTION_REQUIRED": {"type": "noul", "instructions": "ソースコード、テスト、仕様を調査または修正するため、Codexによる追加作業が必要か"},
    "HUMAN_ONLY_JUDGMENT_REQUIRED": {"type": "noul", "instructions": "この問題の合否は、コード、仕様、DOM、座標、自動テスト、ログ等だけでは十分に決定できず、実際の視覚的印象、操作感、楽しさ、難度感などを人間が体験して判断しなければならないか。単にUI・入力・ゲーム画面に関係するという理由だけでYesにしないこと。"},
    "RELEASE_RISK_IF_UNRESOLVED": {"type": "noul", "instructions": "この問題が未解決の状態で公開された場合、ユーザーが正常に遊べない、誤解する、または重大な品質問題となる可能性が高いか。これは参考用のrisk signalであり、Jev自身が公開可否を決定するものではない。"},
}
ROOT = Path(__file__).resolve().parents[1]
GAME_ID = "game017"
LOG = ROOT / "docs" / GAME_ID / "QA/JEV_SHADOW.jsonl"

def record(checkpoint, state):
    # Caller supplies contemporaneous observations only, never a Codex final diagnosis.
    encoded = json.dumps(state, ensure_ascii=False)
    for forbidden in ["修正済", "製品バグと判明", "テスト基盤が原因", "既知の正解", "P1として修正", "ground_truth", "codex_final_judgment"]:
        if forbidden.casefold() in encoded.casefold():
            raise ValueError("Retrospective diagnosis is forbidden in request state")
    existing = [json.loads(line) for line in LOG.read_text().splitlines()] if LOG.exists() else []
    if any(row["checkpoint_id"] == checkpoint for row in existing):
        raise ValueError("Checkpoint already recorded; no duplicate request")
    key = os.environ.get("OPENROUTER_API_KEY")
    entry = {"timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(), "game_id": GAME_ID, "checkpoint_id": checkpoint, "state_summary": state, "requested_model": "typesafe/jev-1.13", "resolved_model": None, "shadow_mode": True, "candidate_codex_threshold": 0.45, "codex_final_judgment": None, "human_final_judgment": None, "agreement": None}
    started = time.perf_counter()
    if not key:
        entry["status"] = "shadow_unavailable"
        entry["error"] = "OPENROUTER_API_KEY unavailable"
    else:
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, *args, **kwargs):
                return None
        opener = urllib.request.build_opener(NoRedirect)
        body = {"model": entry["requested_model"], "state": state, "questions": QUESTIONS}
        request = urllib.request.Request("https://openrouter.ai/api/alpha/decisions", data=json.dumps(body, ensure_ascii=False).encode(), headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"}, method="POST")
        try:
            with opener.open(request, timeout=30) as response:
                data = json.load(response)
                entry["http_status"] = response.status
            answers = data.get("answers", {})
            primary = answers.get("PRIMARY_CAUSE", {})
            if primary.get("type") != "choice" or set(primary.get("probabilities", {})) != set(QUESTIONS["PRIMARY_CAUSE"]["criteria"]):
                raise ValueError("Invalid choice response")
            probabilities = primary["probabilities"]
            if primary.get("choice") not in probabilities or any(not isinstance(v, (int, float)) or isinstance(v, bool) or not math.isfinite(v) or not 0 <= v <= 1 for v in probabilities.values()) or abs(sum(probabilities.values()) - 1) > 0.02:
                raise ValueError("Invalid choice probabilities")
            for name in QUESTIONS:
                if name != "PRIMARY_CAUSE":
                    if answers.get(name, {}).get("type") != "noul" or not 0 <= answers[name]["noul"] <= 1:
                        raise ValueError("Invalid noul response")
            entry.update({"status": "available", "resolved_model": data.get("model"), "PRIMARY_CAUSE": primary, **{name: answers[name]["noul"] for name in QUESTIONS if name != "PRIMARY_CAUSE"}, "input_tokens": data.get("usage", {}).get("input_tokens"), "output_tokens": data.get("usage", {}).get("output_tokens"), "cost_usd": data.get("usage", {}).get("cost")})
        except urllib.error.HTTPError as error:
            entry["status"] = "shadow_unavailable"
            entry["http_status"] = error.code
            entry["error"] = "HTTP error; continuing normal Codex QA"
        except Exception as error:
            entry["status"] = "shadow_unavailable"
            entry["error"] = type(error).__name__
    entry["latency_seconds"] = time.perf_counter() - started
    safe = json.dumps(entry, ensure_ascii=False)
    if key:
        safe = safe.replace(key, "[REDACTED]")
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a") as target:
        target.write(safe + "\n")
    print(json.dumps({k: entry.get(k) for k in ["checkpoint_id", "status", "http_status", "PRIMARY_CAUSE", "CODEX_ACTION_REQUIRED", "HUMAN_ONLY_JUDGMENT_REQUIRED", "RELEASE_RISK_IF_UNRESOLVED", "cost_usd", "latency_seconds"]}, ensure_ascii=False))

def annotate(checkpoint, judgment):
    entries = [json.loads(line) for line in LOG.read_text().splitlines()]
    for entry in entries:
        if entry["checkpoint_id"] != checkpoint:
            continue
        if entry["codex_final_judgment"] is not None:
            raise ValueError("Judgment already recorded")
        entry["codex_final_judgment"] = judgment
        if entry["status"] == "available":
            matches = {}
            if "PRIMARY_CAUSE" in judgment:
                matches["PRIMARY_CAUSE"] = entry["PRIMARY_CAUSE"]["choice"] == judgment["PRIMARY_CAUSE"]
            for name in QUESTIONS:
                if name != "PRIMARY_CAUSE" and name in judgment:
                    matches[name] = (entry[name] >= (0.45 if name == "CODEX_ACTION_REQUIRED" else 0.5)) == judgment[name]
            entry["agreement"] = matches
            entry["codex_below_candidate_threshold"] = entry["CODEX_ACTION_REQUIRED"] < 0.45
            entry["false_pass"] = judgment.get("RELEASE_RISK_IF_UNRESOLVED") is True and entry["RELEASE_RISK_IF_UNRESOLVED"] < 0.5
        entry["codex_review_recorded_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    LOG.write_text("".join(json.dumps(entry, ensure_ascii=False) + "\n" for entry in entries))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--game-id", choices=["game017", "game018"], default="game017")
    parser.add_argument("action", choices=["record", "annotate"])
    parser.add_argument("checkpoint")
    parser.add_argument("json_file")
    args = parser.parse_args()
    GAME_ID = args.game_id
    LOG = ROOT / "docs" / GAME_ID / "QA/JEV_SHADOW.jsonl"
    payload = json.loads(Path(args.json_file).read_text())
    record(args.checkpoint, payload) if args.action == "record" else annotate(args.checkpoint, payload)
