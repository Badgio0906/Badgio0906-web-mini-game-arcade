# Game037 QA証跡

- `UNIT_TESTS.txt`：最終ソースでの単体テスト出力（18 PASS）。
- `BUILD.txt`：`tsc --noEmit`と個別Vite buildの出力。`BUILD_HASHES.txt`：build成果物のSHA-256。
- `SOURCE_BLOBS.txt`：検証時のソース・配信素材のgit blob id。
- `browser-final/`：`node tests/game037/browser.mjs`の結果。`RESULTS.json`（574 checks、viewport別、Chromium path、base URL）とスクリーンショット。
  - `<viewport>-title / help / practice-clear / play-rejected / pause / stage1-clear / stage6-clear / result.png`、`desktop-drag-preview.png`（drag中のマス吸着＋緑プレビュー）、`denied-storage-title.png`。
  - viewport：desktop 1280×720（mouse）、phone 390×844（touch, mobile）、narrow 320×568（touch, mobile, reduced-motion）、landscape 844×390（touch＋mouse）。

## 再実行
```sh
npm ci
npx vitest run tests/unit/game037*.test.ts
npx tsc --noEmit
node tests/game037/browser.mjs            # build→preview→QA。Chromium未検出ならUNTESTED（exit 2）
GAME037_REPORT=<dir> node tests/game037/browser.mjs   # 出力先を変える（既存記録を上書きしない）
```
Chromiumは`GAME037_CHROME`、`/opt/pw-browsers/chromium`、`/usr/bin/chromium`、`/usr/bin/chromium-browser`、`/usr/bin/google-chrome`、Playwright既定の順に探す（`tests/game037/chrome.mjs`）。
