# JEV_REVIEW_RULES — Shadow評価と判定モデル

この文書はJevの利用範囲を管理する。現在の実行状態は [CURRENT_STATUS](CURRENT_STATUS.md)、既知3ケースと6質問は [SHADOW_CASES.json](jev/SHADOW_CASES.json)。ゲームの実装・修正・QAは [GAME_DEVELOPMENT_RULES](GAME_DEVELOPMENT_RULES.md) に従う。

## 現段階

ユーザーはOpenRouter経由Jev1.13の疎通成功を報告している。ただし、このRepositoryに検証済みDecisions API request／responseや成功したShadow結果はない。直近タスクでの3ケースAPI呼出は0回、確率・usage・cost・latencyは未取得。ゲーム、CI、共通サービスにJevは接続されていない。

次に行うのは既知3ケースのShadow評価。モデル結果を既存コード・ゲーム・設定ファイルへ反映しない。機械判定だけで修正・merge・deploy・人間合格へ進めない。自動運用への移行は別の明示的な依頼と評価を必要とする。

## API呼び出しの再開条件

1. 当該タスクの安全な環境設定で認証情報が利用できることを確認する。過去タスクのenvや疎通成功を現在の認証準備済みとみなさない。
2. 疎通確認に使ったキーを除くURL・正確なモデルID／version・JSON形式・native `noul` response・usage／costの単位を確認する。
3. モデルがJev1.13を指すことを確認する。公開カタログに存在する`typesafe/jev-router`やlatest aliasを、Jev1.13 Decisions APIの代用にしない。
4. 接続情報がなければ入力準備まで進め、呼出未実施と不足情報を記録する。未確認のendpoint／schema／料金換算を作らない。

キーは表示・保存・チャット貼付・Git追跡しない。既存の安全なenv／credential bindingを使い、HTTP header、環境dump、verbose trace、request全体をログへ出さない。失敗responseもcredentialを含まない情報だけ記録する。評価データ・ログ・報告は`docs/jev/`等に置けるが、Authorizationは含めない。ゲームのブラウザ配信bundleにキーを入れない。

## 1ケース・1呼出・6質問

各ケースを1回のDecisions API呼出でまとめて判定する。6問を6回呼ばない。現在の依頼はA／B／Cの計3呼出であり、途中失敗時に自動retryして呼出数を増やさない。完了済みケースを新タスクで無条件に再送せず、台帳を確認する。

| 質問ID | type | 意味 |
|---|---|---|
| PRODUCT_BUG | `noul` | 製品コード側に修正が必要か |
| TEST_INFRA_BUG | `noul` | テストまたはテスト基盤側の問題か |
| SPEC_MISMATCH | `noul` | 実装／内容が仕様と不一致か |
| CODEX_REVIEW_REQUIRED | `noul` | Codexによる追加レビュー／調査が必要か |
| HUMAN_REVIEW_REQUIRED | `noul` | 人間によるFeel／Visual確認が必要か |
| RELEASE_BLOCKING | `noul` | 問題を解決せず公開工程へ進むべきではないか。肯定は「公開を止める」 |

API contractはこのローカルの質問表とは別。`noul`のnative確率全体を保持し、名前の分からない確率を二値YES率へ変換しない。ID対応・全6問・確率の範囲／欠損を確認する。不正・欠損・timeoutは評価不能で、PASSへ補完しない。

## 既知ケースと正解の分離

| Case | 対象と観測 | 既知の主要原因 |
|---|---|---|
| A | 016：遷移後のHTTP200画像body収集でCDPが失敗。ゲーム挙動は正常 | TEST_INFRA_BUG |
| B | 015：練習ターゲットへ着地できず意図した練習が完了しない | PRODUCT_BUG |
| C | 016：間接的に相手の手を特定させる仕様なのに問題文が手を直接伝える | SPEC_MISMATCH |

判定対象は修正前の歴史的な問題。「現在は修正済みだから公開可」という問題へ変えない。モデル入力は観測と関連仕様を使い、`knownPrimaryCauseForScoringOnly`や「原因として確認済み」という答えのラベルを送らない。入力・context範囲を保存し、既知ラベルを読ませた結果を分類性能としない。

最強の「問題分類」は先頭3問の肯定側確率を比較する。残り3問は工程gateであり、問題分類のargmaxに混ぜない。native契約上どれが肯定か未確認なら比較不可。同値は同率として残す。CでPRODUCT_BUGも上がる等の重複を排他的な誤りと即断せず、主要原因との整合と別gateの妥当性を分けて報告する。

CODEX／HUMAN／RELEASEの3問に過去の主要原因から正解を自動生成しない。context・未実施の証拠・公開の定義を踏まえCodexがレビューする。Visual／Feelの人間判断と実機評価をJevで取得したとは書かない。

## 結果・使用量・比較

ケースごとに実際のrequest ID、モデルversion、呼出開始／終了、全6問のnative確率、主要分類、既知原因との整合、`input tokens`、`cost`、latencyと証拠を保存する。latencyは単一API呼出前後のmonotonic壁時計で測り、サーバー報告値があるなら別欄にする。

tokens／costはAPIが直接返した値だけを使い、通貨／単位・field名も記録する。missingは`null`／「取得不可」。input／cachedのprovider定義を確認し二重加算しない。キー残高差分・modelカタログ単価・応答時間から料金を推定しない。エラーresponseのusageが不明なら失敗呼出を無料としない。

3ケース合計input tokens、同一単位の総cost、3呼出の平均latencyを算出する。一部未取得なら全3件の合計／平均は取得不可、確認済み分を別に示す。今回は3既知ケースだけなので新規バグ全般の精度、誤検出率、Codexのクレジット削減率を主張しない。

| 工程 | 今後の置換候補 | 残す責任 |
|---|---|---|
| 定型テスト結果の集約 | Jevへ置換可能。単純なPASS／FAILはscriptも適する | テスト自体は実行する |
| 仕様照合・問題文・差分再レビュー | 部分的に置換可能 | 曖昧な仕様・入力／期限の正しさをCodexが調査 |
| 修正要否・製品／テスト基盤の一次分類 | 部分的に置換可能 | 実イベント・根本原因・修正をCodexが確認 |
| workerによるVisual／Feel判定 | 部分的に置換可能 | 画像対応の確認、実入力、音、実機と人間の面白さ |
| 次工程への移行 | 部分的に置換可能 | 実行証拠・未完了gate・人間評価を保つ |
| コード修正・入力バグ追跡・実ブラウザ再検証 | Codexが必要 | 調査・編集・統合・再検証 |

比較baselineは [保存済み集計](development-baseline/BASELINE_2026-10-05.json)。全開発時間・全修正・Codex使用量は欠損しているため、Jev導入後の改善率をその欠損から計算しない。今後は [WORK_LOG template](templates/WORK_LOG_ENTRY.json) で同じscope、stage、テスト粒度、品質条件を記録する。
