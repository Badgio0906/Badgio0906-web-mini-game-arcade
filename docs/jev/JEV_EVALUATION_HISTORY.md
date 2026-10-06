# Jev評価履歴・schema v2整備記録

運用正本は[../JEV_REVIEW_RULES.md](../JEV_REVIEW_RULES.md)。本書は評価の出典、対象、限界と今回の整備結果を保存する。違う試験・質問方式・閾値の値を混ぜて精度や節約率を作らない。

## ユーザー提供：第2段階過去試験

出典：2026-10-06の「Jevの今後の利用方法」実装指示書27節。14件の原本state・個別結果は今回のRepository調査で未確認。数値は**ユーザー提供集計として保存**し、この作業で再現した実験と称さない。

| 指標 | 提供された結果 |
|---|---|
| PRIMARY_CAUSE | 11 / 14 |
| CODEX_ACTION_REQUIRED | TP9、TN3、FP0、FN2 |
| 旧Human判定 | 過剰陽性が多いためNEXT_EVIDENCEへ変更 |
| 旧release blocking判定 | 見逃しが確認されているため自動Gate禁止 |

この集計が使用した比較閾値・全state・resolved model・cost等の未提示情報を創作しない。0.45は将来候補として保存するが、上記14件が0.45で採点されたとは断定しない。

## Repositoryに残る実開発の旧ログ

- [Game017報告](../game017/JEV_SHADOW_REPORT.md)：9 calls。
- [Game018報告](../game018/JEV_SHADOW_REPORT.md)：8 calls。
- [7作品改修の報告](../seven-games-2026-10-06/JEV_REPORT.md)：003／008／009／018に計4 calls。他3作品にAPI実行なし。
- [SHADOW_CASES.json](SHADOW_CASES.json)：さらに古い6問の準備記録、apiCallsMade0。実測へ加えない。

旧21行はPRIMARY_CAUSE＋CODEX_ACTION＋HUMAN_ONLY＋riskの方式。今回の4質問v2とはNEXT_EVIDENCEが異なる。元のログ・state・annotation・当時の`false_pass`fieldは変更しない。

今回helperで旧21行を読み取り再集計：[HISTORICAL_SUMMARY.json](QA/HISTORICAL_SUMMARY.json)。PRIMARY_CAUSE一致14/21、CODEX_ACTIONを0.45で比較したTP15/TN4/FP0/FN2、0.45未満6件中2件で独立Codex追加作業必要。**CODEX FALSE PASSは2件、比較用risk0.5のRELEASE RISK MISSは0/21。** この別系列のrisk0件は、上の第2段階試験の見逃しを否定しない。

NEXT_EVIDENCEは旧ログに存在しないので比較母数0・率null。Humanへのrouting数も旧human-onlyから推定しない。Jevの低actionで独立QAを省くべきではないことが、これらの実開発ログからも分かる。元のCodex判定は比較相手であり、普遍的正解や人間の実評価ではない。

再集計は以下。API呼出しなし。

```sh
python3 tools/jev-shadow.py summary \
  docs/game017/QA/JEV_SHADOW.jsonl \
  docs/game018/QA/JEV_SHADOW.jsonl \
  docs/seven-games-2026-10-06/game003/QA/JEV_SHADOW.jsonl \
  docs/seven-games-2026-10-06/game008/QA/JEV_SHADOW.jsonl \
  docs/seven-games-2026-10-06/game009/QA/JEV_SHADOW.jsonl \
  docs/seven-games-2026-10-06/game018/QA/JEV_SHADOW.jsonl \
  --output docs/jev/QA/HISTORICAL_SUMMARY.json
```

## 2026-10-06：v2整備と契約確認

調査対象：AGENTS、PROJECT_CONTEXT、CURRENT_STATUS、GAME_DEVELOPMENT_RULES、JEV_REVIEW_RULES、data/JEV_PREPARATION、tools/jev-shadow.py、export-jev-data、synthetic-fixture、旧Shadow raw/summary/report、Visual/Feel/QA・runner・Pages workflow。Python helperは開発領域に既存、ブラウザ／WorkerからのOpenRouter呼出しなし。以前の対象game017/018制限とhuman-only質問、`false_pass`がriskだけを示すことを確認した。

更新した既存MarkdownはAGENTS（参照のみ）、PROJECT_CONTEXT/CURRENT_STATUS（短い現行状態）、GAME_DEVELOPMENT_RULES（findingフローへの参照）、JEV_REVIEW_RULES（正本）、JEV_PREPARATION（背景データとの責任分離）。新規Markdownは本書だけ。過去のゲーム仕様・報告・ログは保持。

既存helperをschema v2へ更新し、全gameNNN／shared／portal、1finding、4質問、盲検向けstdout、未知field／ラベル漏洩／秘密値／回答schemaの検査、UNAVAILABLE、重複送信防止、独立annotate、旧新ログの集計を整備。lockを持って追記・annotateするため同一ログの同時操作も直列化する。CIへ追加したのは**通信なしofflineテスト**だけで、API判定や公開Gateは追加していない。

実APIの契約確認は1回のみ：[合成state](QA/SMOKE_FINDING.json)、[raw v2ログ](QA/JEV_HELPER_SMOKE.jsonl)、[summary](QA/JEV_HELPER_SMOKE_SUMMARY.json)。HTTP200、requested `typesafe/jev-1.13`、resolved `typesafe/jev-1.13-20260917`。4回答と全choice probabilities、input1595/output215、native cost USD0.00006699、latency0.418718秒を取得。keyは環境メモリ・固定先のAuthorization headerだけで使用し、値やheaderやraw responseは保存していない。

これは**合成fixtureによるhelper/API契約確認**であり、実ゲームfinding・人間試遊・モデル精度試験ではない。独立CodexやHumanの正解を創作せず、smokeのannotationはnullのまま。見逃し0と表示された集計も比較母数0であり、性能合格を意味しない。このsmokeを今後の実開発評価へ加えない。

最終offlineテスト、TypeScript/build、保護範囲監査、API key漏洩検査の結果は[VALIDATION.json](QA/VALIDATION.json)。ゲーム／Portal／HTML／public素材／Analytics／保存／CREDIT／AdSense／package依存は変更しない。新しいCloud TaskはAGENTSから正本へ到達でき、ゲーム仕様だけの依頼でもfindingがあればShadowフローを適用できる。API利用不能時は通常QAで継続する。

## 次に蓄積する評価

新しいゲームごとに実観測のfindingを保存し、4問のroutingと独立Codexの実際の証拠取得・最終原因を比較する。calls、input/output、native cost、latency、原因／routing一致の母数、CODEX_ACTION FP/FN、0.45未満と実際の問題、CODEX FALSE PASS、RELEASE RISK MISS、Human候補・実施・未実施、UNAVAILABLEをまとめる。欠測はnullと母数で残す。

十分な新規ゲームの実測・極めて少ないFALSE PASS・独立holdoutの妥当性が確認されるまでShadow Modeを続ける。release riskを自動Gateにせず、画像・面白さ・Feelの最終判定をJevへ移さない。
