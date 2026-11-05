# Game037 QA証跡

## Rules v2（現行）
- `rules2/`：ソース `f253a5440071b60bab30e2029dd22350f9d9337c` での単体（22 PASS）・tsc・build・build hash・source blob、`rules2/browser/`（2553 checks PASS、50 PNG）。
- viewport：desktop 1280×720・phone 390×844 は30弁当を実プレイで完走。narrow 320×568・landscape 844×390 は4×4の6弁当＋5×5の1弁当を実プレイし、**checkpointのfixture**から8×8の6弁当を実プレイ。
- `GAME037_ONLY=phone,narrow` で対象viewportを絞って再実行できる（デバッグ用。既定は全部）。

## Rules v1（4×4・6面）の記録

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
