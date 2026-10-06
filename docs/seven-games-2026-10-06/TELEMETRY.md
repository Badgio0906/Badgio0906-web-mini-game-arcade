# 改訂02 — local telemetryとJev資料

従来の `TelemetryService` を保持。各ページのlocal保存は最大400件、dataは最大40 primitive fields、有限数値と300文字以下の文字列。IDはページ内session/run用で個人識別ではない。ブラウザから外部APIへ送信しない。frameごとの保存・原文の全会話送信はしない。練習の判定は本番run_start/end/BESTへ混ぜない。

得点ルールが変わる003/006/007/008/009/010はrulesVersion2と新BESTキーを持つ。旧BESTは残す。018は軌道／得点を保持しpresentationRevision2をmanifestへ記録。

|作品|固有の観測・分析項目|
|---|---|
|003|settled着地、全支持面の重心／余裕、芸術ペア／点、中央精度とC国係数。|
|006|指定safe/challenge枠、angle/power、brake距離、rectangle clearance、near-miss／collision、駐車精度。|
|007|乗車／見送り／出発、積載、目的階／到着配達、期限／停車、通常／追加便。|
|008|pace、warning、hazard、5%刻みspill、delivery、optional choice。|
|009|correctのkind/objectId/searchMs、mistakeの−2秒、paper_lift、tidyの−2.5秒。|
|010|record/correction、ask-again、submitと項目一致、議題／追加／大誤記。会話文を外部へ送らず、IDや数値で記録。|
|018|kick.justと入力、rare_drawのpresentation_id/seed/eligible/won/probability、ufo_view_hold.duration_ms1050、shoe_best_crossed。|

ネイティブイベント名・実fieldの正本は各 `main.ts` / `contracts.ts` とmanifest。Game007などは `event_type`、Game018は `event` を使い、無関係な共通SDKへ再整理していない。schemaの既存event envelopeは維持する。

`node tools/export-jev-data.mjs game003 game006 game007 game008 game009 game010 game018` は指定7プロフィールとCatalogを出力。指定なしの従来全件出力も維持する。今回対象外12プロフィールはbyte不変、target-only出力を使用した。資料はゲーム仕様・制御・版・素材・失敗・practice・telemetryの説明用。自動QAのスコアをユーザー集計へ混ぜていない。

開発Shadowは別CLIでPOST Decisionsだけを使用し、ゲーム・CI・得点・正誤・公開判定へ組み込まない。[実Jev結果](JEV_REPORT.md)。
