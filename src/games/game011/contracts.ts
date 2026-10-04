export type QuizAnswer = 'unko' | 'ukon';
export type QuizSide = 'left' | 'right';
export type QuizPhase = 'image_answer' | 'text_intro' | 'text_read' | 'text_answer' | 'final_choice' | 'final_answer' | 'ended';
export interface QuizImage { id: string; answer: QuizAnswer; asset: string }
export interface QuizText { id: string; answer: QuizAnswer; text: string }
export interface QuizQuestion {
  id: string; kind: 'image' | 'text' | 'final'; answer: QuizAnswer; image: string | null; text: string;
}
export interface UnkoSnapshot {
  alive: boolean; phase: QuizPhase; roundId: number; time: number; score: number;
  imageCorrect: number; textCorrect: number; finalMode: QuizAnswer | null; finalStreak: number;
  question: QuizQuestion | null; choices: [QuizAnswer, QuizAnswer] | null;
  questionNumber: number; pointsPerCorrect: 100 | 200 | 500;
  deadline: number | null; remaining: number | null; answerElapsed: number;
}
export interface UnkoResult {
  score: number; time: number; imageCorrect: number; textCorrect: number;
  finalMode: QuizAnswer | null; finalStreak: number; outcome: 'wrong' | 'timeout';
  reason: string; question: QuizQuestion; expected: QuizAnswer; actual: QuizAnswer | null;
}
export type UnkoEvent =
  | { type: 'correct'; kind: QuizQuestion['kind']; points: 100 | 200 | 500; score: number }
  | { type: 'phase'; phase: QuizPhase }
  | { type: 'ready'; roundId: number }
  | { type: 'final_mode'; mode: QuizAnswer }
  | { type: 'wrong'; expected: QuizAnswer; actual: QuizAnswer }
  | { type: 'timeout'; expected: QuizAnswer };
export interface UnkoInspection extends UnkoSnapshot {
  answerSide: QuizSide | null; imageSelection: QuizImage[]; textSelection: QuizText[];
}
export interface UnkoHooks {
  onUpdate: (snapshot: UnkoSnapshot) => void; onEnd: (result: UnkoResult) => void; onEvent: (event: UnkoEvent) => void;
}
export interface UnkoController {
  start: () => void; title: () => void; input: (side: QuizSide) => boolean;
  advance: () => boolean; ready: () => boolean; chooseFinal: (mode: QuizAnswer) => boolean;
  pause: (value: boolean) => void; snapshot: () => UnkoSnapshot; inspection: () => UnkoInspection; destroy: () => void;
}
