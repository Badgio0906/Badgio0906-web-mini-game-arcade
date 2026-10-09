# Game014 初回 browser probe の独立調査

調査記録: 2026-10-09T02:34:36.871239+00:00。Reviewer: `legacy_records_regression`。Jev のログ・回答は未参照。新規 API、browser 操作、製品実装は行っていない。

## 読んだ証拠

- [初回 REPORT](prototype014-01/REPORT.json): `checks: []`、desktop の answer 操作に canvas box のみ、`frame.waitForFunction: Timeout 5000ms exceeded.`。取得された failure state は `state: 3` / `hand: 3` / `score: 0` / `stage: 1` / `interval: 0.65` / `ending: Failure`。POST 0、pageerror 0。
- [初回 failure.png](prototype014-01/failure.png) を実際に閲覧した。通常の Failure 画面、STAGE 1 / 5・成功 0 / 25、再挑戦ボタンが描画されている。操作不能を示す黒画面や exception overlay ではない。
- `tests/legacy-records/prototype014.mjs` の現在版。route の `before` 側は `git show 488916c:public/...` から旧 export を配信している。初回対象が新しい record hook の export ではなく baseline 既存 export であることと一致する。
- 元 source `/workspace/legacy-games/finger-heart-challenge/scripts/main.gd`、`project.godot`。source HEAD `36877d55bb44a41087a61bfd38f3ec395040cb3c`、この調査時の source tree は clean。main.gd SHA256 `e10827c0a682ffc62265a29589e40bc74a5709983362a559534b23c5ab839576`。

## 確認済みの動作構造

1. `main.gd:3–6` の enum では RUNNING=0 / FAILED=3、HEART=0 / OK=3。最初の hand 切替間隔は 0.65 秒。
2. `_next_hand` (`main.gd:280`) は RUNNING 中に timer で hand を切替え、`_refresh_hand` から `_publish_state` を呼ぶ。QA observer はその時点の snapshot を書くもので、wait が成立した hand を入力まで固定しない。
3. `_publish_state` (`main.gd:312`) は QA=1 のみで現在 state / hand / score を readonly snapshot として公開する。snapshot に取得時刻・hand 切替時刻はない。
4. `project.godot:18–20` は Space を `stop_hand` に割当てる。`_unhandled_input` (`main.gd:333`) から `stop_hand` (`main.gd:348`) へ進み、**入力を処理する時点**の `current_hand == HEART` だけを判定する。
5. 非 HEART なら `_finish(false)` へ進み、score を加算せず FAILED にする (`main.gd:353–357`, `397–412`)。snapshot の hand=OK / score0 / FAILED と矛盾しない。

## 独立判断

- **PRIMARY_CAUSE: TEST_INFRA_BUG を第一候補とする（正確な timing 原因は未確定）。** 旧 export が自動入力に対し通常の不正解結果を返した事象であり、記録連携の改修が入力を壊した証拠ではない。初回の waitHEART → bbox 解決 / focus → Space の複数非同期処理は、その間も進む 0.65秒 hand 切替と競合し得る。score1を期待するには、入力が HEART 中に実処理された証拠が必要。
- **CODEX_ACTION_REQUIRED: true。** 初回で取得しなかった入力時 observer、時刻、focus と実入力経路を計測し、同じ条件で probe を再確認する必要がある。製品の hand interval / 当たり判定 / 得点を変更する根拠はない。
- **NEXT_EVIDENCE: AUTOMATED_TEST。** 操作前に座標・focus を解決し、wait 後に即入力する。keydown / pointer の readonly snapshot と時刻を保存し、失敗時は画面と現在状態を併存させる。DOM 入力時 snapshot と Godot 内部で実処理された hand の完全な同時性は別問題なので、この差も断定しない。
- **RELEASE_RISK_IF_UNRESOLVED: false（この finding 単独）。** 「この probe で成功が未確認」という検証不足は残るが、既存 baseline の通常失敗画面しか観測していないため、遊べない・改修起因の入力不能等の重大製品リスクを実証していない。新 export の通常成功 / 失敗 / retry / 保存の独立 QA は引き続き必要で、この分類を公開許可に使用しない。

## 未確認・証跡の限界

- **初回の Space 入力時 hand / state / focus / 時刻は未記録。** wait 解決から Space が Godot で処理されるまでの正確な時間、および HEART から OK に変化した時刻は不明。「bbox が何ms」「focusで必ず0.65秒超」「observer が何frame遅れた」と断定できない。
- 現在の `prototype014.mjs` は事前 focus / 座標解決と入力ログを追加済みで、初回版の凍結コピーではない。初回順序は親の当時の観察と残存 REPORT の bbox 記録を参照し、現在版を初回に実行した source と称していない。
- `prototype014-02` は親が実行中。完了結果をこの独立判断へ取り込んでいない。成功しても初回の未記録 timing を逆算して確定するものではない。
- この調査は source / JSON / 実画像による分析。本人試遊、物理 PC / スマホの入力感、音、人間による面白さ評価を行っていない。
