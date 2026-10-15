# 実装報告

旧見下ろし描線方式から横視点の雨宿りへ。旧RainRun/描画/単体23件は比較用として保存。

固有モデル・入力・画面・練習・保存・manifest・HTMLを更新。基準HEAD `4b32be51d8673906347cf69a3175d79ff5ed1c3c`。他担当の共通・既存作業を保持し、担当でcommitしていない。

検証: `npm run check` 合格、`npx vitest run tests/unit/game009.test.ts tests/unit/game017.test.ts tests/unit/game017-relay.test.ts` 3ファイル38件合格（2026-10-15 UTC）。

tests/unit/game017-relay.test.ts（8件）: 予告と風向き、100seedの屋根間距離、dash制限、異常dt、休憩回復と放置0点、100濡れ終局一度、通常待機／移動／dash方策で3seed全11屋根完走、練習分離、defensive copy。旧 tests/unit/game017.test.ts（23件）も合格。

統合build・固定版の通常ブラウザ操作・独立Visual／Feel・公開URL照合はMainの統合候補で実施する。単体成功を本人の面白さ評価／物理スマホ／実機聴感／公開成功としない。

[仕様](IMPLEMENTATION_SPEC.md) / [Art](ART_DIRECTION.md) / [引継ぎ](HANDOFF.md)

## 共通イベントの限定追補

独立要件レビューで第60章の標準イベント不足が見つかり、修正前にC findingをJevへ記録した（実HTTP200、回答は実装判断／独立評価へ流用していない）。完了本番にscore、更新時のみbest_update、結果からの再実行にretry、途中終了にquitとrun_endを一度だけ送る。pause/resumeも本番だけに限定し、練習はこれらへ混ぜない。pagehide／一覧退出も途中終了を拾う。保存版とゲームルールに変更なし。checkと固有15単体PASS、通常browserでのevent件数は固定候補で確認する。

## 独立通常ブラウザQA

固定a323／DEV4176、1440×900・390×844・320×720・844×390の4caseを独立runner_fall担当が通常入力で完了。009/017合計8case644check PASS、source hash一致、pageerror0/POST0。説明／実練習／本番／通常結果／retry／旧新BEST／pause／mute／quit／帰還を確認。各幅で通常左右/dashにより全11屋根到達。
[独立報告](../../catalog-reorganization/STAGE3_009_017_INDEPENDENT_REVIEW.md)／[実report](../../catalog-reorganization/QA/stage3-009-017-a323-native-01/REPORT.json)。本人の面白さ／物理実機／聴感は未実施。
