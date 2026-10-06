# 運営Analytics

`analytics-admin.html`はポータルからリンクしない管理用静的画面。`noindex,nofollow`を付けるが、URL自体を秘密・認証とみなさない。集計APIはCloudflare secret `ANALYTICS_ADMIN_TOKEN`とBearer認証で保護する。Workerの未設定時は管理画面に設定不足を表示し、公開ゲームに影響しない。

管理者が画面で入力したトークンは画面と実行中のメモリだけに保持する。localStorage/sessionStorage、URL、ログ、export、client環境変数に保存しない。「トークン・表示を消去」とページ離脱で消す。入力時は`autocomplete=off`、ただしブラウザや拡張機能が独自に保持する機能はサイト外の境界。取得は`credentials:omit`、`cache:no-store`、`referrerPolicy:no-referrer`、15秒タイムアウト。

期間は今日・7日・30日・任意。暦日は日本時間、開始を含み終了日の翌日0時を含まない。今日を含む期間は現在時刻までに制限する。環境はproduction/synthetic/qa/developmentを別々に選び、混ぜない。退役ゲーム010は初期非表示、チェック時だけ過去集計に含める。010のID・過去コード・過去データを他のゲームへ付け替えない。

表示は全体、ゲーム一覧、ゲーム名を押した詳細。Discovery（表示/クリック/CTR）、Activation（開始→RUN）、Engagement（2/3RUN、中央値、BEST）、Progress（funnel）、Recovery（失敗後再挑戦/大落下後継続）、Cross game、Returnを別々に見る。総合面白さスコアは作らない。割合は`62.5% (25 / 40)`、母数20未満は少数。母数0や未計測は欠測として表示し、0%とみなさない。2RUN率は同じbrowser+visit+gameで1→2（run2/run1）、3RUN率は2→3（run3/run2）の継続。3RUN率を初回からの到達率（run3/run1）と混同しない。大落下後継続は観測できた同一RUNの継続の下限であり、元の高度を取り戻した割合ではない。エラー・失敗理由・離脱・端末・流入・ゲーム/rules/presentation版・欠測情報も表示する。

観測ブラウザ数は同意後に発行したbrowser_idの数で、人数ではない。同意拒否、送信不能、ブロッカー、保存拒否、端末切替、ID再作成、未終了RUN等で欠測し得る。012〜014のshell観測とnative RUN観測の範囲を混同しない。再訪・RUNの分母はWorkerの集計定義を確認し、GA4と数値を合算しない。

「集計JSONを保存」は許可した集計フィールドだけを出力する。個別browser_id/visit_id/session_id/run_idやraw eventは含めず、Jev APIを呼ばない。CLIで同じ投影を行う場合：

```sh
node tools/export-analytics-summary.mjs admin-summary.json aggregate-export.json
```

入力は認証済み管理APIの集計JSONで、端末内raw telemetry JSONは受け付けない。出力には期間、環境、母数、継続、funnel、失敗/離脱、端末/流入、欠測、ゲーム/rules/presentation版を残す。productionとsyntheticを比較・混合しない。Jevによる得点/公開判定やイベントごとのAPI呼び出しは実装しない。

実装・検証済み範囲とCloudflare/GA4の実設定は[MANUAL_SETUP](MANUAL_SETUP.md)および統合QAを参照する。本番データ収集・管理API稼働・人間評価の完了は、コードの存在だけから宣言しない。

作者検証は`tests/unit/analytics-admin.test.ts`5件、`tests/analytics/admin-ui.mjs`の1365/390/320画面。後者はsynthetic管理API fixtureを使い、本番Worker稼働の証拠ではない。独立レビューは[QA/INDEPENDENT_ADMIN_REVIEW](QA/INDEPENDENT_ADMIN_REVIEW.md)に保持。作者検証の初回URL生成不備、独立レビューによる期間上限・320px幅の指摘を修正し、別途再検証した。
