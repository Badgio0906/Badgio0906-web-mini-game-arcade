import { allKana, normalizeKana, wordById, words, type Word } from './words';
export const RULES_VERSION = '1';
export type Outcome = 'playing' | 'correct' | 'ended';
export interface QuestionState { word_id: string; guessed: string[]; remaining: number; hintUsed: boolean; hintLetter: string | null; selections: number; outcome: Outcome; seed: number }
export interface QuestionCycle { question: QuestionState; history: string[]; seed: number }
export function nextSeed(seed: number): number { let value = seed >>> 0 || 0x6d2b79f5; value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return value >>> 0; }
export function createQuestion(word_id: string, seed: number): QuestionState {
  if (!wordById.has(word_id)) throw new Error('Unknown word');
  return { word_id, guessed: [], remaining: 8, hintUsed: false, hintLetter: null, selections: 0, outcome: 'playing', seed: seed >>> 0 };
}
export function nextQuestion(seed: number, recent: readonly string[] = []): QuestionCycle {
  let history = [...new Set(recent.filter(id => wordById.has(id)))];
  let candidates = words.filter(word => !history.includes(word.word_id));
  if (!candidates.length) { history = history.slice(-1); candidates = words.filter(word => !history.includes(word.word_id)); }
  const next = nextSeed(seed), selected = candidates[next % candidates.length];
  return { question: createQuestion(selected.word_id, next), history: [...history, selected.word_id], seed: next };
}
export function visibleLetters(state: QuestionState): (string | null)[] { return [...wordById.get(state.word_id)!.reading].map(kana => state.guessed.includes(kana) ? kana : null); }
export function wrongCount(state: QuestionState): number { return 8 - state.remaining; }
function complete(state: QuestionState): QuestionState {
  return { ...state, outcome: state.remaining === 0 ? 'ended' : visibleLetters(state).every(Boolean) ? 'correct' : 'playing' };
}
export interface GuessResult { question: QuestionState; changed: boolean; hit: boolean }
export function guess(state: QuestionState, input: string): GuessResult {
  const kana = normalizeKana(input);
  if (state.outcome !== 'playing' || !allKana.has(kana) || state.guessed.includes(kana)) return { question: state, changed: false, hit: false };
  const hit = wordById.get(state.word_id)!.reading.includes(kana);
  return { question: complete({ ...state, guessed: [...state.guessed, kana], remaining: state.remaining - Number(!hit), selections: state.selections + 1 }), changed: true, hit };
}
export function letterHint(state: QuestionState): GuessResult {
  if (state.outcome !== 'playing' || state.hintUsed) return { question: state, changed: false, hit: false };
  const hidden = [...new Set([...wordById.get(state.word_id)!.reading].filter(kana => !state.guessed.includes(kana)))];
  const seed = nextSeed(state.seed), kana = hidden[seed % hidden.length];
  if (!kana) return { question: state, changed: false, hit: false };
  return { question: complete({ ...state, guessed: [...state.guessed, kana], hintUsed: true, hintLetter: kana, seed }), changed: true, hit: true };
}
export function restoreQuestion(value: unknown): QuestionState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const q = value as QuestionState, word: Word | undefined = wordById.get(q.word_id);
  if (!word || !Array.isArray(q.guessed) || q.guessed.length > allKana.size || q.guessed.some(kana => typeof kana !== 'string' || kana !== normalizeKana(kana) || !allKana.has(kana)) || new Set(q.guessed).size !== q.guessed.length) return null;
  if (typeof q.hintUsed !== 'boolean' || (q.hintUsed ? typeof q.hintLetter !== 'string' || !q.guessed.includes(q.hintLetter) || !word.reading.includes(q.hintLetter) : q.hintLetter !== null)) return null;
  if (!Number.isInteger(q.seed) || q.seed < 0 || q.seed > 0xffffffff || !Number.isInteger(q.selections) || q.selections !== q.guessed.length - Number(q.hintUsed)) return null;
  let replayRemaining = 8; const replayGuessed: string[] = [];
  for (const kana of q.guessed) {
    if (replayRemaining === 0 || [...word.reading].every(letter => replayGuessed.includes(letter))) return null;
    replayGuessed.push(kana); if (!word.reading.includes(kana)) replayRemaining--;
  }
  const remaining = 8 - q.guessed.filter(kana => !word.reading.includes(kana)).length;
  if (remaining < 0 || q.remaining !== remaining || complete(q).outcome !== q.outcome) return null;
  return { word_id: q.word_id, guessed: [...q.guessed], remaining, hintUsed: q.hintUsed, hintLetter: q.hintLetter, selections: q.selections, seed: q.seed, outcome: q.outcome };
}
