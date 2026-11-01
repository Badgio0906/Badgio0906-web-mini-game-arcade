# Game043 引継ぎ
基準6211019、検証ソース63e9956e（ゲームプレイ4c282ca1、原本9e205fd7）。コマンド: npx vitest run tests/unit/game043*.test.ts / npx tsc --noEmit / BATCH_MODE=qa BATCH_OUT=/tmp/dopa-nine-qa node tests/batches/dopa-nine-20261030-a/run-batch.mjs game043 / node tests/game043/browser.mjs / npx vite build --config tests/game043/stress.config.mjs / node tests/game043/performance.mjs / node tests/game043/production.mjs。
成功/未実施はIMPLEMENTATION_REPORT参照。修正: FEVERとCHAINの重なり・回収演出のみ。次の3手: 作者試遊、実機聴感、採用判断。main/remote/本番変更なし。
