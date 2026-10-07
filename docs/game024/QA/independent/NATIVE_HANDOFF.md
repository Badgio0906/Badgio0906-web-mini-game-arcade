# Game024 native review preparation

Browser has **not** been opened. Root must hand over the single browser slot before execution. Source remains revision01 SHA `df1f7a241a966ea3bf1de8bb13379e408232b5f9e99dd2c882284987379e994d`; collector checks all frozen hashes before and after. Build is isolated at `/tmp/game024-native-build`, physical Game024 and Portal HTML included, consent denied and new-ID remote collection disabled. [Preparation](NATIVE_PREPARATION.json) stores actual built-file hashes; [build output](native-build.txt).

After browser handoff, serve the isolated build, then execute from `/workspace/arcade-classic-five`:

```sh
python3 -m http.server 4424 --bind 127.0.0.1 --directory /tmp/game024-native-build
GAME024_REPORT=docs/game024/QA/independent/native-revision01 node docs/game024/QA/independent/native-review.mjs
```

Use a new `GAME024_REPORT` directory for every subsequent run to preserve the first failures. `GAME024_PROFILES=desktop` (or phone, small, landscape) permits a single bounded profile. The default covers1365×900,390×844 touch,320×740 touch and844×390 touch. `CHROMIUM_PATH` and `GAME024_BASE` can explicitly select the current environment, without assuming the server persists across tasks.

Collector scope: real native launch/explanation, reverse rejection and two queued turns over distinct cells; food/growth via ordinary input following visible positions (readonly local save inspection, no state injection); pause/focus loss and explicit resume; saved same RUN and mute; retry and actual wall result; result reload retains BEST/runs and report flag; real practice reaches food with no production stats; native CDP touchcancel fixture; Portal→pagehide→fresh route keeps stats without resurrecting snake; native6/8 choices remain fixed; numeric44px control bounds and horizontal containment. Errors and analytic request attempts are counted. Production debug hook absence is checked. No API calls or PASS-only Jev requests.

Actual screenshots are still pending. `*-ordinary-start.png` and `*-ordinary-food.png` come from ordinary main RUNs with no injected board; use a reviewed one as the real gameplay thumbnail source. Practice and any input fixture remain separately labeled. Full-page screenshots include scrollable phone and landscape content. Visual/Feel judgment must inspect images and behavior after execution; no rating has been assigned from source or CSS. A failure preserves screenshot/layout/report; freeze it before any Shadow request or fix. Do not automatically retry a failed request or source mutation.

Root integration delivery: copy `game024.html`, `src/games/game024/`, `tests/unit/game024.test.ts` and `docs/game024/` from `/workspace/classic-author-024`. Current authoritative freeze is `docs/game024/QA/AUTHOR_MODEL_BUILD_REVISION01.json`, preserving its original predecessor. Only authorized product revision was save.ts terminal capture; tests include26 checks. Root independent evidence/annotations in this directory should remain as separate records; do not replace them with the author's raw unannotated log. Root owns catalog/build/profile/thumbnail registration, official publication and Sheet update afterGame023 publication. Shared Telemetry/runtime overlay and author dependency link are excluded from delivery. No source commit has been made.
