# Game044 引継ぎ
基準6211019、検証済みソースb7e7957397da35bcc175dffcfd69826fe75b3a91。
コマンド: npx vitest run tests/unit/game044*.test.ts / npx tsc --noEmit / BATCH_MODE=qa BATCH_OUT=/tmp/dopa-nine-qa node tests/batches/dopa-nine-20261030-a/run-batch.mjs game044 / node tests/game044/browser.mjs / node tests/game044/production.mjs。
成功: model7、4幅60個クリア、入力・波・爆弾・pause・保存、ImageGen10点。失敗: 残存重大問題なし。未実施: 人間/実機/聴感/独立JEV。新規game044固有pathのみ。次の3手: 作者試遊、実機聴感、許可後の採用判断。公開なし。
