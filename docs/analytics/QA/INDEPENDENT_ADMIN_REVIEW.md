# Independent Analytics admin / export review

2026-10-06（日本時間）。実装担当とは別に、アップロードされた今回の依頼の16–17、22、39–41節、AGENTS、PROJECT_CONTEXT、CURRENT_STATUSと実ソースを照合した。対象は管理画面・集計export・管理APIとの接続契約。本番Cloudflare配備、実データ収集、人間のゲーム評価はこの判定の対象外。

**最終判定：管理UIとexportの確認範囲はPASS。レビュー中に見つかった3件を修正後、再確認した。** Worker/D1全体の独立判定、公開ビルドと本番設定は別工程。

## 発見と修正確認

| 初回の問題 | 影響 | 修正後の確認 |
| --- | --- | --- |
| 今日・7日・30日の終了境界が翌日0時JSTで、Workerが現在時刻+5分以降を拒否 | 通常の管理画面取得が400になる | 今日を含む範囲は取得時刻までに切り詰める。過去の終了日は翌日0時を排他的境界として維持。実Worker handlerで3プリセット200 |
| exportがcoverageのduration_unit、raw_window_from、cohort_limits、history_limitsを落としていた | 集計JSONだけを読む際、単位・観測可能範囲・再訪分母の制約が伝わらない | 許可フィールドとして保持。未知の識別子フィールドは引き続き除外 |
| 320pxの画面で文書幅348pxとなった | 管理操作・詳細表が画面外へはみ出す | フォームボタンと詳細表の折返しを修正。1365・390・320pxで文書の横方向overflowなし |

初回の失敗を最終PASSへ読み替えていない。上記は修正前の事実であり、最終判定は修正後の実行に基づく。

## 独立して実行した確認

実装担当のfixture harnessとは別に、独立したassertionと合成APIレスポンスを使ってChromiumで1365×900、390×844、320×640を操作した。実ユーザーデータは使用していない。

- 初期表示でAPI要求なし、productionが既定、退役作品は既定非表示。
- 62.5% (25 / 40)、母数20未満の「少数」、分母0の「欠測」、ゲーム詳細のfunnelと版・欠測を確認。
- 管理認証はAuthorizationヘッダー。通常のcross-origin要求に正しいOriginがあり、トークンをURLへ入れず、RefererとCookieを送らない。
- 入力した合成トークンがlocalStorage、sessionStorage、URL、downloadした集計JSONにない。
- browser_id、visit/session/run系の未知フィールドを、ルート・集計・版・funnel・日次履歴へ入れた合成入力からexport時に除外。許可しないsplitのキーも除外。生イベントはexportに含まない。
- ラベルにHTML文字列を入れてもtextContentとして表示され、imgやスクリプトを生成しない。
- 401時は認証エラーを表示し、旧集計を非表示、exportを無効化する。
- 取得中に「トークン・表示を消去」を押してからレスポンスが届いても、結果・トークンが復活しない。
- 3画面すべてdocumentの横overflowなし、pageerror 0。スマホ表の内部横スクロールは意図したもの。

独立のNode HTTP adapterに実際のWorker source handlerを載せ、ブラウザからcross-originで接続した。DBだけは空のfakeDBであり、D1を使用した検証ではない。実ブラウザのpreflight/CORS、今日・7日・30日の取得、退役表示切替、誤トークン401、許可外Origin403を確認。Playwrightのroute.fulfillだけでは実CORSと期間拒否の検証にならないため、この接続確認を別に実施した。

日本時間の日付切替前後、うるう日、過去の終了日排他境界、HTTPS endpoint、資格情報付きURL拒否、分母0と真の0%の区別も独立に確認した。CLIを合成集計JSONで実行し、集計export成功を確認。対象単体テスト6件PASS。CLIはJev APIを呼ばない。

## ソース固定

再確認時のSHA-256。`admin-reviewed-source.sha256`の全7ファイル検証もPASS。

| ファイル | SHA-256 |
| --- | --- |
| analytics-admin.html | ad62a2d9326c074a49f58b5ef44e062a467a0fa4ec4f95fbb5d3e971d0162fb3 |
| src/analytics-admin/export.ts | 67702fe13c379e6d51c69a6ff71ab8292832ba63dbf21e66479db296d3526380 |
| src/analytics-admin/main.ts | 8ebfaa544397fa2e8ec940bafbecdac8d5a8a96cd7e414656130b51d5359799d |
| src/analytics-admin/model.ts | 5454a6a015c7cf6a5c770c50bc405883b90a53c207ae5bfb531cd82704d8f808 |
| src/analytics-admin/style.css | 002ddef27a0f71ac1b6e93723037dfe57ab679b75ae5b830084249cc2338adcf |
| tools/export-analytics-summary.mjs | 391b485eff455d966cf2f1fdc246db8a30019c46248d4ced9575e8204ad92bda |

## 判定の限界

上記は合成データ、ローカルUI、実Worker handler＋fakeDBの証拠。本番TLS・Cloudflare secret・D1・保持期限処理・GA4・公開bundleの疎通成功を意味しない。管理画面URLの非掲載やnoindexは認証の代わりではなく、APIのBearer認証が境界となる。

追加のWorker契約更新を独立に再確認した。raw_period_completeはfalse/true/nullを区別してexportし、保持期限を越える指定期間では「残るイベント分だけ」「指定期間全体の0件を意味しない」という注意を表示する。日別履歴はgranularity=UTC-calendar-day、partial_edge_days=true/false/nullを保持し、期間端の全UTC日集計が指定期間外の時間を含む場合の注意を表示する。更新後の独立ブラウザ1365/390/320pxで2つの注意、downloadでfalse/true/UTC粒度の保持、横overflowなしを確認した。2RUN率（1→2）・3RUN率（2→3）のラベルも確認済み。日次集計を日本時間の指定範囲だけの正確な合計へ読み替えない。率の母数、版が複数ある期間、欠測・打切りRUNは集計の説明と併読する。自動操作の成功を人間の読みやすさ・実機親指操作・ゲームの面白さの合格に換算していない。

実装担当の持続する合成QAは[admin-ui.json](admin-ui.json)、画面例は[PC](admin-1365.png)／[phone](admin-390.png)。これらは実装担当の証拠であり、本報告の独立実行と同一とは扱わない。独立実行の詳細な判定範囲と結果は本報告に保存した。運営設定の残作業は[MANUAL_SETUP](../MANUAL_SETUP.md)を参照。
