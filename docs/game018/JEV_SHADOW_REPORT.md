# Game018 — Jev Shadow実測

OpenRouter `POST https://openrouter.ai/api/alpha/decisions`、requested `typesafe/jev-1.13`、resolved `typesafe/jev-1.13-20260917`。既存Cloud Environmentのキーをmemory内headerにだけ使用し、値を表示・保存しない。runtime／CIには接続せず、1checkpoint1call、再試行0。原因は単一choice、他3質問は独立noul。stateに事後診断・修正済み・正解を含めず、Codex判断は別JSONに用意してAPI入力から分離した。

## 実測と各判定

**8 calls、総input 8510、総output 1142、総cost USD0.00035742、平均latency 0.370秒**。全8件HTTP200。原本：[JEV_SHADOW.jsonl](QA/JEV_SHADOW.jsonl)、[集計JSON](QA/JEV_SUMMARY.json)。

確率列はPRODUCT／TEST_INFRA／CONTENT_SPEC／VISUAL_FEEL／UNKNOWN順。C=CODEX_ACTION_REQUIRED、H=HUMAN_ONLY_JUDGMENT_REQUIRED、R=RELEASE_RISK_IF_UNRESOLVED。GT booleanはC/H/R順、1=true。costはAPIが返したUSD、latencyはrequestから応答検証までの実測。

| ID | Jev原因choice | 5選択肢probability P/T/C/V/U | C noul | H noul | R noul | input | output | cost USD | latency秒 | Codex GT原因 / C/H/R |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| A | UNKNOWN | 0.01/0.01/0.00/0.00/0.98 | 0.40 | 0.49 | 0.65 | 932 | 141 | 0.00003914 | 0.401 | UNKNOWN / 1/0/0 |
| B | PRODUCT_BUG | 0.78/0.15/0.04/0.00/0.03 | 0.72 | 0.15 | 0.61 | 1013 | 143 | 0.00004255 | 0.263 | PRODUCT_BUG / 1/0/0 |
| B2 | TEST_INFRA_BUG | 0.28/0.64/0.07/0.00/0.01 | 0.68 | 0.16 | 0.50 | 947 | 145 | 0.00003977 | 0.399 | TEST_INFRA_BUG / 1/0/0 |
| C | PRODUCT_BUG | 0.57/0.00/0.06/0.37/0.00 | 0.74 | 0.56 | 0.79 | 1088 | 143 | 0.00004570 | 0.255 | VISUAL_OR_FEEL_ISSUE / 1/0/0 |
| B3 | TEST_INFRA_BUG | 0.11/0.89/0.00/0.00/0.00 | 0.59 | 0.11 | 0.45 | 979 | 145 | 0.00004112 | 0.423 | TEST_INFRA_BUG / 1/0/0 |
| C2 | PRODUCT_BUG | 0.42/0.05/0.13/0.39/0.01 | 0.62 | 0.46 | 0.74 | 1143 | 143 | 0.00004801 | 0.358 | VISUAL_OR_FEEL_ISSUE / 1/0/1 |
| D | UNKNOWN | 0.03/0.01/0.00/0.02/0.94 | 0.27 | 0.68 | 0.25 | 1157 | 141 | 0.00004859 | 0.388 | UNKNOWN / 0/1/0 |
| E | UNKNOWN | 0.00/0.00/0.00/0.22/0.78 | 0.23 | 0.81 | 0.28 | 1251 | 141 | 0.00005254 | 0.475 | UNKNOWN / 0/1/0 |

A=初回units/build、B=exactdeadline roundoff、B2=親data-shoeも数えたcollector、C=selection/title/layout画像、B3=touch navigationの待機、C2=sky caption/実物視認、D=最終native再検証、E=production／統合検証。state・GTはそれぞれQA/{ID}_STATE.json／{ID}_CODEX_JUDGMENT.json。

## 比較とFALSE PASS

原因choice一致 **6/8（75%）**、C一致 **7/8**、H一致 **7/8**、R一致 **4/8**、全4問一致 **3/8**。候補C閾値0.45、H/R0.5、閾値最適化なし。

| 独立判定 | false positive | false negative |
|---|---:|---:|
| CODEX_ACTION_REQUIRED | 0 | 1 |
| HUMAN_ONLY_JUDGMENT_REQUIRED | 1 | 0 |
| RELEASE_RISK_IF_UNRESOLVED | 4 | 0 |

**C<0.45は3件（A、D、E）**。全てCodexレビューを実施し、その後問題が見つかった候補は**1件（A）**。A時点で具体的問題は未観測でも追加browser/sourceレビューが必要だった。実際に続くCのlayoutとC2の天空表示問題を発見した。もしAだけでCodexを省略していたら見逃しになりうる。D/Eの通常レビューでは新問題0。

**最重要のRELEASE FALSE PASSは0件**。これはR<0.5かつCodex GTで重大release risk=trueを満たす件数。GT risk positiveはC2の1件だけで、Jev R=.74により検出した。C2の原因choiceはPRODUCT(.42)とVISUAL(.39)を取り違え、単一choiceでも原因境界の誤りは残る。Risk FPとCodex省略候補の見逃しをこの0件で隠さない。

Aは未確認gateとplayer harmを分けGT risk=false、Bは微小clockboundary、B2はcollector、Cはpage/menu scrollで操作へ到達でき大きなplayer harm未確認、B3は正常なtouchnavigationの待機問題。未検証や軽微findingを一律のrelease risk positiveにしていない。C2は核心のtracked shoe／sky eventが読めないactual-image問題で、修正前GT risk=trueを保持した。

## 限界と次の用途

これは開発中8checkpointのShadow比較で、過去10–20件の代表的ベンチマークやモデル全般の精度ではない。人間の実評価は未取得、human_final_judgmentはnull。人間の楽しさ・指・音・FPSをコードやprobabilityから合格にしない。Codex料金／tokensは取得不可で節約率は計算しない。Jevはreview省略、コード変更、Visual／Feel合格、公開許可／停止を単独で決めない。公開URL通信制限は別の工程として[Gate](QA/RELEASE_GATE.json)と[引き継ぎ](PUBLICATION_HANDOFF.md)に残す。
