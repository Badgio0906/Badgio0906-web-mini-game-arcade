# Game029 再開／統合メモ

2026-10-08日本時間。作者worktreeは `/workspace/batch-two-author-029`、基準commitは `7c3d089d69da1ff076c63acb7c3ba96449728a1d`。Root以外は共有登録・Sheet・commit・push・deployを行わない。

固有HTML／model／描画／保存／入力は [SOURCE_FREEZE_06](QA/SOURCE_FREEZE_06.json) のhashで固定。27対象unit、check、isolated build成功はQAのREV05ログ。root所有のTelemetryServiceは依存用mirrorで、作者の共有変更としてcopy/stageしない。旧失敗／compile／source／Jev C/Fは保持する。

現在の通常4画面collectorは `tests/game029/native.mjs`、freezeは [COLLECTOR_FREEZE_NATIVE_09](QA/COLLECTOR_FREEZE_NATIVE_09.json)。`npm ci`相当依存、Chromium、static4929を新環境で確認し、Rootの唯一ブラウザ枠許可後に `GAME029_FREEZE=docs/game029/QA/SOURCE_FREEZE_06.json node tests/game029/native.mjs`。`GAME029_BASE` と `GAME029_REPORT` でURL／未使用出力先を指定できる。source05の一致を開始時にassertし、exact source／compileをbeforeへ保存する。未知failureが出たらその場で停止し、同じ設定で無断リトライしない。

Phone pause診断は [二条件原本](QA/pause-original-params/2026-10-07T19-17-57.003Z/OBSERVATION_SUMMARY.json)。同じ最初のPause80ms／省略CDPパラメータの2contextで、即時dragはclick未発生、50+50ms追加dragはclick発生・停止。独立判断によりcollectorだけを現実的なdrag待機へ限定変更し、ゲームinputは不変。Chromium内部機構と物理端末は未検証。既存F UNKNOWN annotationを後日上書きしない。必要な後日判断はRoot側の独立追加記録に残る。

source04の通常4画面RUN操作は [19:33UTC原本](QA/e32070781326/2026-10-07T19-33-02.637Z/manifest.json) で成功したが、独立Visualでlandscape水域clipが見つかり別Dを実施して限定layout修正。source06の要求4画面通常RUN／field境界assertはQA/NATIVE_FINAL_SUMMARY.jsonで成功。独立Visual／Gameplay、補足UI実操作、Root統合／公開／候補表更新はまだ完了していない。作者本人・実スマートフォン試遊は未実施。[報告](IMPLEMENTATION_REPORT.md)と[人間試遊](HUMAN_PLAYTEST.md)を区別する。

最新最終操作証拠は [native09/source06](QA/b86bddf46f9c/2026-10-07T20-13-00.460Z/manifest.json)。320×740を含む4画面、説明／heldEnter／途中paused resize／phone paused cancelまで成功。旧source05の3.5px dock超過とbefore原本を保持し、root独立既存D同原因判断後のown portraitCSSのみ修正。browserは閉じて独立レビューへslotを返した。source06とbuild06のhashを確認してcopyし、root所有sharedSDK mirrorはcopy/stageしない。

Root integration 2026-10-07T20:18:52.731816+00:00:27target/root695tests65files/check/build andWorkeractualD135events11RUN PASS. Finalsource06 identical, ordinarynative four requiredviewports surface→result/retry/save/practice PASS; independentactualPC/phone result/end+ascendingnativecancel/pausedresize/heldEnter andVisual81 F12 H12. Source05smallphone3.5px dock reservation followup preserved, ownCSS-onlyrepair andnewfreeze06; sameknownD viewportbudget no duplicateAPI. PublicCI/version/ordinarynative andSheetA42 pending. New own namespace, oldgames/save unchanged; Ads/CREDIT/auth/D1schema unmodified; productionworkerblockednewremoteOFF; subjective/physicalunperformed.
