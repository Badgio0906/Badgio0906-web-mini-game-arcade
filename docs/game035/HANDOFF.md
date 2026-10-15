# HANDOFF

2026-10-16 JST最終追補：本作は第4工程release `9f655a98df410a7dcc3660321afa6ea195e10115`／Pages38767797394で公式公開済み。最終check・1090tests/102files・公開設定build、公開12作品×4幅48組、一覧4幅122項目、配信177file SHA一致を確認。固有通常RUNのsourceと差分、公開URL、未実施の本人/物理端末/実機聴感は [一括最終報告](../catalog-reorganization/FINAL_REPORT.md)／[公開記録](../catalog-reorganization/PUBLICATION.md)／[引継ぎ正本](../catalog-reorganization/HANDOFF.md)を優先する。以前の公開準備記述は各時点の履歴。

`src/games/game035/`、`game035.html`、`tests/unit/game035-model.test.ts`が固有実装。records/Catalog/Analytics/Vite登録はroot統合所有。rules1、score15000上限、完了3エンドのみBEST。固定専用buildは`npx vite build --config tests/game035/vite.config.mjs`、一時server4955の存在を次回前提にしない。`node tests/game035/browser.mjs`は本番buildへ通常dragを送り、4viewport/練習/飛行中保存/結果/リトライを確認する。QA/SOURCE_FIXED.jsonのhashと実行時sourceを照合する。

ImageGen氷面はArt Director作成素材。asset indexとQA実画像を保存。未実施の独立Visual/Gameplay/本番確認/本人/実機/聴感を完了扱いしない。広告/CREDIT/GA4同意/既存作品sourceを変更しない。
