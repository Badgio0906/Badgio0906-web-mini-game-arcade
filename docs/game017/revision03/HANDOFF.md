# HANDOFF — 表示014／内部Game017 改良候補

status: revision candidate / QA中。作業branch`revision/game017-umbrella-r3`、訂正前の基準`2a6e36a`。新作038ではなく、既存雨ゲームの3ライン傘移動版。[仕様](IMPLEMENTATION_SPEC.md)と[訂正](CORRECTION.md)を優先し、docs/game038は履歴として読む。Game003/037は変更しない。

正式route/Catalog/公開boardは旧017rules2のまま。試遊は`game017-revision03.html`。新保存は`web-mini-arcade:v1:game017:umbrella-r3:{best,mute,learned}`。旧best/bestRelayV2と誤って作った038のsaveは読取/保全のみで、移行・上書き・削除しない。候補scoreを既存オンラインboardへ送らない。

```sh
npm ci
npm run check
npx vitest run tests/unit/game017-umbrella*.test.ts
npx vite build --config tests/game017/revision03/vite.config.mjs
npx vite --config tests/game017/revision03/vite.config.mjs --host 127.0.0.1 --port 4938 --strictPort
```

ブラウザで `http://127.0.0.1:4938/game017-revision03.html`。画面の014/RAINSHIFT改良候補を確認する。旧版は引き続き`game017.html`。改良候補は旧版の公開差し替えではない。

ImageGen実2回の既存成果を移設、今回の追加生成0。原本/配信asset/SHAは`assets/game017/revision03/ASSET_INDEX.json`。既存017背景bytesは変更しない。以前のfull90秒/77checks/Visual81は移設前の履歴。移設後の結果は[報告](IMPLEMENTATION_REPORT.md)とQAへ追記する。

main/本番公開、PR、Actions手動起動・再実行・取消、workflow/runner/billing設定を操作しない。前回のpush指示で送信済みだった候補の訂正として、既存雨ゲーム作業branchへ反映する場合も対象repo/branch・起動処理を再確認する。Webhook403/外部費用UNKNOWNを無料と断言しない。物理端末/人間/実音/FPS/Safari/正式採用は未実施。
