# Game046 引継ぎ
基準6211019、検証済みソースfe3e0394。npx vitest run tests/unit/game046*.test.ts / npx tsc --noEmit / node tests/game046/model-route.mjs / node tests/game046/replay.mjs / node tests/game046/ten-seeds.mjs / BATCH_MODE=qa BATCH_OUT=/tmp/dopa-nine-qa node tests/batches/dopa-nine-20261030-a/run-batch.mjs game046 / node tests/game046/browser.mjs / npx vite build --config tests/game046/stress.config.mjs / node tests/game046/performance.mjs / node tests/game046/production.mjs。
成功と未実施は報告書。次の3手: 作者試遊、実機両手/聴感、採用判断。共有設定/本番非変更。
