# Records browser QA — reproduction and limits

Final client source is frozen in `CLIENT_SOURCE_FREEZE_04.json`; build receipts and JS/CSS/font SHA256 values are in `browser-build-04/BUILD_PROVENANCE.json`. All paths below are repository relative. Use a fresh output directory for every run; retain failed runs.

The test HTML/module live only under `tests/records/`. The normal Vite build does **not** include this entry. The special build explicitly adds it and sets a dummy endpoint; every HTTP request is intercepted. Nothing posts to a production Worker. `navigator.webdriver=false` is explicitly a synthetic transport fixture to exercise the production branch, not a claim of human play.

```sh
VITE_RECORDS_ENDPOINT='' npm run build -- --outDir /tmp/records-default-fixture
VITE_RECORDS_ENDPOINT=https://records-fixture.test RECORDS_HARNESS_DIST=/tmp/records-enabled-fixture node tests/records/build-harness.mjs
RECORDS_QA_OUT=docs/records/QA/browser-sharing-new node tests/records/sharing-browser.mjs
RECORDS_QA_OUT=docs/records/QA/browser-portal-new node tests/records/portal-browser.mjs
RECORDS_QA_OUT=docs/records/QA/browser-enabled-portal-new node tests/records/enabled-portal-browser.mjs
RECORDS_QA_OUT=docs/records/QA/browser-native-new node tests/records/native-game-browser.mjs
```

Use `RECORDS_SITE_DIST` / `RECORDS_HARNESS_DIST` to override build directories. Chromium is `/usr/bin/chromium` with SwiftShader for Game031. `RECORDS_QA_ONLY` selects comma-separated sharing fixture names. `RECORDS_NATIVE_SKIP` selects `game001:desktop` style cases to skip; skipped cases are not claimed by that run.

Final evidence:

- `browser-sharing-08`: 49 checks. `browser-sharing-manual-09`: actual ConsentService storage key set to `denied`, 13 checks including one additional assertion. The earlier standalone harness used an unrelated fake key; this follow-up corrects that fixture. Analytics runtime is absent from the standalone harness, while native games use the actual denied consent key.
- `browser-portal-04`: 82 checks, 1300/390/320/844 widths, all 30 thumbnails decoded through normal scrolling, all 30 immediate two-row card records, HTML labels, long value/0/missing/legacy/Godot, only metadata reads for Game031. A synthetic 1 MB world remains unread. Real cross-tab `storage`, same-document event and actual browser back are exercised. Real back reported trusted `pageshow` with `persisted=false`; `persisted=true` handler coverage is a synthetic event, **not** a proved real bfcache restoration.
- `browser-enabled-portal-02`: 26 checks. Real enabled built Portal with anonymous mock GET, 0/long values and visible fetch dates. Virtual clock at 61 seconds updates revision/value. Hidden/visible checks use explicit synthetic visibility overrides, not an OS/device background test.
- Native cases: PC001/004/018 passed in `browser-native-02`; the following 019/024/029/031 desktop and all seven phone cases passed in `browser-native-03`. Total 14 cases / 84 assertions, seven selected games. Game018 completed two runs per device with retry and Space/Enter on PC. Game019 charged, jumped, paused/milestone/resumed and preserved raw BEST decimeters. Game024 ate food with ordinary direction controls and passive saved-board route planning, preserved active save, completed slow and speed-6 results. Game029 cast, paused/reloaded/resumed/finished/retried. Game031 used light textures, mined through ordinary inputs, saved and verified Portal metadata then resumed. No model/world injection; this is not actual play coverage of all seventeen scored games.

All native and default Portal cases have zero record/Analytics POST and zero page JS errors. Representative final images were opened and inspected after lazy image decode. They confirm readable labels/units/status, connected thumbnails, and optional share controls without blocked retry/resume. This does not claim human enjoyment or physical iPhone/Android quality.

Failures remain intact. Three product findings were independently inspected without reading Jev answers: unreadable cross-origin `Retry-After`, stale cross-tab withdrawal status from a detached receipt object, and native `fetch` Illegal invocation. Root owns Shadow invocation and annotations. Other failures were fixture reseeding, clicking through the existing first-visit consent panel, unchecking an already-unchecked checkbox, Game001's existing 420 ms result reveal, and the existing difference between nearest display height and floored saved BEST in Game019. Their original reports, images and independent explanations remain available.

No commit, push, deploy, source/game change, or real production record/API call was performed by this QA subtask. Root owns integration and publication verification.

## 公開版の確認

`tests/records/verify-public.mjs <expectedSHA> <successfulPagesRun> <uniqueOutput>` は公式expected-SHA workflow成功とclean source相当build、公開bytesを照合する。許可されたログ取得が可能な場合だけCI asset名も照合する（NODE_USE_ENV_PROXY=1が必要な環境あり）。

`RECORDS_QA_OUT=<uniqueOutput> RECORDS_EXPECTED_COMMIT=<expectedSHA> node tests/records/public-browser.mjs` は実公開の4画面、30カード/画像、元BESTの通常結果とPortal反映を確認する。送信は停止し本番テスト投稿は行わない。物理スマホと人間の面白さは未確認。
