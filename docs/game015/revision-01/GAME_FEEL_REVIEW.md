# Game015 harder revision — independent Game Feel review

Status: **independent bounded native Game Feel PASS; human playtest pending**. Original published-version reports remain separate and unchanged. This reviewer does not implement the game. Final QA and separate visual acceptance remain their owners' gates.

## Actual review — 2026-10-04

Frozen candidate `REVIEW_CANDIDATE.json`, aggregate `2e36dcfc1429c1250a4f1875ea59406a122d28efe8f7390db198ed625517131a`. Exclusive Chromium DEV5181, PC1440×900 then phone390×844, sequential contexts. **All reviewer browsers are closed.** Runtime/art files were not changed during these runs.

Keyboard, native mouse/tap and native Chromium touch contacts were used. Read-only inspection planned positioning and bird timing; no body/course/clock/score/result/completion injection or forced ending. The planner is not a human player: actual executable choices and input delivery do not establish novice success rate, reflex difficulty or enjoyment.

| Item | Actual PC / phone observation | Assessment |
| --- | --- | --- |
| Explanation and practice | New explanation says to avoid spikes and watch wall warning/bird position before DROP. Same four isolated steps completed in8.44s PC /8.63s phone practice-clock; main remained inactive. Actual larger king was visible in main/practice. | The new dangers are introduced before main. Practice teaches DROP/steer/fall-distance; it does not itself train hazard timing. |
| Passive center no longer sufficient | Native center-only DROP sequence ended on a spike at15.1m,3.57s PC /3.67s phone, fall3.5m. | First visible paired bays demand a horizontal choice. This is intentionally rapid automated input, not average first-play duration. The harder request is met; whether this pace feels fair needs human feedback. |
| Enlarged body and landing bays | Native lateral correction/braking safely traversed the first paired spike rows and reached15.6m departure ledge. After bird waiting, PC landed20m atx111.84/vx−5.43, phone atx107.76/vx21.11, both actual4.4m SAFE. | A feasible early route exists with the enlarged body and actual momentum. This single route does not certify every incoming velocity or later narrow bay. |
| Wall warning/contact | Actual yellow warning devices plus “壁の針の予兆！ 壁から離れよう。” were captured before contact. PC first observation time1.0599/remain0.9000→needle death1.9599; phone1.1127/remain0.8889→death2.0043. Both wall-side runs died around4m. | Visible warning precedes real activation/contact. Wall hugging is dangerous before a long fall. The full0.9s warning is not a claim that all players can react comfortably. |
| Bird wait changes outcome | On the15.6m ledge, ordinary native route waited2.92s PC /2.60s phone for an opening. Native DROP plus left steering/braking then landed20m SAFE, alive. | Bird movement creates a genuine wait/drop decision; waiting does not move the floor or force a countdown choice here. |
| Bird has real collision | A separate normal run deliberately chose a crossing DROP and actually contacted the bird at16.456m:7.866s PC /7.935s phone. | Bird is a gameplay hazard rather than a decorative sprite. Cause/result says to watch its movement and change DROP timing. |
| Failure/retry | Actual spike, wall needle and bird result headings/reasons each name the cause. Six native retries returned PLAYING with fresh run state in36–81ms wall observations. Results and both actions were independently viewed on PC/phone. | Fast retry and accurate cause make correction possible. Timings are browser-automation observations, not physical handset guarantees. |
| Native phone controls | Held Right contact plus secondary DROP release completed practice and ordinary steering. Later bird avoidance used touch direction changes with the actual model's inertia. | Advertised simultaneous controls work in native emulated touch. No synthetic DOM pointer dispatch was substituted; DROP contact was ended explicitly while held direction remained. |
| Pause/focus/return | Header pause→same-header resume accepted immediate directional input on PC/phone. Physics time was unchanged during350ms wall pause. Native title and portal return completed. Both final journals have no page errors. | Previously repaired focus/lifecycle behavior remains exercised in this revision. Other viewport/persistence/production cases remain final QA scope. |

Agent judgment: the early game now makes the safe bay, wall proximity and bird phase consequential while preserving an executable steer/brake route. The enlarged king is easier to follow against the quiet shaft; pink spike teeth and yellow wall warning are visibly separate from ordinary supports. The actual screenshots show upcoming choices before departure. No outstanding observed Feel implementation blocker was found in this bounded review.

### Actual thumbnail source

`actual-gameplay.png` is the unmodified256×448 browser canvas exported after a native DROP; `actual-gameplay.json` records the same candidate/viewport/inspection. Phase FALLING, time8.5103, depth15.8323m, FALL0.2323m, kingx147.01/vx−36.82. It contains the enlarged king, spike bays, wall devices and birds. Root may resize/letterbox this actual frame for the revised catalog thumbnail after browser closure. It is not AI concept art or an injected gameplay pose. The independently viewed full screen is `review-artifacts/desktop-hazard-fall.png`.

### Scope and limits

This is a bounded early revision review, **not a repeat of the original1000m route**. The original published-version1036m native result cannot certify the changed hazard course. No independent revised1000m/endless continuation, later moving/crumble hazard interaction, HARD/soft landing exception, exact wall-warning withdrawal, all-seed reachability or personal-best reload value was exercised. Gameplay/QA public-model5000m runs remain separate mathematical/control evidence attributable to their owners.

The visible0.9s wall warning and a safe centered route are established; an actual approach→withdrawal recovery is not claimed. Physical phone comfort/audio, motion preferences, all viewports and deployed behavior are still QA/human responsibilities. No advertising/credit appeal or human fun has been validated.

### Evidence

- `review-artifacts/native-review.mjs`: reviewer-only native harness, no runtime changes.
- `review-artifacts/desktop-RECORD.json`, `mobile-RECORD.json`: actual practice, hazards, wait/avoid/contact, retries, pause and diagnostics.
- `{desktop,mobile}-{first-main,wall-warning,bird-waiting,bird-avoided}.png`: genuinely played states, independently viewed.
- `{desktop,mobile}-{passive-spike-result,wall-needle-result,bird-contact-result}.png`: naturally earned fatal results, not score/layout fixtures.
- `{desktop,mobile}-explanation.png`: actual first-play copy; phone explanation independently viewed.

### Human playtest — pending

1. Is the enlarged king easier to follow without feeling unfairly wide?
2. Can a new player identify spike bays and correct the center DROP route before contact?
3. Does0.9s of wall warning allow a comfortable retreat with actual momentum?
4. Can bird movement be read well enough to choose a satisfying DROP time rather than guess?
5. Are narrow landings/braking and later hazard combinations fair without inspection?
6. Do distinct causes make the next attempt understandable, and does immediate retry invite another run?
7. Is phone two-thumb steer/DROP comfortable, and do players want to descend below1000m?

All human answers remain unperformed. Final publication/game enjoyment approval must not be inferred from this agent readiness PASS.

## Historical preparation

The following checklist was written before revision source/play and is retained as design history. The observations above state what was actually covered and what remains unperformed.

## Revision concerns to verify

1. **Larger king and momentum:** landing-bay viability must include the enlarged collision body, incoming lateral velocity, real acceleration/braking and moving-support phase. Sprite silhouette and fatal boundary must agree. A route from perfect center/rest is insufficient to prove a forgiving route from actual previous landings.
2. **No full-width catches:** preserve at least one visible, feasible next support in each authored segment; do not replace every missed row with an unavoidable fatal impact. Narrow choices should create deliberate steering, while a bad choice remains allowed to fail. Introductory corrections can be small even with early spikes.
3. **Paired spike bays:** depict both dangerous portions and the actual usable landing interval from the departure ledge. The safe bay must accommodate the enlarged body plus useful braking margin. A centered passive DROP must eventually demand a decision, but a new player should first see why steering matters.
4. **Wall needles:** show the device and its proximity warning before danger activates. Confirm that approaching and withdrawing both have an observable consequence. No invisible boundary, immediate pop directly into the body, or misleading apparent safe wall clamp.
5. **Bird timing:** require actual wait/drop judgment, with a usable flight window. Grounded waiting cannot be the only advertised solution on an already-expiring crumble. Display the bird/trajectory early enough to estimate the crossing. Native avoidance must be compared with a genuine contact death, not inferred from a decorative oscillation.
6. **Failure reason:** spikes, wall needles, bird and overlong impact should yield distinct accurate causes, preserve depth/fall information and permit immediate retry. End-of-run feedback should help choose a different next action.
7. **Practice and first10 seconds:** old isolated practice still needs to teach the enlarged body and lateral/drop behavior accurately. Main explanation should introduce early spike danger before an ordinary first attempt encounters it. Observe the actual first correction and death clock; do not describe an automated policy as average novice play.
8. **Phone equivalence:** native two-touch steer plus DROP must retain the held steering contact when DROP releases. Use real pointer IDs in the browser journal. Reviewer previously corrected a CDP harness bug that released the wrong finger; never attribute that preserved old harness failure to the revised runtime.

## Actual review planned after root's source freeze

Use ordinary PC/native touch controls and read-only model inspection only; no forced state, course, score or time. Review the new-sized king's practice, first10 seconds, spike-bay choice, visible needle trigger/withdrawal, actual bird wait/drop avoidance/contact, inertia and support reachability. Capture genuine early gameplay and natural hazard results on PC and390×844 phone. Check pause, focus after header resume/mute, fast retry, portal return and deeper continuation if reasonably feasible. Root/QA separately own all-viewport and production regression; actual long-run success must be clearly separated from pure-model simulation.

Agent technical/qualitative readiness may be assessed after this execution. Human enjoyment, learning fairness, physical phone comfort and desire to retry remain unperformed. No implementation acceptance is implied by the design note or model PASS.
