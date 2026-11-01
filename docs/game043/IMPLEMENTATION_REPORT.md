# Game043 実装報告
ソース63e9956e。7単体/固定tick replayテスト、型検査、個別build成功。固定入力列を30/60/120Hzの描画枠で消化し91グレイズ・7FEVER・HP3、全結果一致。実ブラウザ描画を人工的に30/120Hzへ制限した試験とは別。
通常入力QA/browser-1793373044240：PCキーで81graze/6FEVER/HP2/33500、390pxタッチで68graze/5FEVER/HP3/31475、両方60秒クリア。320/844は練習クリア・タッチ・HUD・pause/再開/帰還。全4幅でpageerror/404/外部通信0。音声解禁・16voice cap・pause時0を確認。
ImageGen6素材、SEは完全オリジナル合成。透明PNG原本、640px配信WebP、実プロンプト/hashを保存。最大120弾の性能専用fixture QA/perf-1793373216802：30秒update+draw headless p95 0.5ms。通常本番の最大同時弾29、p95 0.6ms。実スマホ性能・聴感・楽しさNOT_RUN。production4幅/診断不在/設定/5restart/root/subpath/reloadはQA/production-*。
開始: node tests/batches/dopa-nine-20261030-a/run-batch.mjs game043 → node tests/batches/dopa-nine-20261030-a/preview.mjs。/games/graze_party/。主観の完成版認定・公開なし。
