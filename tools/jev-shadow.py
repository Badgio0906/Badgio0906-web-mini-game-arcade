"""Development-only Jev finding routing. No runtime imports, repairs or release gates."""
import argparse
import datetime
import fcntl
import json
import math
import os
import re
import time
import tempfile
import urllib.error
import urllib.request
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL = "typesafe/jev-1.13"
ENDPOINT = "https://openrouter.ai/api/alpha/decisions"
SCHEMA_VERSION = 2
CODEX_THRESHOLD = 0.45
RISK_COMPARISON_THRESHOLD = 0.5  # Evaluation only, never a release gate.
QUESTIONS = {
    "PRIMARY_CAUSE": {
        "type": "choice",
        "instructions": "この観測で扱う問題の主原因を、次の中から最も適切な1つに分類してください。情報不足ならUNKNOWN。最終原因の断定ではなく調査先の参考です。",
        "criteria": {
            "PRODUCT_BUG": "ゲーム本体、UI、入力、ロジック、状態管理、保存、製品CSSやレイアウトが主原因",
            "TEST_INFRA_BUG": "テストコード、runner、selector、テストデータ、CI、ブラウザ自動操作、検証環境が主原因",
            "CONTENT_OR_SPEC_ISSUE": "問題文、表示内容、仕様、要求定義、コンテンツ、期待仕様との不一致が主原因",
            "VISUAL_OR_FEEL_ISSUE": "機能上は成立しているが視認性、美観、操作感、テンポ、難度感、ゲームフィールが主問題",
            "UNKNOWN": "情報不足、または主原因を合理的に分類できない",
        },
    },
    "CODEX_ACTION_REQUIRED": {"type": "noul", "instructions": "このfindingを解決または十分に判定するために、ソースコード、テスト、仕様、データ等をCodexが追加で調査または修正する必要があるか。レビューを省略する許可ではありません。"},
    "NEXT_EVIDENCE": {
        "type": "choice",
        "instructions": "このfindingを次に最も効率よく判定・解決するために、最初に取得すべき追加証拠または確認方法を最も適切な1つ選んでください。UIだから静止画、ゲームだから人間と分類せず、不確実性を最も減らす次の1手を選ぶ。画像評価・面白さの最終判断そのものは行わない。",
        "criteria": {
            "CODE_INSPECTION": "Codexがソース、CSS、状態管理、処理フローを読む",
            "AUTOMATED_TEST": "再現テスト、数値、DOM、座標、score、保存値を自動検証",
            "SCREENSHOT_REVIEW": "実画面をキャプチャしCodex Visual、必要ならHumanが視認性、配置、重なり、clip、形状、色を確認",
            "LIVE_INTERACTION": "ブラウザ実操作、必要なら人間の実機で入力反応、遷移、タイミング、タッチ、ドラッグを確認",
            "HUMAN_FEEL_TEST": "コード、ログ、テスト、静止画では決められない楽しさ、気持ちよさ、難度、テンポ、酔い、再挑戦意欲を人間が試遊",
            "NO_FURTHER_EVIDENCE": "現在の情報だけで十分に判断できる",
            "UNKNOWN": "次の確認方法を判断できない。Codexで情報収集",
        },
    },
    "RELEASE_RISK_IF_UNRESOLVED": {"type": "noul", "instructions": "このfindingが未解決の状態で公開された場合、ユーザーが正常に遊べない、重大な誤解をする、進行不能になる、重要な操作ができない、または重大な品質問題になる可能性が高いか。参考のrelease risk signalだけであり、公開可否は決定しない。"},
}
STATE_KEYS = {"finding_id", "problem", "observed", "expected", "operation", "reproduction", "measurements", "test_name", "viewport", "evidence", "unknown", "provenance"}
FORBIDDEN = re.compile(r"修正済|製品バグと判明|テスト側の問題だった|テスト基盤が原因|既知の正解|最終評価|最終結論|ground[ _-]?truth|codex[ _-]?(final|independent)|final[ _-]?root[ _-]?cause|human[ _-]?(final|judgment)|known[ _-]?primary[ _-]?cause|\bP[12]\b|\b(?:PRODUCT_BUG|TEST_INFRA_BUG|CONTENT_OR_SPEC_ISSUE|VISUAL_OR_FEEL_ISSUE)\b|OPENROUTER_API_KEY|Authorization|\bBearer\b|\bsk-[A-Za-z0-9_-]+", re.IGNORECASE)


def timestamp():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def safe_name(value):
    return isinstance(value, str) and bool(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.:-]{0,99}", value))


def number(value, *, probability=False):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and (not probability or 0 <= value <= 1)


def text_value(value, maximum=1000):
    return isinstance(value, str) and 0 < len(value) <= maximum


def secret_free(value):
    """Do not log arbitrary response bodies, headers or exception text."""
    encoded = json.dumps(value, ensure_ascii=False, allow_nan=False)
    key = os.environ.get("OPENROUTER_API_KEY")
    if (key and key in encoded) or re.search(r"\bsk-[A-Za-z0-9_-]+|\bBearer\s+\S+|Authorization|OPENROUTER_API_KEY", encoded, re.IGNORECASE):
        raise ValueError("Sensitive content rejected")
    return value


def validate_state(state):
    if not isinstance(state, dict) or set(state) - STATE_KEYS:
        raise ValueError("Invalid finding fields")
    if not safe_name(state.get("finding_id")) or not text_value(state.get("problem"), 500) or not text_value(state.get("expected")):
        raise ValueError("Finding identity, one problem and expected behavior are required")
    for name in ("observed", "unknown", "reproduction", "evidence"):
        if name not in state and name in ("reproduction", "evidence"):
            continue
        values = state.get(name)
        if not isinstance(values, list) or len(values) > 12 or (name == "observed" and not values) or any(not text_value(v, 500) for v in values):
            raise ValueError("Invalid short observation list")
    for name in ("operation", "test_name", "provenance"):
        if name in state and not text_value(state[name], 500):
            raise ValueError("Invalid finding text")
    metrics = state.get("measurements", {})
    if not isinstance(metrics, dict) or len(metrics) > 40 or any(not safe_name(k) or not (v is None or isinstance(v, bool) or number(v) or text_value(v, 200)) for k, v in metrics.items()):
        raise ValueError("Measurements must be bounded primitives")
    if "viewport" in state:
        if not isinstance(state["viewport"], dict) or set(state["viewport"]) != {"width", "height"} or any(not isinstance(v, int) or isinstance(v, bool) or not 1 <= v <= 10000 for v in state["viewport"].values()):
            raise ValueError("Invalid viewport")
    secret_free(state)
    encoded = json.dumps(state, ensure_ascii=False, allow_nan=False)
    if len(encoded.encode()) > 12000 or FORBIDDEN.search(encoded):
        raise ValueError("Oversized state or retrospective label leakage")
    return state


@contextmanager
def locked_log(path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    # A stable separate inode keeps locking valid across atomic log replacement.
    with Path(str(path) + ".jev-lock").open("a+") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            with path.open("a+", encoding="utf-8") as target:
                target.seek(0)
                lines = target.readlines()
                if lines and not lines[-1].endswith("\n"):
                    raise ValueError("Log must end with a newline")
                rows = [json.loads(line) for line in lines]
                yield target, lines, rows
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)


def replace_log(path, lines):
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=Path(path).parent, prefix=".jev-", suffix=".tmp", delete=False) as target:
            temporary = Path(target.name)
            target.writelines(lines)
            target.flush()
            os.fsync(target.fileno())
        os.replace(temporary, path)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()


def choice_answer(answer, question):
    if not isinstance(answer, dict) or answer.get("type") != "choice":
        raise ValueError("Invalid choice response")
    probabilities = answer.get("probabilities")
    if not isinstance(probabilities, dict) or set(probabilities) != set(QUESTIONS[question]["criteria"]):
        raise ValueError("Invalid choice keys")
    if answer.get("choice") not in probabilities or any(not number(v, probability=True) for v in probabilities.values()) or abs(sum(probabilities.values()) - 1) > 0.02:
        raise ValueError("Invalid choice probabilities")
    return {"selected": answer["choice"], "probabilities": probabilities}


def parse_response(data):
    if not isinstance(data, dict) or not isinstance(data.get("answers"), dict):
        raise ValueError("Invalid API response")
    answers = data["answers"]
    parsed = {}
    for name, question in QUESTIONS.items():
        if question["type"] == "choice":
            parsed[name] = choice_answer(answers.get(name), name)
        else:
            answer = answers.get(name)
            if not isinstance(answer, dict) or answer.get("type") != "noul" or not number(answer.get("noul"), probability=True):
                raise ValueError("Invalid noul response")
            parsed[name] = {"noul": answer["noul"]}
    model = data.get("model")
    if model is not None and (not isinstance(model, str) or not re.fullmatch(r"[A-Za-z0-9_./:-]{1,128}", model)):
        raise ValueError("Invalid resolved model")
    usage = data.get("usage") if isinstance(data.get("usage"), dict) else {}
    parsed["resolved_model"] = model
    for source, name in (("input_tokens", "input_tokens"), ("output_tokens", "output_tokens"), ("cost", "cost_usd")):
        value = usage.get(source)
        valid = number(value) and value >= 0 and (source == "cost" or isinstance(value, int))
        parsed[name] = value if valid else None
    return secret_free(parsed)


def api_request(body, key):
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs):
            return None
    request = urllib.request.Request(ENDPOINT, data=json.dumps(body, ensure_ascii=False, allow_nan=False).encode(), headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"}, method="POST")
    opener = urllib.request.build_opener(NoRedirect)
    with opener.open(request, timeout=30) as response:
        # Bounded response; never persist the body or headers.
        payload = response.read(131073)
        if len(payload) > 131072:
            raise ValueError("Oversized response")
        return response.status, json.loads(payload)


def record(checkpoint, state, game_id, log_path, *, dry_run=False, transport=None):
    validate_state(state)
    if not safe_name(checkpoint) or not re.fullmatch(r"game\d{3,6}|shared|portal", game_id):
        raise ValueError("Invalid game or checkpoint")
    identity = state["finding_id"]
    entry = {"schema_version": SCHEMA_VERSION, "timestamp": timestamp(), "game_id": game_id, "finding_id": identity, "checkpoint": checkpoint, "state_summary": state,
             "requested_model": MODEL, "resolved_model": None, "status": "UNAVAILABLE", "shadow_mode": True, "api_attempted": False,
             "candidate_codex_threshold": CODEX_THRESHOLD, "risk_comparison_threshold": RISK_COMPARISON_THRESHOLD,
             **{name: None for name in QUESTIONS}, "input_tokens": None, "output_tokens": None, "cost_usd": None, "latency_seconds": None,
             "jev_routing": None, "codex_independent_judgment": None, "actual_next_action": None, "human_judgment": None, "final_root_cause": None,
             "agreement": None, "codex_false_pass": None, "release_risk_miss": None}
    with locked_log(log_path) as (target, lines, rows):
        if any(row.get("game_id") == game_id and row.get("finding_id", row.get("checkpoint_id")) == identity and row.get("checkpoint", row.get("checkpoint_id")) == checkpoint for row in rows):
            raise ValueError("Finding/checkpoint already recorded; no duplicate request")
        key = os.environ.get("OPENROUTER_API_KEY")
        if key and not dry_run:
            # Reserve durably before sending: a crash must not permit the same call again.
            entry["api_attempted"] = True
            entry["error"] = "attempt_not_completed"
            secret_free(entry)
            target.seek(0, 2)
            target.write(json.dumps(entry, ensure_ascii=False, allow_nan=False) + "\n")
            target.flush()
            os.fsync(target.fileno())
        if dry_run:
            entry["status"] = "DRY_RUN"
        elif not key:
            entry["error"] = "missing_credentials"
        else:
            started = time.perf_counter()
            entry["api_attempted"] = True
            try:
                status, data = (transport or api_request)({"model": MODEL, "state": {"game_id": game_id, **state}, "questions": QUESTIONS}, key)
                entry["http_status"] = status
                if status != 200:
                    raise ValueError("Non-success response")
                parsed = parse_response(data)
                entry.update(parsed)
                entry["status"] = "AVAILABLE"
                entry.pop("error", None)
                entry["jev_routing"] = parsed["NEXT_EVIDENCE"]["selected"]
            except urllib.error.HTTPError as error:
                entry["http_status"] = error.code
                entry["error"] = "http_error"
            except (TimeoutError, urllib.error.URLError, OSError):
                entry["error"] = "network_or_timeout"
            except Exception:
                entry["error"] = "invalid_response"
            entry["latency_seconds"] = time.perf_counter() - started
        secret_free(entry)
        encoded = json.dumps(entry, ensure_ascii=False, allow_nan=False) + "\n"
        if entry["api_attempted"]:
            replace_log(log_path, lines + [encoded])
        else:
            target.seek(0, 2)
            target.write(encoded)
        target.flush()
        os.fsync(target.fileno())
    return entry


def comparison(row, judgment):
    cause = row.get("PRIMARY_CAUSE")
    next_evidence = row.get("NEXT_EVIDENCE")
    action = row.get("CODEX_ACTION_REQUIRED")
    risk = row.get("RELEASE_RISK_IF_UNRESOLVED")
    score = lambda value: value.get("noul") if isinstance(value, dict) else value
    selected = lambda value: value.get("selected", value.get("choice")) if isinstance(value, dict) else None
    action, risk = score(action), score(risk)
    valid_action = number(action, probability=True) and isinstance(judgment.get("CODEX_ACTION_REQUIRED"), bool)
    valid_risk = number(risk, probability=True) and isinstance(judgment.get("RELEASE_RISK_IF_UNRESOLVED"), bool)
    agreement = {}
    if selected(cause) is not None and judgment.get("PRIMARY_CAUSE") in QUESTIONS["PRIMARY_CAUSE"]["criteria"]:
        agreement["PRIMARY_CAUSE"] = selected(cause) == judgment["PRIMARY_CAUSE"]
    if selected(next_evidence) is not None and judgment.get("NEXT_EVIDENCE") in QUESTIONS["NEXT_EVIDENCE"]["criteria"]:
        agreement["NEXT_EVIDENCE"] = selected(next_evidence) == judgment["NEXT_EVIDENCE"]
    if valid_action:
        agreement["CODEX_ACTION_REQUIRED"] = (action >= CODEX_THRESHOLD) == judgment["CODEX_ACTION_REQUIRED"]
    if valid_risk:
        agreement["RELEASE_RISK_IF_UNRESOLVED"] = (risk >= RISK_COMPARISON_THRESHOLD) == judgment["RELEASE_RISK_IF_UNRESOLVED"]
    return agreement or None, (action < CODEX_THRESHOLD and judgment["CODEX_ACTION_REQUIRED"] if valid_action else None), (risk < RISK_COMPARISON_THRESHOLD and judgment["RELEASE_RISK_IF_UNRESOLVED"] if valid_risk else None)


def annotate(checkpoint, judgment, game_id, log_path):
    allowed = {"finding_id", *QUESTIONS, "rationale", "evidence", "reviewer", "actual_next_action", "human_judgment", "final_root_cause"}
    if not isinstance(judgment, dict) or set(judgment) - allowed or not safe_name(judgment.get("finding_id")):
        raise ValueError("Invalid independent judgment fields")
    for name, question in QUESTIONS.items():
        if question["type"] == "choice" and judgment.get(name) not in question["criteria"]:
            raise ValueError("Invalid independent choice")
        if question["type"] == "noul" and not isinstance(judgment.get(name), bool):
            raise ValueError("Independent noul comparison requires a boolean")
    if any(not text_value(judgment.get(name), 2000) for name in ("rationale", "reviewer")):
        raise ValueError("Actual review and action evidence required")
    action = judgment.get("actual_next_action")
    if not isinstance(action, dict) or set(action) != {"method", "description", "evidence"} or action.get("method") not in QUESTIONS["NEXT_EVIDENCE"]["criteria"] or not text_value(action.get("description"), 2000) or not isinstance(action.get("evidence"), list) or not action["evidence"] or any(not text_value(v, 500) for v in action["evidence"]):
        raise ValueError("Actual evidence method, description and references required")
    evidence = judgment.get("evidence")
    if not isinstance(evidence, list) or not evidence or any(not text_value(v, 500) for v in evidence):
        raise ValueError("Independent evidence references required")
    if judgment.get("final_root_cause") is not None and judgment["final_root_cause"] not in QUESTIONS["PRIMARY_CAUSE"]["criteria"]:
        raise ValueError("Invalid final cause")
    if judgment.get("human_judgment") is not None and (not isinstance(judgment["human_judgment"], dict) or set(judgment["human_judgment"]) != {"observed_at", "evidence", "judgment"} or any(not text_value(v, 2000) for v in judgment["human_judgment"].values())):
        raise ValueError("Actual human observation, evidence and judgment required")
    secret_free(judgment)
    with locked_log(log_path) as (target, lines, rows):
        matches = [i for i, row in enumerate(rows) if row.get("schema_version") == 2 and row.get("game_id") == game_id and row.get("checkpoint") == checkpoint and row.get("finding_id") == judgment["finding_id"]]
        if len(matches) != 1:
            raise ValueError("New-schema finding not found or ambiguous; historical logs are read-only")
        i = matches[0]
        entry = rows[i]
        if entry.get("codex_independent_judgment") is not None:
            raise ValueError("Independent judgment already recorded; preserve original")
        entry["codex_independent_judgment"] = {name: judgment[name] for name in (*QUESTIONS, "rationale", "reviewer", "evidence")}
        for name in ("actual_next_action", "human_judgment", "final_root_cause"):
            entry[name] = judgment.get(name)
        entry["codex_review_recorded_at"] = timestamp()
        if entry["status"] == "AVAILABLE":
            entry["agreement"], entry["codex_false_pass"], entry["release_risk_miss"] = comparison(entry, judgment)
        secret_free(entry)
        lines[i] = json.dumps(entry, ensure_ascii=False, allow_nan=False) + "\n"
        replace_log(log_path, lines)  # Every historical line is preserved byte for byte.
    return entry


def summarize(rows):
    """Read old/new logs; never rewrite old scores or invent NEXT_EVIDENCE."""
    available = [r for r in rows if r.get("status") in ("AVAILABLE", "available")]
    dry = [r for r in rows if r.get("status") == "DRY_RUN"]
    unavailable = [r for r in rows if r.get("status") in ("UNAVAILABLE", "shadow_unavailable")]
    def sum_reported(name):
        values = [r[name] for r in rows if r not in dry and number(r.get(name))]
        return sum(values) if values else None
    def score(r, name):
        value = r.get(name)
        return value.get("noul") if isinstance(value, dict) else value
    counts = {"TP": 0, "TN": 0, "FP": 0, "FN": 0}
    agreement_counts = {name: {"matched": 0, "compared": 0, "rate": None} for name in ("PRIMARY_CAUSE", "NEXT_EVIDENCE")}
    false_pass, risk_miss, low_compared = 0, 0, 0
    low_count = sum(number(score(r, "CODEX_ACTION_REQUIRED"), probability=True) and score(r, "CODEX_ACTION_REQUIRED") < CODEX_THRESHOLD for r in available)
    for row in available:
        judgment = row.get("codex_independent_judgment") or row.get("codex_final_judgment") or {}
        agreement, missed_action, missed_risk = comparison(row, judgment)
        for name in agreement_counts:
            if agreement and name in agreement:
                agreement_counts[name]["compared"] += 1
                agreement_counts[name]["matched"] += int(agreement[name])
        value = score(row, "CODEX_ACTION_REQUIRED")
        actual = judgment.get("CODEX_ACTION_REQUIRED")
        if number(value, probability=True) and isinstance(actual, bool):
            predicted = value >= CODEX_THRESHOLD
            counts["TP" if predicted and actual else "FP" if predicted else "FN" if actual else "TN"] += 1
            low_compared += int(not predicted)
        false_pass += int(missed_action is True)
        risk_miss += int(missed_risk is True)
    for values in agreement_counts.values():
        if values["compared"]:
            values["rate"] = values["matched"] / values["compared"]
    attempted = [r for r in rows if r.get("api_attempted") is True or ("api_attempted" not in r and (r.get("status") == "available" or isinstance(r.get("http_status"), int)))]
    latencies = [r["latency_seconds"] for r in attempted if number(r.get("latency_seconds"))]
    result = {"entries": len(rows), "jev_invocations": len(rows) - len(dry), "api_attempts_known": len(attempted), "dry_runs": len(dry), "available": len(available), "jev_unavailable": len(unavailable),
              "total_input_tokens": sum_reported("input_tokens"), "total_output_tokens": sum_reported("output_tokens"), "total_cost_usd": sum_reported("cost_usd"),
              "usage_missing": {name: sum(r.get(name) is None for r in rows if r not in dry) for name in ("input_tokens", "output_tokens", "cost_usd")},
              "average_latency_seconds": sum(latencies) / len(latencies) if latencies else None,
              "agreement": agreement_counts, "codex_action_confusion": counts, "codex_action_below_045": low_count, "below_045_independently_reviewed": low_compared,
              "below_045_with_actual_problem": false_pass, "codex_false_pass": false_pass, "release_risk_miss": risk_miss,
              "release_risk_compared": sum("RELEASE_RISK_IF_UNRESOLVED" in (comparison(r, r.get("codex_independent_judgment") or r.get("codex_final_judgment") or {})[0] or {}) for r in available),
              "human_routed": (sum(isinstance(r.get("NEXT_EVIDENCE"), dict) and r["NEXT_EVIDENCE"].get("selected") == "HUMAN_FEEL_TEST" for r in available) if any(isinstance(r.get("NEXT_EVIDENCE"), dict) for r in available) else None),
              "human_routing_observed": sum(isinstance(r.get("NEXT_EVIDENCE"), dict) for r in available),
              "actual_human_actions": (sum(isinstance(r.get("actual_next_action"), dict) and r["actual_next_action"].get("method") == "HUMAN_FEEL_TEST" for r in rows) if any(isinstance(r.get("actual_next_action"), dict) for r in rows) else None),
              "actual_actions_recorded": sum(isinstance(r.get("actual_next_action"), dict) for r in rows),
              "human_judgment_recorded": sum(r.get("human_judgment", r.get("human_final_judgment")) is not None for r in rows),
              "unreviewed_available": sum(not (r.get("codex_independent_judgment") or r.get("codex_final_judgment")) for r in available)}
    return result


def summary_files(paths):
    rows = []
    for path in dict.fromkeys(Path(path).resolve() for path in paths):
        rows.extend(json.loads(line) for line in Path(path).read_text().splitlines() if line.strip())
    # Distinct groups prevent historical/synthetic smoke calls becoming new-game evidence.
    groups = {}
    for row in rows:
        key = (row.get("game_id", "unknown"), str(row.get("schema_version", 1)), row.get("state_summary", {}).get("provenance", "historical-unmarked"))
        groups.setdefault(key, []).append(row)
    return {"schema_version": 2, "thresholds": {"codex_candidate": CODEX_THRESHOLD, "risk_comparison_only": RISK_COMPARISON_THRESHOLD}, "totals": summarize(rows), "groups": [{"game_id": key[0], "log_schema_version": int(key[1]), "provenance": key[2], **summarize(value)} for key, value in sorted(groups.items())], "limitations": ["Agreement is against recorded independent Codex review, not universal ground truth.", "Missing usage stays missing; sums are reported amounts only.", "Historical human-only scores do not map to NEXT_EVIDENCE.", "Smoke/synthetic/historical/new-game cohorts are distinct; no automatic gate or savings estimate."]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game-id", help="game020 etc; shared/portal also allowed")
    parser.add_argument("--log", type=Path, help="Explicit new task log; historical logs are not overwritten")
    commands = parser.add_subparsers(dest="action", required=True)
    for action in ("record", "annotate"):
        sub = commands.add_parser(action)
        sub.add_argument("checkpoint")
        sub.add_argument("json_file", type=Path)
        if action == "record":
            sub.add_argument("--dry-run", action="store_true")
            sub.add_argument("--show-decisions", action="store_true", help="Only for non-blind inspection, not an independent reviewer")
    sub = commands.add_parser("summary")
    sub.add_argument("logs", nargs="+", type=Path)
    sub.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        if args.action == "summary":
            result = summary_files(args.logs)
            secret_free(result)
            if args.output:
                args.output.parent.mkdir(parents=True, exist_ok=True)
                args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n")
            print(json.dumps(result, ensure_ascii=False, allow_nan=False))
            return
        if not args.game_id or not re.fullmatch(r"game\d{3,6}|shared|portal", args.game_id):
            raise ValueError("Explicit valid game ID required")
        log = args.log or ROOT / "docs" / args.game_id / "QA/JEV_SHADOW.jsonl"
        payload = json.loads(args.json_file.read_text())
        if args.action == "record":
            result = record(args.checkpoint, payload, args.game_id, log, dry_run=args.dry_run)
            names = ["schema_version", "game_id", "finding_id", "checkpoint", "status", "requested_model", "resolved_model", "http_status", "error", "input_tokens", "output_tokens", "cost_usd", "latency_seconds"]
            if args.show_decisions:
                names.extend(QUESTIONS)
            print(json.dumps({name: result.get(name) for name in names}, ensure_ascii=False))
        else:
            result = annotate(args.checkpoint, payload, args.game_id, log)
            print(json.dumps({name: result.get(name) for name in ("finding_id", "status", "agreement", "codex_false_pass", "release_risk_miss")}, ensure_ascii=False))
    except (ValueError, OSError, TypeError, KeyError):
        parser.exit(2, "Jev helper input/log validation failed; inspect sanitized schema and continue normal Codex QA.\n")


if __name__ == "__main__":
    main()
