# Author implementation report

2026-10-07 UTC. Candidate No.25 / game022 / ひと息ソリティア ～KLONDIKE～. Author source is ready for independent review, not yet a publication claim. Base `af2edf70cdf8fe46175f4fcf38fec607dda997d0`, isolated branch `codex/classic-model-022`.

Implemented the separated seeded Klondike model, seven-column DOM interface, original plant-back SVG, all four suit symbols with red/black faces, draw-one/draw-three, exact recycle, legal suffix moves and foundation returns, flip/undo, daily/random modes, visible-only hints, user-triggered single-card assist, proven all-visible finish, optional six-card practice, pause/mute, nonmodal accessible menus and resumable atomic snapshots/clear records.

The model and persistence suite has **19 passing tests**, including 300 seeded legal action/undo checkpoints with full identity/snapshot checks, initial 7/21/24 structure, suffix rules, foundation return, exact draw/recycle order, hidden-information hint invariance, corrupt save rejection, clear deduplication and the complete original 52-card fixture. TypeScript passes. The isolated production entry builds to 25 modules, 71.54 kB JS / 25.83 kB gzip and 6.60 kB CSS / 2.29 kB gzip at the source freeze. It contains no Phaser dependency.

Executed:

```sh
npm test -- --run tests/unit/game022*.test.ts
npm run check
npm run build
node --input-type=module -e 'import {build} from "vite";await build({configFile:false,base:"./",build:{outDir:"/tmp/game022-author-build",rollupOptions:{input:"game022.html"}}})'
```

The baseline root build succeeds with existing CSS warnings and a Phaser chunk warning, but its old input regex omits game022. Therefore that build is only a repository/typecheck baseline; the isolated Vite command verifies the new entry. Parent must register it in the official build and catalog before publication. Source freeze and file hashes are recorded in `QA/AUTHOR_EVIDENCE.json`.

The first model execution had one incorrect test fixture (13/14 success). [Original observation](QA/MODEL_FIRST_RUN.txt), [finding](QA/SUFFIX_FIXTURE_FINDING.json) and one schema-v2 four-question request are preserved. The source model rejected the invalid ranks correctly. The fixture was replaced with a correctly alternating suffix; the target suite then passed. The Jev result was received with its answers hidden. Author draft analysis is labelled author work, not independent review; parent blind review must supply the final annotation. No all-PASS quota requests.

`tests/game022/complete-fixture.mjs` supplies a reusable native-input four-viewport fixture collector, but this author has **not executed it**. It reads DEV visible-move diagnostics to choose buttons and never writes model state. Parent owns fixed-source browser/Feel/Visual review, release integration, live HTTPS verification, thumbnails and Sheets update. No catalog, Worker, other games, shared source, commit, push or deployment was authored here. The two modified shared files in the author worktree were copied by the parent for getActiveRunId/restoreRun and remote-collection support.

Pending: independent browser input/consent/save/retry checks, actual screenshots and Visual/Feel judgment, integrated root regression/build, public deploy/asset verification, candidate A26 update after publication, and production Worker registration. Remote collection is explicitly disabled pending that registration. Author subjective play, physical iPhone/touch behaviour, sound comfort and long-session performance remain untested. No claim of guaranteed random/daily solvability or legal clearance is made.

## 統合・修正追補（2026-10-07 UTC）

公式Catalog／route／tag／save／既存AnalyticsのIDと匿名項目へ最小登録。旧ゲームの保存・仕様は変更していない。最新統合root check／全457テスト／build、WorkerローカルD1の14イベント・4RUN検証は成功。本番Workerは既存認証がこの環境で利用できず停止し、新作の外部送信はPortalを含め停止。既存020本番登録は維持。

独立確認で、タイトルから説明を開くと保存済み本番配りを上書きする問題を修正（本番ロード済みの時だけ保存）。44pxの露出札間隔へ変更。タッチの暗黙pointer capture移管がドラッグを中止する問題を、カードが新しいcaptureを保持中の旧target喪失だけ無視する形で修正。OFF時の共通TouchGuardによるCSS競合を当ゲーム内の高優先度selectorで修正し、ON時だけカード操作を占有する。共通TouchGuardと既存ゲームは不変。各before状態・独立判断・Shadow実応答と初回失敗をQAに保持。

通常配りは解ける保証なし。DEV専用の独自52枚fixture全消去4画面の検証と、production compiled通常盤面の実操作を区別する。本番ではfixture queryを無視しdebug APIを含まない。物理端末のネイティブpan・音・長時間操作と本人の面白さは未確認。CDPのpanが通常の隙間でも動かなかったため、実機panの合格証拠として扱わない。

最終compiled実画像・Feel／Visualと公開・候補表確認はそれぞれGAME_FEEL_REVIEW.md／VISUAL_REVIEW.md／QA/PUBLICATION.json／QA/SHEET_UPDATE.jsonを参照（公開確認が完了するまで公開済みとしない）。
