# Game045 実装報告
基準main6211019。12面/24発/60秒、盤420²・7×7。鏡の4/8全組合せ、唯一解、部分撃破維持、同対象1回加点、発射ロック、最終弾クリア優先を5単体テストで確認。tsc/個別QA/production build成功。
通常入力: QA/browser-1793368336970（全4幅で12面一撃、PCは残弾切れも）。初回失敗はpreview checkboxへfocusを残したtest操作、Shift+Tabで通常ゲーム入力へ戻して修正。製品のinput欄ガードは保持。
ImageGen6点を原本/配信WebP/プロンプト/hashで保存。WebAudioの発射sweep/実反射数の金属音/全滅低音/決定音、16voice cap、音量/ミュート保存、停止cleanup。
性能専用fixture: QA/perf-1793368492614、3鏡/4標的/最長roomのbeam/particle描画＋active model更新30秒、headless p95 0.5ms。fixtureは攻略・面白さの証拠ではない。普通のプレイ成功とは分離。
Visualレビューで320 headerの休憩が改行する問題を発見。短いheader名とnowrapで修正、正式titleは維持。最終ソース99c13243、ゲームロジックは9138fa5c。
production検証はQA/production-*。診断不在、通常発射、全44px、blur/pause、設定、5retry、root/subpath/reload/帰還。既存保存・広告・解析・本番は変更しない。
起動: node tests/batches/dopa-nine-20261030-a/run-batch.mjs game045 → node tests/batches/dopa-nine-20261030-a/preview.mjs。/games/mirror_disco/。
