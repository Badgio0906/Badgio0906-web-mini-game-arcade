# 実装報告

12種類の固有問題を2～3段階で解く。事務用品のSVG26種を維持。

固有モデル・入力・画面・練習・保存・manifest・HTMLを更新。基準HEAD `4b32be51d8673906347cf69a3175d79ff5ed1c3c`。他担当の共通・既存作業を保持し、担当でcommitしていない。

検証: `npm run check` 合格、`npx vitest run tests/unit/game009.test.ts tests/unit/game017.test.ts tests/unit/game017-relay.test.ts` 3ファイル38件合格（2026-10-15 UTC）。

tests/unit/game009.test.ts（7件）: 全12開始offset×12問題の解存在・隠れた正解の選択防止・依存順／重複入力・ヒント非バイパス・誤答罰・無制限練習と0点・timeout一度・defensive copy・44pxモデル境界。

統合build・固定版の通常ブラウザ操作・独立Visual／Feel・公開URL照合はMainの統合候補で実施する。単体成功を本人の面白さ評価／物理スマホ／実機聴感／公開成功としない。

[仕様](IMPLEMENTATION_SPEC.md) / [Art](ART_DIRECTION.md) / [引継ぎ](HANDOFF.md)

## 共通イベントの限定追補

独立要件レビューで第60章の標準イベント不足が見つかり、修正前にC findingをJevへ記録した（実HTTP200、回答は実装判断／独立評価へ流用していない）。完了本番にscore、更新時のみbest_update、結果からの再実行にretry、途中終了にquitとrun_endを一度だけ送る。pause/resumeも本番だけに限定し、練習はこれらへ混ぜない。pagehide／一覧退出も途中終了を拾う。保存版とゲームルールに変更なし。checkと固有15単体PASS、通常browserでのevent件数は固定候補で確認する。

## 独立通常ブラウザQA

固定a323／DEV4176、1440×900・390×844・320×720・844×390の4caseを独立runner_fall担当が通常入力で完了。009/017合計8case644check PASS、source hash一致、pageerror0/POST0。説明／実練習／本番／通常結果／retry／旧新BEST／pause／mute／quit／帰還を確認。本番は各幅4問、12問全体は単体と区別。
[独立報告](../../catalog-reorganization/STAGE3_009_017_INDEPENDENT_REVIEW.md)／[実report](../../catalog-reorganization/QA/stage3-009-017-a323-native-01/REPORT.json)。本人の面白さ／物理実機／聴感は未実施。


## 一括改修の最終統合・公開状態（2026-10-16 JST追補）

今回のcanonical runtimeは `57dce24977e4d3c7dfd42e99315c67fa07bb0243`。12作品×4画面のcompiled48組とPortal27作品のroot/subpath150項目を確認した。固有の通常RUNと後追い限定差分は [source chain](../../catalog-reorganization/QA/FINAL_SOURCE_CHAIN.json) に分離し、過去の失敗原本を保持する。最新の公式workflow・公開commit・配信SHA・実公開操作は [公開記録](../../catalog-reorganization/PUBLICATION.md)、ゲーム別結果と本人/実機/聴感の未実施範囲は [最終報告](../../catalog-reorganization/FINAL_REPORT.md) を正本とする。以前の「準備中」は各記録時点の履歴。

最終集約候補aa9716cでcheck・1090tests/102files・公開設定build成功。最終第4工程release `9f655a98df410a7dcc3660321afa6ea195e10115` の公式Pages [38767797394](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/38767797394) はbuild/deploy成功。工程別公開日と固有RUNのsourceは上記正本へ分離してある。
