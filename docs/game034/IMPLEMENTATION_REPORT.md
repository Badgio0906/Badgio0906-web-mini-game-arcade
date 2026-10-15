# Game034 初版実装報告

2026-10-15 JST、基準main f28ce3d21d53e85b413974f99a6ae1b8abb706e1、未commit/root統合中。

[仕様](IMPLEMENTATION_SPEC.md)の8玩具建築、最大3か所選択、実部品除去、Matter崩壊、黄色範囲/低下/小屋接触/少数箇所採点、8現場合計結果、独立練習、BEST/mute保存、音、pause、説明を実装。背景と3材atlasはArt担当のImageGen配信物を参照する。

Art担当の背景/3材atlasを画像ファイルとして実view済。中央空間・木/terracotta/teal材を確認。ゲーム画面での配置評価は後段。

実施した検証:
- `npx vitest run tests/unit/game034.test.ts --reporter=verbose`：8/8成功。8面×13部品選択=104回の8秒実simulation、決定性、選択差による異なる崩れ方、回転、各面に40%超の実低下解、実際の小屋contact有/無、finite/bounded、得点境界、3選択上限、deselect/reset/frame上限を確認。
- 初回・追加確認ログをそれぞれ[unit-initial](QA/unit-initial.log)、[protection-probe](QA/protection-probe.log)へ保持。
- `npx tsc --noEmit --pretty false`：034の型問題を修正。最終時点で残る全体errorは並行root `src/records/currentRules.ts` のgame015 narrowingで、034診断なし。さらにbaseline-probeで全8面の初期状態が35px以内の組立姿勢を保ち、小屋への初期contactゼロを確認。[当時ログ](QA/typecheck-final.log)。全体build/testはroot統合後。

通常ブラウザQAを後段で完了（下記追補）。独立Artの採用/Visual判定・thumbnailは素材担当の最新記録を参照。公式公開はroot担当。本人/物理スマホ/音聴感・面白さは未確認。

実装中のmodelテストfailureはなし。純粋な型名修正をJev findingの回数消化へ使っていない。後段のfindingはJEV_REVIEW_RULESへ。

Independent review found the final headquarters had no clean solution among all legal selections. Kept the original enumeration and sent one Jev Shadow finding B. A 36-variant/900-simulation content probe showed a minimal 25px tank shift (445→420) keeps the dense mass and distinct offsets while yielding a real clean three-support solution. Target/hut/global thresholds remain unchanged. Final 8/8 unit tests now include one clean physical solution at every authored site. Independent desk worker re-enumerated all25 legal final-site selections and confirmed exactly one clean route, allthree feet, containment1/demolished1/protected true/1498. Evidence: `../catalog-reorganization/QA/independent-034/SITE8-RETEST.json` (repository path `docs/catalog-reorganization/QA/independent-034/SITE8-RETEST.json`). Original failing enumeration is preserved. Normal browser confirmation remains pending.

## 固定production通常QA 43deb6c

`GAME034_BASE_URL=http://127.0.0.1:4174 GAME034_REPORT_DIR=docs/game034/QA/stage4-43deb-four-widths-clean GAME034_SOURCE_DIR=/workspace/arcade-stage4 GAME034_SOURCE_COMMIT=43deb6c node tests/game034/browser.mjs`を実行。

1440×900 /390×844 /320×568 /844×390の4画面で、説明→独立練習実崩壊→本番全8現場（計32現場）→最終BEST10034→リトライ0→title/reloadでBEST/mute保持→ゲーム一覧への実帰還を通常click/tap/DOM操作のみで完了。3か所上限と解除、slow切替、pause凍結/明示resume、44px主要操作、横overflowも確認。全4profileでpageerror0、同origin HTTP error0、非GET書込み試行0。全browser/contextを終了し、source4file hashは前後一致。`QA/stage4-43deb-four-widths-clean/report.json`。

最初の実行は初回Analytics consent選択をcollectorが省き、desktop全8現場を完了したが実画像にpanelが重なった。画像/ログ/INTERRUPTEDを旧`QA/stage4-43deb-four-widths/`へ保全し、thumbnail採用を撤回。Jev C実記録後、独立Art判断TEST_INFRA_BUGを注釈。collectorだけへ通常「許可しない」clickを追加して別dirで4画面を再実行した。runtime/consent仕様に変更なし。

実画像は各profile `playing-canvas.png` / `playing.png` / `complete.png`、desktopには250ms追加の実崩壊motion-bも保存。Art担当へclean原本を渡した。root後段のfont/records/event-only統合・公式公開は別candidate証拠へ分離する。
