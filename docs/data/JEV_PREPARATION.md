# Jev向けの中間データ

2026-10-06更新：active18、Game010はretiredとして元profileを`jev_export/retired_game_profiles/game010.json`へ保持。ID010は再利用せず次は020。外部計測は**準備済み・production inactive**。現在Cloudflare/D1/GA4の本番設定はなく、公開ブラウザから外部解析へ送信しない。local400件の確認履歴と、同意後に新しく発生する外部envelopeを区別する。

集客後は[分析基盤](../analytics/ARCHITECTURE.md)の集計APIまたは`tools/export-analytics-summary.mjs`で、期間・母数・欠測・版・環境を含むJSONを出す。個別browser/visit/session/run/event ID、raw event、トークンは含めない。Jevのリアルタイム呼び出しはなく、得点・成功・抽選・公開可否へ接続しない。Worker本番deployと実送信確認を行った場合にのみproduction activeへ更新する。

以下はdevice-local資料と既存プロフィール出力の説明。外部解析の有効・無効は上記とanalytics報告を優先する。


現在の正本は[`gameCatalog.ts`](../../src/data/gameCatalog.ts)、[`tagCatalog.ts`](../../src/data/tagCatalog.ts)、[`telemetrySchema.ts`](../../src/data/telemetrySchema.ts)。active18本のJSONは[`jev_export/game_profiles`](../../jev_export/game_profiles/)、改修3本と共通仕様の短いプロファイルも同じ場所に置く。

`node tools/export-jev-data.mjs`でcatalog、active18本のプロフィール、event schemaを再生成する。manifestからジャンル/想定時間を読み、操作/メカニクス/失敗/ビジュアルの説明を対応づける。想定時間は設計仮説。無い場合はnull。人間の平均プレイ時間を創作しない。新規manifestを更新したら再生成する。

TelemetryServiceは各ページ内200件の従来historyを維持し、`web-mini-game-arcade:telemetry:v1`に最近400件をdevice-local保存。保存が壊れる/拒否される場合はmemoryに継続。既存BEST・CREDITのキーやゲーム結果は変更しない。session_idはページ単位のランダムな値で個人や端末を識別しない。外部送信、Jev接続、認証キーは無い。

ポータルの「この端末のプレイ記録」→「プレイ記録を保存」で、versioned envelope、catalog、保持events、集計をJSONに出せる。ゲーム別開始数、session数、終了runの平均時間、離脱フェーズ、死因、保持window内の最初の死亡地点、タグ別/設計難度帯別の開始数を含む。タグは重なる。ringから消えた履歴、未報告の死亡地点、Godot本体のrun数は推測しない。「最初の死亡」は全人生/全利用者の初回ではなく、保持windowのsession内初回。詰まりは死因/地点/フェーズの集中を分析する材料で、データだけで面白さを断定しない。

イベントはname/ISO日時/dataのprimitive schemaで検証。未知name、非finite number、nested object、壊れた日時を除外。dataは40field以内、key80文字/文字列300文字以内。session/game_idはサービスが付与する。ゲーム固有イベントは`specific_game_events`の`event`fieldに明示する。best_update/death_reasonは明示送出し、自動推測しない。既存native作品でfields/イベント網羅は異なる。012〜014はshell-onlyなので本体の得点/失敗は未計測。

`telemetry_samples/synthetic.json`とその集計は**合成fixture**。`analytics_summary/observed_status.json`は実ユーザー集計を取得していない状態を記録する。QA成功、想定プレイ時間、合成fixtureを実ユーザー観測に変換しない。後からJevへ渡す際はこのscope/欠測/合成区別を含める。
