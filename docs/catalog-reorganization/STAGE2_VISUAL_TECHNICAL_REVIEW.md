# 第2工程 — 独立Visual／技術Gameplayレビュー

2026-10-16 JST。独立Art Director workerによる、実統合画像と固定ソースQAの照合。ゲームコード実装には不参加。Game003の静的素材を制作した担当なので、素材の自己採用と本書の画面統合判定は区別する。Jevの回答からVisual点を生成していない。

実画像は `view_image` で開いた。既存QAの通常キー／pointer操作、readonly状態の前後、実連番を根拠にした技術評価であり、本レビュアーがQA collectorを実行した／連続動画を視聴したという意味ではない。本人の面白さ・実機・聴感・FPS・人間の反応公平性はすべて未実施。

| 対象 | A | B | C | D | E | F | G | H | 合計 | 判定 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| game002 | 13 | 13 | 9 | 9 | 8 | 13 | 8 | 12 | 85 | PASS_TECHNICAL_VISUAL |
| game003 | 13 | 13 | 9 | 9 | 9 | 13 | 8 | 12 | 86 | PASS_TECHNICAL_VISUAL |
| game015 | 14 | 14 | 8 | 9 | 9 | 14 | 未評価 | 13 | 81/90（G除外） | STATIC_VISUAL_REVIEWED_MOTION_QA_PENDING |
| game024 | 12 | 11 | 7 | 9 | 9 | 13 | 7 | 12 | 80 | PASS_TECHNICAL_VISUAL |
| game027 | 12 | 11 | 7 | 9 | 9 | 13 | 7 | 12 | 80 | PASS_TECHNICAL_VISUAL |

A:固有性15、B:物の魅力15、C:背景10、D:UI統合10、E:構図10、F:可読性15、G:動き10、H:完成感15。gateは合計80以上、F/H各12以上。Gは連番と状態前後から確認できた演出・状態伝達だけの技術点で、滑らかさや気持ちよさの代用ではない。015はGが未評価のため100点総合／全体Visual gateを保留。

## game002

基準: a52677d22911f423769cb2b206704b08f2a87b68。

Cream commuting road and rich neighborhood edges stay distinct from player/pedestrians. At bike stage7, SPEED×4.00 and BONUS×9.0, yellow opponent-direction cue and the SPEEDUP toast are visible. Main scoreboard and result remain legible at inspected widths; short landscape is compact but the game objects and exact speed label remain distinguishable.

Actually viewed stage0motion-a/b, stage3, stage7 and four paused cap layouts; compare QA readonly progression through stage7 and natural9343mresult. G is a technical sampled-transition score, not continuous-motion/FPS/sound review.

QA native-input progression and screenshots show bike stages0to7, maximum multiplier display and a natural terminal result with score31921 at9343m. This supports the implementation's observable progression, not human reaction fairness or enjoyment.

主証拠: [REPORT.json](QA/stage2-unique/a526-bike-cap/REPORT.json) / [002-bike-stage0-motion-a.png](QA/stage2-unique/a526-bike-cap/002-bike-stage0-motion-a.png) / [002-bike-stage0-motion-b.png](QA/stage2-unique/a526-bike-cap/002-bike-stage0-motion-b.png) / [002-bike-stage7.png](QA/stage2-unique/a526-bike-cap/002-bike-stage7.png) / [002-bike-cap-390.png](QA/stage2-unique/a526-bike-cap/002-bike-cap-390.png) / [002-bike-cap-320.png](QA/stage2-unique/a526-bike-cap/002-bike-cap-320.png) / [002-bike-cap-844.png](QA/stage2-unique/a526-bike-cap/002-bike-cap-844.png) / [002-bike-cap-normal-result.png](QA/stage2-unique/a526-bike-cap/002-bike-cap-normal-result.png)。

## game003

基準: a52677d22911f423769cb2b206704b08f2a87b68。

The final cream city is continuous across the whole view, facade patterns clip to distinct real silhouettes, and the mass/cargo label and DROP controls separate cleanly. Landscape now reserves a roughly420x504playfield with controls at right. The old split-sky seam, duplicate centre hints and150x180landscape field were actually observed and all three rechecked resolved.

Actually viewed844physics-motion-a/b showing a90degree rotation and subsequent downward translation, with real stack1capture and QA normalDROPresult. G reflects sampled pose/feedback continuity; no frame pacing or human balance skill claim.

The viewed fresh main starts without phantom stacked demo objects. QA evidence plus actual stack1capture shows the first real rotated building lands before the next irregular cargo is offered. Practice explains move/rotate/drop; earned score and physics stability remain separate model/QA evidence.

主証拠: [REPORT.json](QA/stage2-unique/a526-002-003-four-widths/REPORT.json) / [003-1440-playing.png](QA/stage2-unique/a526-002-003-four-widths/003-1440-playing.png) / [003-390-playing.png](QA/stage2-unique/a526-002-003-four-widths/003-390-playing.png) / [003-320-playing.png](QA/stage2-unique/a526-002-003-four-widths/003-320-playing.png) / [003-844-playing.png](QA/stage2-unique/a526-002-003-four-widths/003-844-playing.png) / [003-844-physics-motion-a.png](QA/stage2-unique/a526-002-003-four-widths/003-844-physics-motion-a.png) / [003-844-physics-motion-b.png](QA/stage2-unique/a526-002-003-four-widths/003-844-physics-motion-b.png) / [003-1440-stack1-canvas-thumbnail-candidate.png](QA/stage2-unique/a526-002-003-four-widths/003-1440-stack1-canvas-thumbnail-candidate.png)。

## game015

基準: 5bd5f03039d1cf3bd6124342f4084cd801dcd78d; a526 gameplay source unchanged according to fixed QA。

Pixel king, dark shaft, red hazards, pale platforms and the cyan soft-catch surface remain immediately distinct at1440/390/320/844. A red bird with directional cue is visible in actual main captures. Landscape retains a complete shaft and readable44pxcontrols rather than losing the play area.

G is unscored. The runner worker is independently collecting actual bird forecast/traversal and moving-platformcarry/pause evidence. Static images alone do not establish live motion orcarry correctness.

Static practice images explainDROP and safe gaps. Native new-route/bird/carry QA is pending runner follow-up; no full technical Gameplay or integrated Visual gate is claimed here.

主証拠: [015-1440-playing.png](QA/stage2-unique/final-four-widths/015-1440-playing.png) / [015-390-playing.png](QA/stage2-unique/final-four-widths/015-390-playing.png) / [015-320-playing.png](QA/stage2-unique/final-four-widths/015-320-playing.png) / [015-844-playing.png](QA/stage2-unique/final-four-widths/015-844-playing.png) / [015-390-practice.png](QA/stage2-unique/final-four-widths/015-390-practice.png)。

## game024

基準: a52677d22911f423769cb2b206704b08f2a87b68; initial4width5bd5f03 art unchanged。

Quiet cream/green grid remains consistent with the simple snake identity. Head eyes, body, amber food and outlined brown obstacles are distinguishable. The remaining-food-to-change counter, amber change outline and explicit frozen-board message explain the new rule without obscuring the board. Four widths preserve the grid and direction controls.

Actually viewed nativechange0/1/2 showing genuinely different wall layouts and longer snake. Identical change2motion-a/bframes align with the explicit intended temporary freeze; readonly QA confirms later motion resumes. G is sampled state-transition/readability assessment, not subjective animation feel.

Native QA report and images show two actual food-triggered rearrangements with counter resets and a visibly preserved snake. Layout changes and frozen-input boundaries have technical evidence; no human ability or entertainment assessment is inferred from solver-assisted native input.

主証拠: [024-1440-playing.png](QA/stage2-unique/final-four-widths/024-1440-playing.png) / [024-390-playing.png](QA/stage2-unique/final-four-widths/024-390-playing.png) / [024-320-playing.png](QA/stage2-unique/final-four-widths/024-320-playing.png) / [024-844-playing.png](QA/stage2-unique/final-four-widths/024-844-playing.png) / [REPORT.json](QA/stage2-unique/a526-snake-shifts/REPORT.json) / [024-native-change0.png](QA/stage2-unique/a526-snake-shifts/024-native-change0.png) / [024-native-change1.png](QA/stage2-unique/a526-snake-shifts/024-native-change1.png) / [024-native-change2.png](QA/stage2-unique/a526-snake-shifts/024-native-change2.png) / [024-change2-motion-a.png](QA/stage2-unique/a526-snake-shifts/024-change2-motion-a.png) / [024-change2-motion-b.png](QA/stage2-unique/a526-snake-shifts/024-change2-motion-b.png)。

## game027

基準: 4ab395b final844CSS; a526 identical game rules and1440/390/320screens。

Green felt, six pockets, numbered balls and cream controls preserve the quiet sports identity. The large current-turn strip uses clear text plus color for human/CPU/moving/result states. New4ab844images restore a real table and separate HUD from controls. The old8pxboard collapse and subsequent target-text overlap were actually observed, recorded separately, and both rechecked resolved.

Actually viewed nativebreakmotion-a/b and final human-aim/CPUshot frames. Readonly QA provides moving/settled/CPUtransition and natural19shotterminal evidence. G is technical sampled motion/state feedback, not live frame pacing or human feel.

The turn strip and disabled controls align visually with human aiming versus balls moving. Natural terminal screenshots show an actual player2win after19shots and retry evidence. Final CSS-onlyseparation was checked with4stateoverlapArea0measurements and actual images.

主証拠: [027-390-playing.png](QA/stage2-unique/final-four-widths/027-390-playing.png) / [027-320-playing.png](QA/stage2-unique/final-four-widths/027-320-playing.png) / [REPORT.json](QA/stage2-unique/a526-pool-terminal-recovered/REPORT.json) / [027-normal-break-motion-a.png](QA/stage2-unique/a526-pool-terminal-recovered/027-normal-break-motion-a.png) / [027-normal-break-motion-b.png](QA/stage2-unique/a526-pool-terminal-recovered/027-normal-break-motion-b.png) / [027-terminal-1440.png](QA/stage2-unique/a526-pool-terminal-recovered/027-terminal-1440.png) / [027-terminal-320.png](QA/stage2-unique/a526-pool-terminal-recovered/027-terminal-320.png) / [REPORT.json](QA/stage2-unique/4ab-027-844-production/REPORT.json) / [027-final-844-two-player-aim.png](QA/stage2-unique/4ab-027-844-production/027-final-844-two-player-aim.png) / [027-final-844-cpu-shot.png](QA/stage2-unique/4ab-027-844-production/027-final-844-cpu-shot.png)。

## Findingと限定修正の再確認

003の背景水平境界、重心説明の二重描画、短い横画面の極小canvasを実画像で発見し、a526実画像で3件とも解消を再確認した。[003再確認](../game003/revision03/QA/VISUAL_RECHECK.json)。027の横画面で台が8pxへ潰れる問題と、その修正後のHUD／回転操作の重なりは別findingとして記録し、4ab実画像で両方の解消を再確認した。[027再確認](../game027/revision-turn-v2/QA/VISUAL_RECHECK.json)。初期画像・独立judgment・Jev原本は保持した。

015の新規鳥／移動床carryはrunnerの実QAが完了次第、元の未評価を消さず追補する。4作の技術Visual合格を015や全12作品・人間合格へ拡張しない。

## 015 最終追補（元の未評価は上に保持）

runnerの固定a526実QAが到着後、PCのmoving-carry／paused、bird-warning／active、最終phoneのmoving-carry／pausedを実際にviewした。黄色移動床・赤い鳥・王・赤い棘が別の輪郭として読め、通常進行とpauseで位置が変わる実連番を確認した。

[PC実QA01](../game015/revision-04/QA/routes-a526-native-01/REPORT.json)のcase0は183m、鳥7安全通過／6退場、床継承の相対ずれ0.038px。[最終phone実QA03](../game015/revision-04/QA/routes-a526-native-03/REPORT.json)は84.2m、鳥2安全通過／1退場、床移動1.7795pxに王の相対ずれ0.1779px、完全pause／fresh resume。両方source一致、pageerror／POSTなし。途中のphone180m延長目標の98m鳥死亡は元の失敗として保持され、今回の製品不具合や最終合格への書換えに使っていない。

実view:[PC床](../game015/revision-04/QA/routes-a526-native-01/1440-moving-carry.png)／[PC pause](../game015/revision-04/QA/routes-a526-native-01/1440-moving-paused.png)／[鳥予告](../game015/revision-04/QA/routes-a526-native-01/1440-bird-warning-1.png)／[鳥実移動](../game015/revision-04/QA/routes-a526-native-01/1440-bird-active-3.png)／[最終phone床](../game015/revision-04/QA/routes-a526-native-03/390-moving-carry.png)／[最終phone pause](../game015/revision-04/QA/routes-a526-native-03/390-moving-paused.png)。

015のGを技術8/10として追加し、最終89/100、F14/H13で技術Visual合格。これで対象5作の技術Visual gateは合格。動画連続視聴・FPS・聴感・実機・本人の面白さは引き続き未実施で、本人評価はnull。詳細JSONは元の未評価をinitialReviewに保持して追補した。
