import { HANDS } from './types';
import type { Hand, LoseEvent, LoseFeedback, LoseInspection, LosePhase, LoseQuestion, LoseResult, LoseSnapshot, LoseStage, TextQuestion } from './types';
import { HAND_LABELS, HIRAGANA_LABELS, LOSING_HAND, loseCorrect, TEXT_QUESTIONS } from './questions';

export const TRANSITION_MS = 750;
export const FEEDBACK_MS = 140;
export const NORMAL_DEADLINE_MS = 2000;
export const REFLEX_DEADLINE_MS = 800;
export function stageForQuestion(number: number): LoseStage { return number <= 10 ? 'illustration' : number <= 20 ? 'hiragana' : number <= 30 ? 'text' : 'speed'; }
export function basePointsForQuestion(number: number): number { return number <= 10 ? 100 : number <= 20 ? 150 : number <= 30 ? 250 : 300; }
export function reflexPoints(reactionMs: number): number { return !Number.isFinite(reactionMs) || reactionMs < 0 ? 0 : reactionMs <= 300 ? 200 : reactionMs <= 500 ? 100 : 0; }
const copyQuestion = (q: LoseQuestion | null): LoseQuestion | null => q ? { ...q } : null;

/** Absolute monotonic-ms clock. Every native input and pause first settles the authoritative deadline.
 * Call start only after the art is decoded. A question starts on its visible reveal; staged intros remain untimed after their750ms minimum.
 */
export class LoseRun {
  private alive = false;
  private paused = false;
  private phase: LosePhase = 'ended';
  private stage: LoseStage = 'illustration';
  private epoch = 0;
  private lastNow = 0;
  private pausedAt = 0;
  private elapsedMs = 0;
  private correct = 0;
  private speedCorrect = 0;
  private score = 0;
  private question: LoseQuestion | null = null;
  private feedback: LoseFeedback | null = null;
  private deadlineMs: number | null = null;
  private answerStartedMs: number | null = null;
  private phaseEndsMs: number | null = null;
  private texts: TextQuestion[] = [];
  private ending: LoseResult | null = null;
  private responseLatencyTotalMs = 0;
  private responseCount = 0;
  constructor(private readonly emit: (event: LoseEvent) => void = () => {}, private readonly random: () => number = Math.random) {}
  reset(): void {
    this.alive = this.paused = false; this.phase = 'ended'; this.stage = 'illustration'; this.epoch++;
    this.lastNow = this.pausedAt = this.elapsedMs = this.correct = this.speedCorrect = this.score = 0;
    this.question = null; this.feedback = null; this.deadlineMs = this.answerStartedMs = this.phaseEndsMs = null;
    this.texts = []; this.ending = null; this.responseLatencyTotalMs = this.responseCount = 0;
  }
  start(nowMs: number): boolean {
    if (!Number.isFinite(nowMs) || nowMs < 0) return false;
    this.reset(); this.lastNow = nowMs;
    this.texts = this.shuffle(TEXT_QUESTIONS).slice(0, 10).map(q => ({ id: q.id, question: q.question, text: q.text, opponentHand: q.opponentHand, explanation: q.explanation }));
    this.alive = true; this.reveal(nowMs); return true;
  }
  private validClock(nowMs: number): boolean { return Number.isFinite(nowMs) && nowMs >= this.lastNow; }
  /** Never caps an elapsed wall-clock interval to a short animation frame. */
  settle(nowMs: number): void {
    if (!this.validClock(nowMs)) return;
    if (!this.alive || this.paused) { this.lastNow = nowMs; return; }
    if (this.phase === 'answer' && this.deadlineMs !== null && nowMs >= this.deadlineMs) {
      this.elapsedMs += Math.max(0, this.deadlineMs - this.lastNow); this.lastNow = nowMs;
      this.finish('timeout', null, null); return;
    }
    this.elapsedMs += nowMs - this.lastNow; this.lastNow = nowMs;
    if (this.phase === 'feedback' && this.phaseEndsMs !== null && nowMs >= this.phaseEndsMs) {
      const nextStage = stageForQuestion(this.correct + 1);
      if (nextStage !== this.stage) {
        this.stage = nextStage; this.question = null; this.feedback = null; this.deadlineMs = this.answerStartedMs = null;
        this.phaseEndsMs = nowMs + TRANSITION_MS; this.changePhase('transition');
      } else this.reveal(nowMs);
    }
  }
  answer(hand: Hand, nowMs: number, expectedEpoch = this.epoch): boolean {
    if (!this.validClock(nowMs)) return false;
    this.settle(nowMs);
    if (!this.alive || this.paused || this.phase !== 'answer' || expectedEpoch !== this.epoch || !HANDS.includes(hand) || !this.question || this.answerStartedMs === null) return false;
    const reactionMs = nowMs - this.answerStartedMs;
    this.responseLatencyTotalMs += reactionMs; this.responseCount++;
    if (!loseCorrect(this.question.opponentHand, hand)) {
      this.finish(hand === this.question.opponentHand ? 'draw' : 'win', hand, reactionMs); return true;
    }
    const basePoints = basePointsForQuestion(this.correct + 1), bonus = this.stage === 'speed' ? nowMs <= this.answerStartedMs + 300 ? 200 : nowMs <= this.answerStartedMs + 500 ? 100 : 0 : 0;
    this.correct++; if (this.stage === 'speed') this.speedCorrect++;
    this.score += basePoints + bonus;
    this.feedback = { opponentHand: this.question.opponentHand, playerHand: hand, expectedHand: LOSING_HAND[this.question.opponentHand], reactionMs,
      basePoints, reflexPoints: bonus, points: basePoints + bonus };
    this.deadlineMs = this.answerStartedMs = null; this.phaseEndsMs = nowMs + FEEDBACK_MS;
    this.changePhase('feedback');
    this.emit({ type: 'correct', score: this.score, correct: this.correct, feedback: { ...this.feedback } }); return true;
  }
  ready(nowMs: number, expectedEpoch = this.epoch): boolean {
    if (!this.validClock(nowMs)) return false;
    this.settle(nowMs);
    if (!this.alive || this.paused || this.phase !== 'read' || expectedEpoch !== this.epoch) return false;
    this.openAnswer(nowMs); return true;
  }
  advance(nowMs: number, expectedEpoch = this.epoch): boolean {
    if (!this.validClock(nowMs)) return false;
    this.settle(nowMs);
    if (!this.alive || this.paused || this.phase !== 'transition' || expectedEpoch !== this.epoch || this.phaseEndsMs === null || nowMs < this.phaseEndsMs) return false;
    this.reveal(nowMs); return true;
  }
  pause(paused: boolean, nowMs: number): boolean {
    if (!this.validClock(nowMs)) return false;
    this.settle(nowMs);
    if (!this.alive || this.paused === paused) return false;
    if (paused) { this.paused = true; this.pausedAt = nowMs; }
    else {
      const shift = nowMs - this.pausedAt;
      if (this.deadlineMs !== null) this.deadlineMs += shift;
      if (this.answerStartedMs !== null) this.answerStartedMs += shift;
      if (this.phaseEndsMs !== null) this.phaseEndsMs += shift;
      this.paused = false;
    }
    // Native controls must make a fresh approval after either pause boundary.
    this.epoch++; return true;
  }
  private reveal(nowMs: number): void {
    const number = this.correct + 1; this.stage = stageForQuestion(number); this.feedback = null; this.phaseEndsMs = null;
    if (this.stage === 'text') {
      const q = this.texts[number - 21];
      this.question = { id: q.id, number, stage: this.stage, opponentHand: q.opponentHand, text: q.question, explanation: q.explanation };
      this.deadlineMs = this.answerStartedMs = null; this.changePhase('read');
      this.emit({ type: 'question', question: { ...this.question }, deadlineMs: null });
    } else {
      const hand = HANDS[Math.min(2, Math.max(0, Math.floor(this.random() * 3)))];
      this.question = { id: `round-${number}`, number, stage: this.stage, opponentHand: hand,
        text: this.stage === 'hiragana' ? HIRAGANA_LABELS[hand] : '相手に負ける手を出そう！',
        explanation: `相手は${HAND_LABELS[hand]}。${HAND_LABELS[LOSING_HAND[hand]]}なら負けます。` };
      this.openAnswer(nowMs);
    }
  }
  private openAnswer(nowMs: number): void {
    this.answerStartedMs = nowMs; this.deadlineMs = nowMs + (this.stage === 'speed' ? REFLEX_DEADLINE_MS : NORMAL_DEADLINE_MS);
    this.phaseEndsMs = null; this.changePhase('answer');
    this.emit({ type: 'question', question: { ...this.question! }, deadlineMs: this.deadlineMs });
  }
  private changePhase(phase: LosePhase): void {
    this.phase = phase; this.epoch++; this.emit({ type: 'phase', phase, stage: this.stage, epoch: this.epoch });
  }
  private finish(outcome: LoseResult['outcome'], playerHand: Hand | null, reactionMs: number | null): void {
    if (!this.alive || !this.question) return;
    this.alive = false; this.paused = false;
    this.ending = { outcome, score: this.score, correct: this.correct, speedCorrect: this.speedCorrect, time: this.elapsedMs / 1000,
      stage: this.stage, question: { ...this.question }, opponentHand: this.question.opponentHand, playerHand,
      expectedHand: LOSING_HAND[this.question.opponentHand], reactionMs,
      reason: outcome === 'win' ? '勝ってしまいました。' : outcome === 'draw' ? 'あいこです。負けてください。' : '考えすぎです。',
      responseLatencyTotalMs: this.responseLatencyTotalMs, responseCount: this.responseCount, highestReflexStreak: this.speedCorrect };
    this.changePhase('ended'); this.emit({ type: 'end', result: { ...this.ending, question: { ...this.ending.question } } });
  }
  private shuffle<T>(pool: readonly T[]): T[] {
    const result = [...pool];
    for (let i = result.length - 1; i > 0; i--) { const j = Math.max(0, Math.min(i, Math.floor(this.random() * (i + 1)))); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  }
  snapshot(): LoseSnapshot {
    return { alive: this.alive, paused: this.paused, phase: this.phase, stage: this.stage, epoch: this.epoch,
      questionNumber: this.correct + 1, correct: this.correct, speedCorrect: this.speedCorrect, score: this.score, time: this.elapsedMs / 1000,
      question: copyQuestion(this.question), feedback: this.feedback ? { ...this.feedback } : null,
      deadlineMs: this.deadlineMs, remainingMs: this.alive && this.phase === 'answer' && this.deadlineMs !== null ? Math.max(0, this.deadlineMs - (this.paused ? this.pausedAt : this.lastNow)) : null,
      answerStartedMs: this.answerStartedMs, phaseEndsMs: this.phaseEndsMs,
      transitionRemainingMs: this.phase === 'transition' && this.phaseEndsMs !== null ? Math.max(0, this.phaseEndsMs - (this.paused ? this.pausedAt : this.lastNow)) : null,
      basePoints: basePointsForQuestion(this.correct + 1), responseLatencyTotalMs: this.responseLatencyTotalMs, responseCount: this.responseCount };
  }
  inspection(): LoseInspection {
    return { ...this.snapshot(), expectedHand: this.question ? LOSING_HAND[this.question.opponentHand] : null,
      selectedTextQuestions: this.texts.map(q => ({ ...q })) };
  }
  result(): LoseResult | null { return this.ending ? { ...this.ending, question: { ...this.ending.question } } : null; }
}
