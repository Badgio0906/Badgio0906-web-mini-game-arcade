# Content value transformation QA

Node.js 24 and the existing npm dependencies are required. Do not overwrite older evidence directories.

```sh
npm run guides:build
npm run guides:check
npm run check
npm test
npm run build
python tests/adsense-content-phase1/serve.py
```

The last command serves compiled `dist/` at `http://127.0.0.1:4922/` and emulates a Pages repository base at `/phase1/`. In another shell:

```sh
QA_OUT=/tmp/value-content-new-run node tests/value-transformation/browser.mjs
```

For a later change confined to the portal introduction, append `--navigation-only` to rerun just the root/subpath navigation and local launch-event checks.

Checks all 29 reading pages at four widths with JavaScript disabled, image loading, heading count, overflow, primary targets, local links/fragments, unpublished routes, and real root/subpath portal→guide→game navigation. A granted consent fixture exists only in isolated navigation contexts so the local event ledger can verify that reading a guide does not record a launch and that direct PLAY still records one. All external requests and non-GET/HEAD requests are blocked.

This is not full gameplay QA, real-device testing, ad/CMP certification or an AdSense approval prediction. Gameplay evidence is bounded and separately recorded in the [audit](../../docs/adsense/value-transformation/GAME_VALUE_AUDIT.md). Game code and stored formats are unchanged.
