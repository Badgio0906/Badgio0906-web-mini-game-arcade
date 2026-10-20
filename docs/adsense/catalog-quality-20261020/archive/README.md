# 削除作品の非実行アーカイブ

基準commit: `47c6cfe1ea93f71325fc47ff7031980ef9be9f74`。次の9ファイルは同commitの原文を変更せず保存した。実行対象のテストから履歴資料へ移したものであり、今回の976テストへ数えない。

| 保存名 | 旧パス |
|---|---|
|game026.manifest.json|src/games/game026/game.manifest.json|
|game028.manifest.json|src/games/game028/game.manifest.json|
|game029.manifest.json|src/games/game029/game.manifest.json|
|game030.manifest.json|src/games/game030/game.manifest.json|
|game026.test.ts.txt|tests/unit/game026.test.ts|
|game028-model.test.ts.txt|tests/unit/game028-model.test.ts|
|game028-save-input.test.ts.txt|tests/unit/game028-save-input.test.ts|
|game029.test.ts.txt|tests/unit/game029.test.ts|
|game030.test.ts.txt|tests/unit/game030.test.ts|

旧HTML・ソース・専用WebPはGit履歴で復元可能。既存のdocs/game026・028・029・030、Jev profile、サムネイル採用台帳、元画像・QA証拠は保持した。`tests/game026`等の旧ブラウザ収集器も過去の証拠として保持するが、現行ブランチで動作する検証とは扱わない。再実行には旧commitの隔離checkoutが必要。

026/028/029/030のIDは永久廃止・再利用禁止。履歴照会・外部API互換性のため`historicalGameCatalog`、gameVersions、recordDefinitions、旧保存reader、Worker登録は保持する。この資料や過去のサムネイル参照は現在の配信許可ではない。
