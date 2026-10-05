import { describe, expect, it } from 'vitest';
import { LoseRun, FEEDBACK_MS, NORMAL_DEADLINE_MS, REFLEX_DEADLINE_MS, TRANSITION_MS, reflexPoints } from '../../src/games/game016/LoseRun';
import { HANDS } from '../../src/games/game016/types';
import type { Hand, LoseEvent } from '../../src/games/game016/types';
import { LOSING_HAND, loseCorrect, questionDataIssues, semanticHands, TEXT_QUESTIONS } from '../../src/games/game016/questions';
import { loseComment, loseTitle } from '../../src/games/game016/resultFlavor';

const rng = (seed: number) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
function player(seed = 1) {
  const events: LoseEvent[] = [], run = new LoseRun(e => events.push(e), rng(seed)); let now = 100;
  run.start(now);
  return {
    run, events, get now() { return now; },
    tick(ms: number) { now += ms; run.settle(now); },
    active() {
      const s = run.snapshot();
      if (s.phase === 'feedback') { now += FEEDBACK_MS; run.settle(now); }
      if (run.snapshot().phase === 'transition') { now += TRANSITION_MS; run.settle(now); expect(run.advance(now, run.snapshot().epoch)).toBe(true); }
      if (run.snapshot().phase === 'read') { now += 300; expect(run.ready(now, run.snapshot().epoch)).toBe(true); }
      expect(run.snapshot().phase).toBe('answer');
    },
    correct(ms = 100) { this.active(); now += ms; const s = run.inspection(); expect(run.answer(s.expectedHand!, now, s.epoch)).toBe(true); },
  };
}

describe('LOSE TO WIN inversion, authored language and absolute timing', () => {
  it('checks all9pairs: only3 genuinely losing responses succeed', () => {
    let correct = 0;
    for (const opponent of HANDS) for (const hand of HANDS) {
      expect(loseCorrect(opponent, hand)).toBe(LOSING_HAND[opponent] === hand);
      if (loseCorrect(opponent, hand)) correct++;
      const run = new LoseRun(() => {}, () => HANDS.indexOf(opponent) / 3 + .01); run.start(0);
      expect(run.answer(hand, 100)).toBe(true);
      if (hand === LOSING_HAND[opponent]) expect(run.snapshot()).toMatchObject({ alive: true, correct: 1, score: 100, phase: 'feedback' });
      else expect(run.result()).toMatchObject({ outcome: hand === opponent ? 'draw' : 'win', score: 0, opponentHand: opponent, playerHand: hand });
    }
    expect(correct).toBe(3);
  });
  it('has30unique, semantically single-answer indirect questions, balanced10each; samples10without repetition', () => {
    expect(TEXT_QUESTIONS.length).toBeGreaterThanOrEqual(30); expect(questionDataIssues()).toEqual([]);
    for (const q of TEXT_QUESTIONS) {
      expect(q.question).toBe(q.text); expect(semanticHands(q.meaning)).toEqual([q.opponentHand]);
      expect(q.text).not.toMatch(/(?:グー|チョキ|パー)(?:を出す|でいく|のまま)/);
    }
    for (const hand of HANDS) expect(TEXT_QUESTIONS.filter(q => q.opponentHand === hand)).toHaveLength(10);
    const selections = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const p = player(seed), selected = p.run.inspection().selectedTextQuestions;
      expect(selected).toHaveLength(10); expect(new Set(selected.map(q => q.id)).size).toBe(10);
      for (const q of selected) { expect(TEXT_QUESTIONS.some(item => item.id === q.id)).toBe(true); selections.add(q.id); }
    }
    expect(selections.size).toBe(30);
    const corrupt = { ...TEXT_QUESTIONS[0], opponentHand: 'rock' as Hand };
    expect(questionDataIssues([corrupt])).toContain(`ambiguous or inconsistent meaning: ${corrupt.id}`);
    expect(questionDataIssues([TEXT_QUESTIONS[0], TEXT_QUESTIONS[0]])).toContain('duplicate or empty id');
  });
  it('settles the entire elapsed interval before answers and pause; exactdeadline expires withoneend', () => {
    for (const elapsed of [2000, 2001, 60000]) {
      const p = player(); const answer = p.run.inspection().expectedHand!;
      expect(p.run.answer(answer, p.now + elapsed)).toBe(false);
      expect(p.run.result()).toMatchObject({ outcome: 'timeout', score: 0, time: 2 });
      expect(p.run.pause(true, p.now + elapsed + 10)).toBe(false);
      p.run.settle(p.now + elapsed + 1000); expect(p.events.filter(e => e.type === 'end')).toHaveLength(1);
    }
    const p = player(); expect(p.run.answer(p.run.inspection().expectedHand!, p.now + 1999.99)).toBe(true);
    expect(p.run.snapshot().correct).toBe(1);
    const q = player(); expect(q.run.pause(true, q.now + 2000)).toBe(false); expect(q.run.result()?.outcome).toBe('timeout');
  });
  it('freezes answer/reading/transition/feedback and shifts realdeadline without extending reactionbudget', () => {
    for (const target of ['answer', 'feedback', 'transition', 'read'] as const) {
      const p = player();
      if (target === 'feedback') p.correct();
      if (target === 'transition') { for (let i = 0; i < 10; i++) p.correct(); p.tick(FEEDBACK_MS); }
      if (target === 'read') { for (let i = 0; i < 20; i++) p.correct(); p.active(); p.correct(); p.tick(FEEDBACK_MS); }
      expect(p.run.snapshot().phase).toBe(target);
      expect(p.run.pause(true, p.now)).toBe(true); const frozen = p.run.snapshot();
      expect(p.run.answer('rock', p.now + 10000, frozen.epoch)).toBe(false);
      expect(p.run.ready(p.now + 11000, frozen.epoch)).toBe(false);
      p.run.settle(p.now + 12000); expect(p.run.snapshot()).toEqual(frozen);
      expect(p.run.pause(false, p.now + 12000)).toBe(true);
      expect(p.run.snapshot().time).toBe(frozen.time);
      if (frozen.deadlineMs !== null) expect(p.run.snapshot().deadlineMs).toBe(frozen.deadlineMs + 12000);
      if (frozen.answerStartedMs !== null) expect(p.run.snapshot().answerStartedMs).toBe(frozen.answerStartedMs + 12000);
      if (frozen.phaseEndsMs !== null) expect(p.run.snapshot().phaseEndsMs).toBe(frozen.phaseEndsMs + 12000);
      expect(p.run.snapshot().epoch).not.toBe(frozen.epoch);
    }
    const p = player(); p.tick(1999); p.run.pause(true, p.now); p.run.pause(false, p.now + 60000);
    const s = p.run.inspection(); expect(s.remainingMs).toBe(1);
    p.run.answer(s.expectedHand!, p.now + 60000.5, s.epoch); expect(p.run.snapshot().feedback?.reactionMs).toBe(1999.5);
  });
  it('has750ms minimum +untimedexplicitstageadvance and textreading with a full fresh2000ms window', () => {
    const p = player(); for (let i = 0; i < 10; i++) p.correct(); p.tick(FEEDBACK_MS);
    const transition = p.run.snapshot(); expect(transition).toMatchObject({ phase: 'transition', stage: 'hiragana', question: null, deadlineMs: null });
    expect(p.run.advance(p.now + TRANSITION_MS - .01, transition.epoch)).toBe(false);
    p.tick(100000); expect(p.run.snapshot()).toMatchObject({ alive: true, phase: 'transition', score: 1000, transitionRemainingMs: 0 });
    p.run.advance(p.now, transition.epoch); expect(p.run.snapshot().remainingMs).toBe(NORMAL_DEADLINE_MS);
    for (let i = 0; i < 10; i++) p.correct(); p.tick(FEEDBACK_MS + TRANSITION_MS); p.active();
    // The next text question returns to unlimited reading after feedback.
    p.correct(); p.tick(FEEDBACK_MS); const reading = p.run.snapshot(); expect(reading.phase).toBe('read');
    p.tick(1000000); expect(p.run.snapshot()).toMatchObject({ alive: true, phase: 'read', score: 2750, deadlineMs: null });
    const epoch = p.run.snapshot().epoch; expect(p.run.ready(p.now, epoch)).toBe(true);
    expect(p.run.snapshot()).toMatchObject({ remainingMs: 2000, answerStartedMs: p.now });
    expect(p.run.answer(p.run.inspection().expectedHand!, p.now, epoch)).toBe(false);
    expect(p.run.snapshot().correct).toBe(21);
  });
  it('earns5000 through30questions; endlessreflex fixed800ms and exact300/500ms speedbonus bands', () => {
    const p = player(); const stages = new Set<string>();
    for (let i = 0; i < 30; i++) { p.active(); stages.add(p.run.snapshot().stage); expect(p.run.snapshot().remainingMs).toBe(2000); p.correct(100); }
    expect(p.run.snapshot()).toMatchObject({ correct: 30, score: 5000, speedCorrect: 0 });
    expect([...stages]).toEqual(['illustration', 'hiragana', 'text']);
    let expectedScore = 5000;
    for (const [ms, bonus] of [[0,200], [300,200], [300.001,100], [500,100], [500.001,0], [799.999,0]] as const) {
      p.active(); expect(p.run.snapshot().remainingMs).toBeCloseTo(800, 8); p.correct(ms); expectedScore += 300 + bonus;
      expect(p.run.snapshot().score).toBe(expectedScore); expect(p.run.snapshot().feedback?.reflexPoints).toBe(bonus);
    }
    for (let i = 0; i < 150; i++) { p.active(); expect(p.run.snapshot().remainingMs).toBeCloseTo(800, 8); p.correct(250); }
    expect(p.run.snapshot().speedCorrect).toBe(156); p.active(); const end = p.run.inspection();
    expect(p.run.answer(end.expectedHand!, p.now + REFLEX_DEADLINE_MS, end.epoch)).toBe(false);
    expect(p.run.result()).toMatchObject({ outcome: 'timeout', correct: 186, speedCorrect: 156, highestReflexStreak: 156 });
    expect(reflexPoints(-1)).toBe(0); expect(reflexPoints(Infinity)).toBe(0);
  });
  it('feedback/staleepochs cannot queue a futureanswer and oldrunepochs stayinvalid after retry', () => {
    const p = player(); const old = p.run.inspection(); p.correct(); const after = p.run.snapshot();
    expect(p.run.answer(old.expectedHand!, p.now + 100, after.epoch)).toBe(false);
    // Settling feedback exposes a NEW question; an old approval must still be rejected.
    expect(p.run.answer(old.expectedHand!, p.now + FEEDBACK_MS, after.epoch)).toBe(false);
    expect(p.run.snapshot().correct).toBe(1);
    p.run.start(p.now + 1000); expect(p.run.answer(p.run.inspection().expectedHand!, p.now + 1001, old.epoch)).toBe(false);
    expect(p.run.snapshot().correct).toBe(0);
    const before = p.run.snapshot(); for (const invalid of [NaN, Infinity, -1]) p.run.settle(invalid);
    expect(p.run.snapshot()).toEqual(before); expect(p.run.answer('rock', p.now)).toBe(false);
  });
  it('copies state/results/events and aggregates latencies forrun_end beyond bounded telemetryhistory', () => {
    const p = player(); for (let i = 0; i < 35; i++) p.correct(250);
    const s = p.run.inspection(); s.question!.opponentHand = 'paper'; s.selectedTextQuestions[0].opponentHand = 'paper';
    const feedbackEvent = p.events.find(e => e.type === 'correct')!;
    if (feedbackEvent.type === 'correct') feedbackEvent.feedback.points = 9999;
    expect(p.run.snapshot().score).toBe(7500); expect(p.run.snapshot().responseLatencyTotalMs).toBe(8750);
    p.active(); const answer = p.run.snapshot().question!.opponentHand;
    p.run.answer(answer, p.now + 400, p.run.snapshot().epoch);
    expect(p.run.result()).toMatchObject({ outcome: 'draw', responseLatencyTotalMs: 9150, responseCount: 36, highestReflexStreak: 5 });
    const result = p.run.result()!; result.question.text = 'corrupt'; result.score = 0;
    expect(p.run.result()?.score).toBe(7500); expect(p.run.result()?.question.text).not.toBe('corrupt');
    const event = p.events.find(e => e.type === 'end')!; if (event.type === 'end') event.result.question.text = 'event corruption';
    expect(p.run.result()?.question.text).not.toBe('event corruption');
    p.run.reset(); expect(p.run.inspection()).toMatchObject({ alive: false, score: 0, correct: 0, selectedTextQuestions: [], responseCount: 0 });
  });
  it('uses independentopponent choices and purepracticehelpers cannot alter a realrun', () => {
    const p = player(42); const counts = { rock: 0, scissors: 0, paper: 0 }; let previous: Hand | null = null, repeats = 0;
    for (let i = 0; i < 1000; i++) {
      p.active(); const hand = p.run.snapshot().question!.opponentHand;
      if (p.run.snapshot().stage !== 'text') { counts[hand]++; if (previous === hand) repeats++; previous = hand; }
      p.correct(100);
    }
    for (const n of Object.values(counts)) expect(n).toBeGreaterThan(260);
    expect(repeats).toBeGreaterThan(200);
    const untouched = new LoseRun(); const before = untouched.snapshot();
    for (let attempt = 0; attempt < 100; attempt++) for (const hand of HANDS) loseCorrect(hand, LOSING_HAND[hand]);
    expect(untouched.snapshot()).toEqual(before);
  });
  it('titles/comments coverzero, allthresholds and genuinelyhighreflex runs', () => {
    expect([0,1,5,6,10,11,20,21,30,31,40,41,60,61,100,101].map(loseTitle)).toEqual([
      '勝つクセ、健在。','負け下手','負け下手','負けの初心者','負けの初心者','立派な敗者','立派な敗者','負けるが勝ち','負けるが勝ち','敗北のプロ','敗北のプロ','連敗王','連敗王','負けじゃんけん名人','負けじゃんけん名人','超絶アルティメット敗北神']);
    expect(loseComment(30,0)).toBe('もう負け方は完璧です。'); expect(loseComment(40,10)).toBe('考える前に負けています。');
    expect(loseComment(60,30)).toBe('敗北が身体に染みついています。'); expect(loseComment(130,100)).toBe('勝ち方を忘れていませんか？');
  });
});
