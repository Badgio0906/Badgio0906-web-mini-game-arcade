# Game038 HANDOFF

status: in_progress / local initial playable。branch`feature/game038-rain-umbrella`、baseはGame037/003採用準備cab8bef（main未反映）。仕様→画面→asset→ImageGen2実call→最小実装の順で実施。[仕様](IMPLEMENTATION_SPEC.md)、[生成prompt](IMAGEGEN_PROMPTS.md)、[素材index](../../assets/game038/ASSET_INDEX.json)。036/037とは別ID、038は正式Catalog/Vite入力へ登録しない。

`npm ci`、`npm run check`、`npx vitest run tests/unit/game038.test.ts`14件、限定Vite build成功。初回unitの1失敗は負得点検査が「2番目の案内人=tough」と仮定したfixture誤り。実定義は4番目で、その状態まで通常model進行して同じ−120と一回性を確認した。原log保存。背景bytesは変更しない。

実ブラウザ/独立最終レビューはこれから固定sourceで実施する。人間・物理端末・実音/FPSは未実施。遊びの面白さや正式完成を認定しない。帰還は未登録prototypeのため公式一覧URLへ、限定build内の存在しないindexへ飛ばさない。既存ゲームやAnalytics/Cloudflare/D1/広告/CREDIT/Secretを触らない。

PUBLICを確認したがWebhook403と外部push連動/費用条件UNKNOWNでpush保留。PR作成原稿を残し、push・新規PR・Actions起動/再実行/キャンセル・公開/main mergeは行わない。生成素材はこのGit branchに保存し、ImageGenの会話や一時serverを再開前提にしない。

再現：Node24/npm11、`npm ci`→`npm run check`→`npx vitest run tests/unit/game038.test.ts`→`npx vite build --config tests/game038/vite.config.mjs`。開発previewは`npx vite --config tests/game038/vite.config.mjs --port 4938 --strictPort`、`http://127.0.0.1:4938/game038.html`。main登録/ネット公開はしない。snapshot診断はDEV readonlyだけでproductionには含めない。
