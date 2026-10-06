# JEV_REVIEW_RULES — findingの分類・次の証拠へのrouting

2026-10-06正式更新。**この文書がJev運用の正本。現行protocolはschema_version: 2、Shadow Mode。** 今回以後の新規開発・改修でfindingが出たら適用する。過去のゲーム仕様・ログにあるhuman-onlyや6問方式は当時の履歴として保持し、現行質問へ戻さない。今回のユーザー指示が本書より優先する。

## 役割と境界

Jevは、観測された1つの問題の主原因、Codex追加作業の必要性、最初に取得する追加証拠、未解決で公開した場合のリスク信号を返す**開発用routing層**。

コードを書かせない。修正内容、レビュー省略、面白さ、画像の品質、Feel、公開可否を決めさせない。Jevは実プレイも画像評価も代行しない。画像を見たCodex/Humanの観測文を入力することと、Jevが画像を見て評価することを混同しない。

ゲームのブラウザ、Worker、得点、抽選、入力、保存、release gateへ接続しない。実装は[開発helper](../tools/jev-shadow.py)だけ。CIではoffline helperテストのみ実行でき、Jev APIやJevによる公開判定を走らせない。

## 運用の順番

1. 自動テスト／ブラウザ実操作／Codex／Humanが、客観的なfindingを観測する。
2. **1 finding = 1つの主問題**に分け、finding_idを付ける。同じ原因の複数測定は1件でよい。器の視認性、横画面の圧縮、慎重／急操作のFeelは別件。
3. その時点の観測だけを短い構造化stateにし、Jevへ4問を1回のDecisions requestで送る。
4. CodexがJevの答えに依存せず調査・判断する。可能なら担当を分け、レビュアーはJevログを見ずに判断を記録する。helperのrecord標準出力は答えを隠す。
5. 必要な証拠取得、限定修正または対応不要判断、再テストを行う。Jevのroutingだけで従来QA工程を削除しない。
6. 実際のCodex判断・証拠・行った方法をannotateし、Jevとの比較を保存する。
7. 判断が残る場合にのみ、新しい観測として次のcheckpointへ送る。診断済みラベルをstateへ戻さない。
8. QA／Visual／Feel／必要なHuman確認を経て、通常のRelease Gateで公開判断する。

## 基本の4質問

| 質問 | 型・返すもの | 用途 |
|---|---|---|
| PRIMARY_CAUSE | choice、主原因1つ＋全確率 | 最初に読むコード／仕様／テスト等の参考。最終原因の断定ではない |
| CODEX_ACTION_REQUIRED | noul | 解決または十分な判定に、Codexのソース・テスト・仕様・データ調査／修正が必要か |
| NEXT_EVIDENCE | choice、次の証拠1つ＋全確率 | 不確実性を効率よく減らす最初の確認方法。Visual/Feel評価そのものではない |
| RELEASE_RISK_IF_UNRESOLVED | noul | 未解決のまま公開すると、遊べない・重大な誤解・進行不能・重要操作不能・重大品質問題になる可能性。公開許可ではない |

正確なAPI instructions/criteriaはhelperの`QUESTIONS`に定義する。PRIMARY_CAUSEとNEXT_EVIDENCEの選択肢を独立noulへ分解せず、各1つのchoiceとして問う。全choice probabilitiesを保持する。

PRIMARY_CAUSE:

- PRODUCT_BUG：ゲーム本体、UI、入力、ロジック、状態管理、保存、製品CSS／レイアウト。
- TEST_INFRA_BUG：テスト、runner、selector、データ、CI、ブラウザ自動操作、検証環境。
- CONTENT_OR_SPEC_ISSUE：問題文、表示内容、仕様、要求、コンテンツ、期待仕様との不一致。
- VISUAL_OR_FEEL_ISSUE：機能上成立しているが、視認性、美観、操作感、テンポ、難度感などが主問題。
- UNKNOWN：情報不足または合理的に分類できない。Codexの情報収集へ戻す。

## NEXT_EVIDENCEと担当

| 選択肢 | 最初の証拠・担当 |
|---|---|
| CODE_INSPECTION | Codexがソース、CSS、状態管理、処理フローを読む |
| AUTOMATED_TEST | runnerで再現・数値・DOM・座標・score・保存値を検証 |
| SCREENSHOT_REVIEW | 実画面をキャプチャしCodex Visual、必要ならHumanが配置・重なり・clip・形状・色を確認 |
| LIVE_INTERACTION | ブラウザ実操作。必要ならHuman実機でタッチ・ドラッグ・入力反応・遷移・タイミングを確認 |
| HUMAN_FEEL_TEST | 人間が楽しさ、気持ちよさ、難度、テンポ、爽快感、酔い、もう一回遊びたいかを体験 |
| NO_FURTHER_EVIDENCE | 現在の証拠で判断。Shadow中の独立Codex確認を省く意味ではない |
| UNKNOWN | Codexで情報収集 |

「UIだからSCREENSHOT」「ゲームだからHUMAN」と分類しない。骨長・文字clipなど客観的に測れる問題と、美観・自然さ・気持ちよさの判断を分ける。面白さ・Visual・Feelの最終判定はCodexの実画像／実操作レビューと必要なHumanに残す。

旧HUMAN_VISUAL_FEEL_REQUIRED／HUMAN_ONLY_JUDGMENT_REQUIREDは新しいrequestへ含めない。旧値をNEXT_EVIDENCEへ推測変換しない。

## state作成とラベル漏洩防止

入力は1つのfinding object。helperへ明示したgame_idもAPI stateに付く。必須はfinding_id、problem（主問題1つ）、expected、observed（短文配列）、unknown（未確認事項、なければ空配列）。任意はoperation、reproduction、measurements、test_name、viewport、evidence、provenance。

渡せるのは、発生操作、期待仕様、実際の結果、測定数値、座標、DOM・入力状態、score、保存値、エラー、テスト名、画面サイズ、再現条件、未確認事項、短い証拠参照。生ログ・複数問題・長い画像説明をそのまま送らない。measurementsは40項目以下のprimitive、配列は各12件まで・各500文字まで、stateは12KiB以下。provenanceで実観測／合成fixtureを明示する。

**入力禁止**：修正済み、製品バグと判明した、テスト側の問題だった、P1/P2、既知の正解、Codex最終結論、人間の最終評価、Ground Truth、Git履歴から分かった事後原因。helperは未知field・代表的なラベル漏洩・秘密らしい値を拒否する。文章の意味を完全に検出できるわけではないので、送信前に人もstateを確認する。

既存profileや集計JSONは背景資料。[JEV_PREPARATION](data/JEV_PREPARATION.md)参照。母数・欠測・版・環境を確認して1件の観測へ整理する。raw player ID、token、巨大な集計、QA成功数をJevへそのまま渡さない。

## 呼ぶ時／呼ばない時

findingがあるときだけ利用する。推奨checkpointはA:初回実装の問題、B:テストfailureの意味的な分類、C:QA finding、D:Visual finding、E:Feel finding、F:修正後も判断が残るfinding、G:Release Gate前の未解決finding。A〜Gを埋めるノルマではない。1件に複数問題を入れず、同じcheckpointでもfinding_idが違えば別件として記録する。

テスト成功数、単純PASS/FAIL、数値比較、ファイル存在、HTTP status、JSON schema、lint、build結果はスクリプトで処理する。全PASSだけのstateを大量送信しない。HTTP200だけならJev不要だが、HTTP200なのに操作不能など原因・次の証拠が不明なfindingは対象となり得る。

同一game_id/finding_id/checkpointは再送しない。失敗したAPIも同じIDで再送しない。再検証で新しい観測が出た場合のみ別checkpointまたは新しいfinding_idを用いる。個別タスクで回数上限があれば守る。

## Shadow Mode・候補閾値・見逃し

CODEX_ACTION_REQUIRED **0.45は将来の候補閾値**。現在は値にかかわらず通常のCodex独立レビューを行う。0.45未満の件数と、そのうち独立レビューで実際に追加調査／修正が必要だった件数を記録する。

- **codex_false_pass**：JevのCODEX_ACTION_REQUIRED < 0.45、かつ独立Codex判断が追加調査／修正必要=true。
- **release_risk_miss**：Jevのrisk < 0.5、かつ通常QAの独立判断が、未解決で公開できない重大リスク=true。

両者は別指標。riskの0.5は過去比較を続けるための暫定評価閾値で、公開Gateではない。0.45ちょうどは省略候補ではなく、0.5ちょうどはrisk低値として扱わない。未レビュー・API失敗は比較不能/nullで、陰性や合格にしない。

**Jevの値だけで公開／公開停止／merge／修正／レビュー省略を決めない。** 過去に見逃しがあるため自動Gate化しない。今後の新規ゲームで十分な実測、極めて少ないFALSE PASS、独立holdout検証がそろうまで自動省略へ移行しない。過去ケースだけで有効性を一般化しない。判断が後から変わった場合は元の根拠と変更理由・日付を別の調査記録へ保持し、Jevに合わせて正解を変えない。

## API・秘密・失敗時

- POST `https://openrouter.ai/api/alpha/decisions`。
- requested modelは`typesafe/jev-1.13`固定。比較中latest alias／他モデルへ置換しない。resolved modelはAPI応答値を記録し、未取得はnull。
- `OPENROUTER_API_KEY`はCodex Cloud Environment Secretだけからプロセス環境へ注入する。値を引数、コード、Markdown、JSON、ログ、README、Git、stdout、スクリーンショットへ保存・表示しない。
- 送信先と現在のネットワーク許可・keyの有無だけを確認する。環境dump、curl verbose、Authorization header出力、レスポンス本文やexception本文の丸ごと保存は禁止。
- helperは固定URL、redirect禁止、30秒timeout、レスポンス128KiB制限、許可した回答・usageだけを保存。秘密らしい入力／反射されたkeyを拒否する。
- 401/402/403/429/5xx、timeout、network error、key不足、不正応答は**UNAVAILABLE**。キーの有無やエラー種別だけを安全に記録し、通常Codex QAへ続ける。ゲーム開発を止めず、自動retryもしない。
- 秘密漏洩が疑われる場合は当該処理を止め、値を再表示せず報告する。

## ログschema v2

標準は`docs/gameNNN/QA/JEV_SHADOW.jsonl`。改訂タスクは既存の改訂QAディレクトリを`--log`で指定する。shared/portalにも対応する。各呼出し1行で以下を保存する。

| field | 型・意味 |
|---|---|
| schema_version / timestamp / game_id / finding_id / checkpoint | 2、ISO UTC、対象、1問題のID、工程 |
| state_summary | 送った同時点の観測、既知結論なし |
| requested_model / resolved_model | 固定requested、応答modelまたはnull |
| status / api_attempted / http_status / error | AVAILABLE・UNAVAILABLE・DRY_RUN、実送信有無、取得時のみstatus、安全なエラー種別 |
| PRIMARY_CAUSE / NEXT_EVIDENCE | `{selected, probabilities}`、API失敗・dry-runはnull |
| CODEX_ACTION_REQUIRED / RELEASE_RISK_IF_UNRESOLVED | `{noul}`、同上 |
| input_tokens / output_tokens / cost_usd / latency_seconds | API native usage・USD、実送信の壁時計秒。欠測null、推定しない |
| shadow_mode / candidate_codex_threshold / risk_comparison_threshold | true、0.45、比較用0.5 |
| jev_routing | NEXT_EVIDENCEのselected、実行命令ではない |
| codex_independent_judgment | 独立4判断＋rationale/reviewer/evidence、未実施null |
| actual_next_action | 実施した`{method, description, evidence}`。methodはNEXT_EVIDENCEと同じ選択肢 |
| human_judgment / final_root_cause | 実際の人間の`{observed_at, evidence, judgment}`／判明した原因。未確認null |
| agreement / codex_false_pass / release_risk_miss | 比較結果。未レビュー・UNAVAILABLEはnull |
| codex_review_recorded_at | 実際に独立判定を記録したISO日時 |

record時点で後段判断はnull。annotateは実際の独立調査・行った証拠取得の後に1回行い、元の回答やstateは変更しない。Humanが必要なら試遊・実機確認の実結果が得られたときだけhuman_judgmentを付ける。未実施ならnullとし、残課題のHUMAN_PLAYTESTへリンクする。後日結果が得られたら元のannotateを改ざんせず、同じfinding_idを引用した追補QA記録へ保存する。

旧schema（schema_versionなし＝1）のraw行・質問・判断・false_passの意味を維持する。新helperは旧ログを読み取り集計でき、追加・annotateで他行を書き換えない。旧`false_pass`はrelease見逃しを示したため、新集計では元のnoulと独立判断から**両見逃しを別々に再計算**する。元fieldを改名・再解釈して上書きしない。

## 再利用CLI

Python3/Linux。追加dependency不要。まず[サンプル](jev/QA/SMOKE_FINDING.json)の形式で1問題のstateを作る。サンプルそのものは合成であり、新規ゲームの実観測として送らない。

```sh
# APIなし。回答・usage・costを創作せずDRY_RUNを記録
python3 tools/jev-shadow.py --game-id game020 --log docs/game020/QA/JEV_DRY_RUN.jsonl record B finding.json --dry-run

# 実観測を1回送る。標準出力は答えを隠し、独立レビュアーへ見せない
python3 tools/jev-shadow.py --game-id game020 record B finding.json

# 実調査・必要なQA後に独立判断を記録
python3 tools/jev-shadow.py --game-id game020 annotate B judgment.json

# ローカル集計。API呼出しなし
python3 tools/jev-shadow.py summary docs/game020/QA/JEV_SHADOW.jsonl --output docs/game020/QA/JEV_SUMMARY.json

# offlineテスト。外部通信なし
python3 -m unittest discover -s tests/jev -p 'test_*.py' -v
```

judgment.jsonの必須fieldはfinding_id、独立PRIMARY_CAUSE、CODEX_ACTION_REQUIRED boolean、独立NEXT_EVIDENCE、RELEASE_RISK_IF_UNRESOLVED boolean、reviewer、rationale、evidence配列、actual_next_action。final_root_causeとhuman_judgmentは確認できたときだけ追加する。検査目的で答えを表示するときだけrecordに`--show-decisions`を付け、その担当による判定を盲検レビューと称さない。

## 集計と今後の評価

helperのsummaryはゲーム・log schema・provenance別に、呼出し／実送信／UNAVAILABLE、input/output tokens、報告されたcost、平均latency、PRIMARY_CAUSE一致の分子／分母、CODEX_ACTIONのTP/TN/FP/FN、NEXT_EVIDENCE routing一致、0.45未満と実際の問題、両見逃し、Human候補・実際に回した数・実評価記録数を出す。

一致の相手は記録した独立Codex判断で、普遍的Ground Truthではない。未比較件数・欠測usageを表示する。旧human-onlyをNEXT_EVIDENCEへ変換しない。合成smoke、旧ベンチマーク、実開発を混ぜて性能評価しない。Codex料金・tokensが取得不可ならnullで、Jevの低料金や短いlatencyから開発節約率を推定しない。

過去実測、ユーザー提示の第2段階評価、今回のhelper確認と限界は[評価履歴](jev/JEV_EVALUATION_HISTORY.md)を参照。新しいタスクはAGENTS→PROJECT_CONTEXT/CURRENT_STATUS→GAME_DEVELOPMENT_RULES→本書を読み、ゲーム仕様だけの依頼でもfindingがあればこのShadowフローを適用する。
