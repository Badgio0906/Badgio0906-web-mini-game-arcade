# Game016 LOSE TO WIN gameplay checkpoint

2026-10-05. Pure gameplay sources and formal tests are frozen for independent review. Native UI/input, generated artwork, portal integration and final build are separate owners' work. This checkpoint does not certify human enjoyment or actual browser behavior.

## Implemented game

`loseCorrect(opponent, player)` checks actual rock-paper-scissors semantics. Only rock→scissors, scissors→paper and paper→rock succeed. The other six pairs end the run as a win or draw; deadline expiration ends it as timeout. Fixed left/center/right controls are a UI contract: rock/scissors/paper throughout. The model never shuffles answer positions.

Questions1–10 use illustrations,11–20 hiragana,21–30 indirect sentences,31 onward the endless REFLEX stage. Every timed answer before31 has2000ms. REFLEX stays800ms forever. Text reading has no deadline; `ready(nowMs, epoch)` synchronously opens the full2000ms answer window. UI must call it only on a fresh released gesture and render the choices immediately.

Correct answers produce140ms feedback. At format changes, a750ms minimum transition settles into an unlimited reading/Continue interval. An explicit released `advance(nowMs, epoch)` opens the next visible question. This follows the agreed interpretation of “30連敗の後に一旦止め” without making an introductory text eat the next answer's time. The added Continue tap is a human tempo review item, not proof that the flow feels good.

## Clock and input boundary

`LoseRun` exposes `start(nowMs)`, `settle(nowMs)`, `answer(hand, nowMs, epoch)`, `ready(nowMs, epoch)`, `advance(nowMs, epoch)`, `pause(paused, nowMs)`, `reset()`, `snapshot()`, `inspection()` and `result()`. Timestamps are absolute monotonic milliseconds. Snapshot/result `time` is active real seconds, including reading and transitions, excluding paused time.

Every answer and pause settles the complete wall-clock interval first. At or after a deadline, the run ends before accepting input or pausing. There is no short-frame cap or undisclosed reaction grace. Nonfinite/backward timestamps are ignored/rejected. Pausing freezes the answer window, feedback and transition; resuming shifts their absolute timestamps by the actual pause duration, preserving elapsed reaction time. Epochs change on phase/reveal, pause boundaries and retries. A cached prior question, READY, transition or feedback approval cannot answer the next question.

A delayed RAF that reveals a fresh question starts its deadline at that actual reveal call, rather than charging time during which the question was not displayed. Image decoding before real start, native release guards, focus cleanup, visibility handling and key-repeat prevention remain UI responsibilities and need browser evidence. Three shared hand assets must be decoded before the first timed question; later illustration/REFLEX questions use the same cached art.

## Question data

`questions.ts` contains30 unique records with explicit `id`, `question`, `text` alias, `opponentHand` and explanation. The pool is balanced10 each. A run samples10 without repetition. Sentences describe a hand, a relationship, a same-hand comparison or exclusions; they do not simply declare the actual answer. The first ten follow the user's examples, including exact “紙を切れる手を出すよ” and “石に勝てる手だよ”. Additional descriptions avoid adding the direct answer after a comma.

A separate symbolic `meaning` clue validates each sentence's authored intended semantics over all three hands. `questionDataIssues()` checks missing/duplicate IDs, duplicate/inconsistent text, valid hand values and exactly one semantic answer matching `opponentHand`. Symbolic validation cannot prove natural-language clarity by itself: independent manual reading and human play remain required. No NLP or guessed string-to-hand inference is used at runtime. Explanations identify the opponent and losing answer for results; they must not reveal the answer while a question is active.

## Points and results

Base points are100/150/250/300 across the four stages. The first30 therefore total5000. REFLEX adds200 at≤300ms,100 at>300…≤500ms, and0 afterward. Deadline comparisons and bonus bands use the corresponding absolute clock endpoints, avoiding a floating subtraction changing an exact300ms boundary. There is no extra bonus in the initial stages.

Results retain score, total correct losses, stage, REFLEX streak/highest streak, attempted player/opponent/correct hands and latency, plus total response latency/count for analytics beyond a200-event memory history. A timeout has no fabricated player response or response latency. One end event is emitted. Flavor helpers provide the requested title thresholds and progression comments, including a defined zero-loss result.

## Start-only wallet and isolated practice

`createRunWallet(credits).start(runId)` is the sole spending boundary: once per accepted real RUN start when credits are enabled, with no end/answer spending API. Duplicate IDs are rejected throughout the page session; denied starts can retry after refill. Disabled prototype credits allow play even with stored zero and never consume. The adapter reuses existing `CreditService.consume()` without changing other games. Main must allocate a fresh ID per retry and call the wallet only after required practice/art readiness, before real RUN events/model start.

The UI-owned `createLoseOnboarding()` is a separate untimed three-question practice: rock→scissors, scissors→paper, paper→rock. Wrong/draw attempts remain on the same question. Completion storage is written only at the explicit completion step. The formal tests import this helper without modifying it and verify that practice does not alter a real model, BEST, credits or RUN telemetry. Denied storage uses the existing in-page memory fallback; persistence across a reload requires working browser storage.

## Checkpoint evidence

- `npx vitest run tests/unit/game016.test.ts tests/unit/game016-wallet.test.ts tests/unit/game016-practice.test.ts`:15/15 passed,121ms combined test time.
- `npm run check`:passed.
- All nine hand combinations, single-answer balanced30-question data,200 seeded10-question selections, exact2s/.8s expiration,300/500ms bonus boundaries, pause in answer/read/transition/feedback, minimum transition and unlimited reading, old epoch/retry rejection, copied snapshots/events/results and accumulated analytics are covered.
- Ordinary public progression earned5000 at30 and continued156 REFLEX questions in one case. A1000-answer run demonstrated independent opponent choices and repeated same hands. These are reachability/contract checks, not human inhibition or reaction-skill results.
- Real shared CREDIT tests prove three start spends, zero refusal, Stub refill, duplicate protection and100 unlimited disabled retries. Practice tests cover wrong/draw retry, explicit completion persistence, denied writes and isolation.

No browser, build, deployment or commit was performed by the gameplay owner. Independent QA/Feel/Visual, real desktop/portrait input and release timing, generated-image visibility, portal/BEST/mute integration, final build, human enjoyment and physical-device performance are pending at this checkpoint. Existing games and shared sources were outside this implementation scope.

## Human questions

Use the shared A–N protocol; all answers remain pending. Game016-specific items are understanding that losing succeeds, learning fixed positions, fairness of2s, whether hiragana changes the habit interference, clarity/tempo of indirect text, whether800ms feels almost attainable, accidental usual-winning answers, one-miss tension, humor and immediate retry desire. Observe the transition Continue tap and the three-word/illustration changes without calling automated answers a game-feel acceptance.
