# Game015 — independent Game Feel review

Status: **independent actual Game Feel PASS on REV2; human playtest pending**. Reviewer did not implement this game. This is a preview/readiness assessment of actual controls, feedback, choices and progression, not a human enjoyment result or the separate Art Director visual score.

## Final actual review — 2026-10-04

Candidate: `QA/REVIEW_CANDIDATE_REV2.json`, aggregate `230dfbf61da2165cd400675badd00e27fe94bc5b5d3df15ffa60fe9007a90980`. Exclusive Chromium at DEV5181, PC1440×900 and phone390×844. All reviewer browsers were closed before handing the slot to root/QA/Art Director. Root must separately finish the actual-frame catalog thumbnail integration and final QA/visual gates.

Inputs were ordinary native keyboard, mouse/tap and Chromium touch contacts. The long desktop route used read-only platform/player inspection to plan these inputs. No run state, course, clock, score, best or completion was injected. The oracle observes information faster and more precisely than a person; its success establishes an executable route, not novice fairness or human difficulty. No FPS, physical handset latency, physical sound listening or human fun claim is made.

| Check | Actual observation | Assessment |
| --- | --- | --- |
| First explanation/practice | All four steps completed in8.53s PC /8.66s phone practice-clock: DROP, lateral movement,5.2m SAFE,11.875m ghost SPLAT. Main run remained inactive during practice. | Brief learning sequence is actionable; failure is demonstrated without ending the real run. |
| First10s of main | A broad first3.6m SAFE landing; holding Space through impact did not queue the next DROP. Deliberate neutral DROP sequence reached28.6m after6.28s PC /6.60s phone, with an8.6m HARD landing and NICE count1. | Early forgiving landings lead into an observable route/skip consequence rather than100m of passive DROP-only play. This timed input sequence is not average novice play. |
| Repaired PC header focus | Header pause→same-header resume left focus on `pause-button`; ArrowRight nevertheless set input1 and moved x128→131.90. ArrowLeft after mute click was accepted. | Original P1 fixed with actual native reproduction; Space/Enter native header behavior is preserved. |
| Phone simultaneous controls | Primary Right contact remained input1 after a second, non-primary DROP contact was released. At300ms vx70.88 while Right remained held; release set input0. | Explicit steer+DROP works as intended in emulated native touch. Real thumb comfort remains a human test. |
| Inertia/braking | PC held-right vx40.35; release retained vx38.38 and moved x131.89→135.82; opposite input changed vx to−9.39. Phone separately retained drift and changed vx to−3.80 with opposite input. | Movement has visible inertia and useful braking without a jump action. These sampled values include automation/event delivery time. |
| HARD/SAFE/fatal clarity | Actual8.6m HARD/NICE produced stagger/landing feedback, survived and allowed the next DROP. Normal subsequent landings reset FALL. Natural wall-side skip ended at16.5m impact on PC and16.8m on phone; results state impact distance and cause. | Consequences are explained through the current fall and result, not merely a generic GAME OVER. |
| Camera/next choice | Viewed actual first/main,28m,100/300/500/600/1000m shots. King remains above center; previous support and multiple future landings are visible. Quiet central shaft separates king/supports from side tiles. | Landing selection can be made before departure; live milestone does not cover the next target. |
| Later actual route |239 actual planned landing records:226normal,7crumble,6moving. First recorded crumble494.9m; first moving618.5m. | Executed route extends beyond introductory wide geometry. This route does not prove every starting velocity/pattern phase is forgiving. |
|1000m live continuation |1000.062m at266.494 game-sec, still PLAYING;1010.432m at268.944 game-sec, still PLAYING. Live “1000M! STILL NO BOTTOM” appeared below the action. Long segment wall261.336s. | Genuine milestone/continuation achieved; no modal, reset or stop. Long-run boredom/replay appeal is not established by automation. |
| Failure/result/retry | PC1036.2m→DEPTH1036,5NICE,16.5m fatal/273.0s; phone49.6m→DEPTH49,1NICE,16.8m fatal/10.3s. Result/retry readable in both actual captures. Retry returned to depth0/time0 in47ms PC /62ms phone wall observations. | Immediate retry and clear primary depth work. Timing is an automation observation, not guaranteed physical-device latency. |
| Pause/return | PC physics time7.6099 unchanged across450ms wall pause; phone pause check also passed. Native title/reload/portal return executed. No page errors in either final run. | Lifecycle checks exercised. These journals did not independently assert the stored BEST value after reload; final QA owns persistence assertions. |

The freely visible next support, full-width catches, deliberate short-drop/long-skip tradeoff and optional NICE count make this a distinct spatial descent/control problem. Agent judgment: the preview is coherent enough for human playtesting. The report does not claim players want to replay, enjoy273s runs, or choose an advertisement. Game015 currently displays free unlimited play and has no in-run CREDIT/reward loop to certify.

### Findings and retained history

1. **P1 fixed:** original header-resume focus swallowed the first Arrow. `review-artifacts/INITIAL_HEADER_FOCUS.json` and initial screenshot preserve that real failure. The REV2 actual header/mute retest passed.
2. **Readability improvement actually viewed:** initial busy center tiles were replaced by the quiet160px center/48px side treatment before REV2. Current actual screenshots show clear king/platform separation. Art Director separately owns numeric visual acceptance.
3. **Reviewer harness issue, not runtime failure:** the first phone practice timed out because CDP `touchEnd([right])` released the Right contact, instead of releasing the DROP contact. Actual pointer logs identify the ended pointer. Initial record and `mobile-POINTER_DIAGNOSTIC.json` are retained; corrected `touchEnd([drop])` preserved Right and the entire phone route passed. No runtime input relaxation was needed.
4. **Known integration pending:** portal015 thumbnail was intentionally unavailable during this frozen review. Root will derive it from the actual falling canvas after reviewer closure; this report does not mark that incomplete integration as final QA success.

No outstanding observed Game Feel implementation blocker remains on REV2. Main-run soft-platform landings and their larger survival threshold were not independently exercised; only their distinct pink supports were seen. Do not substitute the safe-route oracle/model tests for that branch. Physical audio quality, reduced-motion preference, other viewport sizes, persistence, general focus/multitouch regressions and production/subpath behavior are final QA/human responsibilities.

### Evidence

- `review-artifacts/desktop-FEEL_RECORD.json`, `mobile-FEEL_RECORD.json`: actual native progression, landing snapshots, pause/retry/diagnostics.
- `review-artifacts/mobile-INITIAL_PRACTICE_TIMEOUT.json`, `mobile-POINTER_DIAGNOSTIC.json`, `mobile-CORRECTED_POINTER_DIAGNOSTIC.json`: failed harness plus actual native event attribution/correction.
- `review-artifacts/{desktop,mobile}-{fresh-main,actual-fall,earned-hard-nice,natural-fatal-result}.png`: actual integrated screenshots, independently viewed.
- `review-artifacts/desktop-earned-depth-{100,300,500,600,1000}.png`: genuinely earned deeper gameplay;1000 screenshot independently viewed.
- `QA/game015-actual-fall.png` and `.json`: unmodified browser canvas export256×448 after normal DROP, model time0.5602, depth/FALL1.78584m, phase FALLING, crowned king plus departing/future supports visible. Safe source for a truthful catalog thumbnail, not generated advertising art.

### Human playtest — still pending

| Item | Human question |
| --- | --- |
| A | Is DROP itself satisfying? |
| B | Is air movement comfortable rather than excessively heavy? |
| C | Can release drift and opposite braking be learned without inspection? |
| D | Are6m SAFE /9m fatal and the soft-platform exception intuitive? |
| E | Does each failure explain what to change on the next run? |
| F | Are introductory bend, narrow, crumble and moving patterns fair at ordinary human starting velocities? |
| G | Does choosing the next landing or a NICE skip feel meaningful? |
| H | Does BEST create a desire to retry? |
| I | Does the player want to see below1000m? |

Also check real phone two-thumb steer/DROP comfort, ghost-practice understanding, pixel text readability and actual sound/mute comfort. All answers are unperformed; human publication judgment remains pending.

## Historical design preparation

The following source-only risks were written before implementation/play. They are retained as design history, not new unresolved findings or replacements for the actual evidence above.

## Core decisions to preserve

The player chooses a visible landing, leaves a ledge with DROP, accelerates laterally in air, brakes with opposite input, and survives by breaking up the continuous fall. Going deeper competes with landing safely. Normal/hard/fatal distance, soft support, crumble timing and moving support must remain different observable consequences rather than decorative labels. DEPTH is primary; NICE DROP is a separate skill count.1000m is a brief live message, not a goal/end screen or choice modal.

## Early risks and tuning directions

1. **Reachability beyond perfect centers.** Safe patterns must consider starting x/vx, the travel/braking time during the actual fall, usable support width and moving-platform phase. Normal ledges can offer time to settle; crumble must leave enough time after HARD recovery to choose/drop. This need not protect an intentionally bad takeoff, but a safe route cannot depend on frame-perfect central alignment.
2. **Learnable inertia.** Acceleration should be visible, release should drift a little, and opposite input should stop/reverse in a modest part of the next fall. Use the first100m's broad platforms to teach it. Don't add delayed input, excessive camera easing or artificial control locks to create difficulty. Tune from actual release/reversal observations, not just a successful oracle route.
3. **Visible choices.** Player should sit above center with2–3 next supports already visible. Keep the departing support briefly above. Risk/soft routes must be legible before departure; no blind-drop solution via complex look-down controls. Milestone text must not cover the next landing or pause the run.
4. **Honest FALL and consequences.** Measure continuous fall from departure support/feet to the actual landing plane. Reset only on a supported landing. DROP ignores its current support and does not grant unrelated future platforms immunity. A held/repeated DROP should not accidentally queue the next departure after landing. Preserve the fatal fall distance in the result even if the avatar gets a comic death animation.
5. **Platform identity.** Cushioned surface shape/palette, cracked crumble and moving cues should be readable at the actual small pixel scale. Normal SAFE, HARD stagger/dust and SPLAT must explain the distance distinction. A short HARD lock must not consume most of a crumble's1–1.5s life. Motion must not change collision bounds invisibly.
6. **NICE definition.** The wording “85% of safe maximum” is ambiguous between6m SAFE threshold and9m survivable NORMAL ceiling. Suggested explicit policy:85% of the9m ceiling (~7.65m), actual survived landing only, no complex score multiplier. Whichever policy is selected, constants/copy/result interpretation must agree. Soft-platform larger survival distances need an explicit rule rather than quietly using a normal fatal label.
7. **Equivalent native controls.** PC held direction+DROP should work. Phone must have an obvious workable steer/drop sequence or independently guarded direction/DROP controls; generic primary-only filtering must not silently defeat its intended combination. Input releases on pause/pagehide/return; no synthetic tests as substitutes for native held touch.
8. **Tempo and endless.** Avoid requiring long waits after every safe landing or an unannounced1000m restart. Landings should give feedback while allowing the next deliberate action. Record actual depth/game clock and ordinary safe-route rate; model fast-forward is not real-time progression evidence. Width/offset complexity may increase in deep patterns while a fair viable option remains.

## Original generator read — historical intro concern, resolved by authored early bend

Read `src/games/game015/generation.ts` and `types.ts` while implementation is underway, not an executed game. Early width120/step16 and a full-width catch every fourth row reset the center to128. Even the early stairs centers144→160→144 keep the neutral x128 feet within each support. Thus the entire first100m can plausibly use DROP alone, not merely the first20m. At the current4m-scale gaps, the flight model gives roughly0.84–0.89s per landing: around21–23s of physical falling for25drops before any input/landing/reading delay. This is not an observed run or novice duration.

Wide introductory platforms are explicitly required; neutral success is not itself a bug. The risk is a passive first20–30s after the four-step practice unless an optional skip/steering choice is already visible and rewarding. Suggested modest authored transition after the first15–20m: retain broad support, but guarantee one small correction around20–35m instead of relying on a random stairs chunk. Example geometry discussed with engineer:104px width, centers96→184 over4.4m; from neutral128 a full12px foot needs only10px correction, while settled previouscenter96 needs42px to the near safe edge (~50px with8px margin) versus ~61px modeled reach. Keep a broad catch and no first surprise fatal. These numbers are suggestions, not accepted tuning; exact support rules/current velocity and actual native play must validate them.

The current `depth<20` pattern selection is chunk-based, so a chunk beginning at15.6m stays centered to31.2m. Any intended early transition should use its actual row/chunk extent consciously rather than assume it begins exactly at20m.

## Planned independent actual review

After root's frozen-candidate exclusive handoff: native PC/phone explanation and four-step practice, forgiving recovery, fresh main, held/released/opposite steering, current-support DROP, SAFE/HARD/fatal and their explanations, useful next-platform view while scrolling, native pause/retry/portal return. Use readonly inspection only to plan actual inputs; do not mutate player/time/platforms or force a result. Earn deeper patterns and1000m live continuation if feasible, recording honest elapsed game time and oracle limits. Review state changes and art in actual integrated screenshots; generated concepts are not gameplay evidence.

Human checklist from §57 remains pending: A DROP feels good; B air control isn't excessively heavy; C inertia learnable; D safe fall distance intuitive; E death explained; F patterns fair; G meaningful next-platform choice; H desire to improve BEST; I desire to see below1000m. Automated success cannot certify A/H/I or human difficulty. Add PC/phone readability, practice understanding and physical-touch comfort to the final human form.
