import type { QuestionState } from './model';
export const ROUND_RULES = 'five-words-v1';
export interface WordRound { index: number; score: number; streak: number; solved: number; settled: boolean }
export const freshRound = (): WordRound => ({ index: 1, score: 0, streak: 0, solved: 0, settled: false });
export function settleRound(round: WordRound, question: QuestionState): WordRound {
  if (round.settled || question.outcome === 'playing') return round;
  const correct = question.outcome === 'correct', streak = correct ? round.streak + 1 : 0;
  const earned = correct ? Math.floor((100 + question.remaining * 20 + streak * 50) * (question.hintUsed ? .5 : 1)) : 0;
  return { ...round, score: round.score + earned, streak, solved: round.solved + Number(correct), settled: true };
}
export function validRound(value: unknown): value is WordRound {
  if (!value || typeof value !== 'object') return false;
  const r = value as WordRound;
  return Number.isInteger(r.index) && r.index >= 1 && r.index <= 5 && Number.isInteger(r.score) && r.score >= 0 && r.score <= 10000 && Number.isInteger(r.streak) && r.streak >= 0 && r.streak <= r.index && Number.isInteger(r.solved) && r.solved >= r.streak && r.solved <= r.index && typeof r.settled === 'boolean';
}
