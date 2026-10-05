# Game017 Jev Shadow report

開発側のPOST https://openrouter.ai/api/alpha/decisionsのみ。requested typesafe/jev-1.13、resolved typesafe/jev-1.13-20260917。各checkpoint1回、retryなし。キーは環境内で使用し表示・保存なし。ブラウザ・CI・公開判断への接続なし。

| Checkpoint | Primary choice / probabilities | Codex noul | Human-only noul | Risk noul | input | output | USD cost | latency s | 4問一致 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| A | PRODUCT_BUG / TEST_INFRA_BUG=0.17, PRODUCT_BUG=0.49, UNKNOWN=0.33, CONTENT_OR_SPEC_ISSUE=0.01, VISUAL_OR_FEEL_ISSUE=0 | 0.84 | 0.19 | 0.25 | 944 | 143 | 0.000039648 | 0.575 | True |
| B | PRODUCT_BUG / TEST_INFRA_BUG=0.28, CONTENT_OR_SPEC_ISSUE=0.01, PRODUCT_BUG=0.58, UNKNOWN=0.12, VISUAL_OR_FEEL_ISSUE=0.01 | 0.78 | 0.22 | 0.77 | 1249 | 143 | 0.000052458 | 0.362 | True |
| C | VISUAL_OR_FEEL_ISSUE / CONTENT_OR_SPEC_ISSUE=0, UNKNOWN=0, VISUAL_OR_FEEL_ISSUE=0.95, TEST_INFRA_BUG=0, PRODUCT_BUG=0.05 | 0.67 | 0.73 | 0.69 | 1105 | 148 | 0.000046410 | 0.461 | False |
| B2 | TEST_INFRA_BUG / PRODUCT_BUG=0.07, UNKNOWN=0, TEST_INFRA_BUG=0.93, VISUAL_OR_FEEL_ISSUE=0, CONTENT_OR_SPEC_ISSUE=0 | 0.78 | 0.17 | 0.62 | 1392 | 145 | 0.000058464 | 0.388 | False |
| B3 | PRODUCT_BUG / TEST_INFRA_BUG=0.1, VISUAL_OR_FEEL_ISSUE=0, CONTENT_OR_SPEC_ISSUE=0.01, UNKNOWN=0.03, PRODUCT_BUG=0.86 | 0.78 | 0.2 | 0.75 | 1480 | 143 | 0.000062160 | 0.341 | False |
| B4 | TEST_INFRA_BUG / UNKNOWN=0.01, PRODUCT_BUG=0.16, TEST_INFRA_BUG=0.76, CONTENT_OR_SPEC_ISSUE=0.06, VISUAL_OR_FEEL_ISSUE=0.01 | 0.78 | 0.29 | 0.67 | 1058 | 145 | 0.000044436 | 0.623 | False |
| B5 | PRODUCT_BUG / TEST_INFRA_BUG=0.03, CONTENT_OR_SPEC_ISSUE=0, VISUAL_OR_FEEL_ISSUE=0, UNKNOWN=0, PRODUCT_BUG=0.97 | 0.79 | 0.12 | 0.42 | 948 | 143 | 0.000039816 | 0.608 | True |
| D | UNKNOWN / VISUAL_OR_FEEL_ISSUE=0, UNKNOWN=0.97, PRODUCT_BUG=0.03, CONTENT_OR_SPEC_ISSUE=0, TEST_INFRA_BUG=0 | 0.26 | 0.57 | 0.21 | 1339 | 141 | 0.000056238 | 0.416 | True |
| E | VISUAL_OR_FEEL_ISSUE / CONTENT_OR_SPEC_ISSUE=0.01, UNKNOWN=0.45, TEST_INFRA_BUG=0.01, VISUAL_OR_FEEL_ISSUE=0.49, PRODUCT_BUG=0.04 | 0.37 | 0.74 | 0.32 | 1160 | 148 | 0.000048720 | 0.609 | False |

合計 9 calls、input 10675 / output 1299 tokens、USD 0.000448350、平均 0.487s。

一致数（各9件）：{'PRIMARY_CAUSE': 6, 'CODEX_ACTION_REQUIRED': 9, 'HUMAN_ONLY_JUDGMENT_REQUIRED': 8, 'RELEASE_RISK_IF_UNRESOLVED': 6}。全4問一致 4/9。CODEX_ACTION_REQUIREDは0.45、human/riskは0.5を比較閾値に使用。閾値最適化なし。

Codex候補閾値0.45未満：['D', 'E']。通常の独立レビューを省略せず、この2件で新たなコード問題は0件。FALSE PASS（Jev risk<0.5、独立Codex risk=true）は0件。

B3は単一touchMove後のclick欠落を独立した素のChromiumページでも再現し、テスト環境の現象と判断した。JevはPRODUCT_BUGと分類。B2/B3/B4ではriskを過大に出し、Cでは客観的レイアウト修正をhuman-onlyとした。Eは未実施の人間体験確認からVISUAL_OR_FEEL_ISSUEを選んだが、独立Codexは観測済み欠陥なしとしてUNKNOWN。

Aの最初のCodex risk=trueはビルドgateと利用者への危険を混同していた。独立QAによる定義再評価でfalseとし、旧判断は履歴に保存。最終集計は再評価を使用する。修正前観測、モデル値、履歴を消去していない。

小規模な開発checkpoint比較であり、独立した10〜20歴史事例の精度ベンチマークではない。複数観測を含むB4は単一原因分類の限界もある。JevからVisual点・人間合格・公開可否を生成しない。

詳細state・全choice確率・独立判断・UTC時刻：[JEV_SHADOW.jsonl](QA/JEV_SHADOW.jsonl)、集計：[JEV_SUMMARY.json](QA/JEV_SUMMARY.json)。
