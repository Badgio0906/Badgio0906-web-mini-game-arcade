# Analytics Worker

Independent Cloudflare Worker + D1 backend for consented GAME100 GARAGE analytics. Production deployment is **inactive** until an operator completes [manual setup](../docs/analytics/MANUAL_SETUP.md). The game application remains on GitHub Pages.

```sh
npm --prefix analytics-worker ci
npm --prefix analytics-worker run check
npm --prefix analytics-worker test
npx vitest run tests/unit/analyticsWorker.test.ts
```

The local test uses the explicitly local configuration `tests/wrangler.local.jsonc`, an isolated local D1 state, synthetic events and a fixture-only token. It starts a Worker on port 8797 and stops its process group on exit. The production `wrangler.jsonc` contains a database-ID placeholder; it must be replaced before remote migration/deployment. Actual admin credentials belong in a Wrangler secret, never client configuration.

- `POST /v1/events`: schema v2 `{schema_version:2,events:[...]}`, max 64 KiB / 50 events. Shared strict envelope and primitive-field allowlist: `src/data/analyticsEnvelope.ts` in the main application. Unknown fields/events/games, invalid dates, nested/free-text identity data and nonproduction events on the production Worker are rejected.
- `GET /v1/health`: verifies the D1 events migration is present.
- `GET /v1/admin/summary` and `GET /v1/admin/game/game019`: Bearer-authenticated aggregated results. Optional `from`, `to` (exclusive), `environment`, `include_retired=1`, `game_version`, `rules_version`, `presentation_version`. No raw browser, visit, session, run or event IDs are returned.

Origins are limited to `https://game100garage.com` and its `www` origin; local origins are allowed only in development. Optional Cloudflare rate-limiter binding uses a transient IP hash as an infrastructure key; no IP or full User-Agent is stored in D1. Origin checks and UUID deduplication do not establish that public-write telemetry is truthful. These records never award CREDIT, prizes or scores.

Raw-event retention defaults to 90 days, identifier-free UTC daily aggregates to 13 calendar months. Cron archives days and deletes expired rows in one D1 batch. Daily distinct browser/visit counts cannot be summed into period distinct counts. Complete UTC daily totals on partial edge days are labelled separately from exact raw-period metrics. A report is capped at 20,000 raw events; larger requests must narrow their date range. Production load and Cloudflare plan CPU limits have not been validated.

Continuation rates are 1→2 RUN and 2→3 RUN within the same observed browser + visit + game; browser-wide rates are separate. Site mean/median RUN totals group actual visits. Return cohorts require their full follow-up inside the requested period. Frog large falls mean lost progress ≥10m, and the recovery rate measures observed continuation in the same RUN, not recovery of the former height. Missing events and censored runs do not establish boredom or quitting.

Evidence: [actual local D1 checks](QA/LOCAL_D1.json), [initial failed collectors](QA/INITIAL_ATTEMPTS.json), [independent review](../docs/analytics/QA/INDEPENDENT_WORKER_REVIEW.md).
