export const HANDS = ['rock', 'scissors', 'paper'] as const;
export type Hand = typeof HANDS[number];
export type LoseStage = 'illustration' | 'hiragana' | 'text' | 'speed';
export type LosePhase = 'transition' | 'read' | 'answer' | 'feedback' | 'ended';
export interface TextQuestion { id: string; question: string; text: string; opponentHand: Hand; explanation: string }
export interface LoseQuestion {
  id: string; number: number; stage: LoseStage; opponentHand: Hand; text: string; explanation: string;
}
export interface LoseFeedback {
  opponentHand: Hand; playerHand: Hand; expectedHand: Hand; reactionMs: number;
  basePoints: number; reflexPoints: number; points: number;
}
export interface LoseSnapshot {
  alive: boolean; paused: boolean; phase: LosePhase; stage: LoseStage; epoch: number;
  questionNumber: number; correct: number; speedCorrect: number; score: number; time: number;
  question: LoseQuestion | null; feedback: LoseFeedback | null;
  deadlineMs: number | null; remainingMs: number | null; answerStartedMs: number | null;
  phaseEndsMs: number | null; transitionRemainingMs: number | null; basePoints: number;
  responseLatencyTotalMs: number; responseCount: number;
}
export interface LoseInspection extends LoseSnapshot { expectedHand: Hand | null; selectedTextQuestions: TextQuestion[] }
export interface LoseResult {
  outcome: 'win' | 'draw' | 'timeout'; score: number; correct: number; speedCorrect: number; time: number;
  stage: LoseStage; question: LoseQuestion; opponentHand: Hand; playerHand: Hand | null;
  expectedHand: Hand; reactionMs: number | null; reason: string;
  responseLatencyTotalMs: number; responseCount: number; highestReflexStreak: number;
}
export type LoseEvent =
  | { type: 'phase'; phase: LosePhase; stage: LoseStage; epoch: number }
  | { type: 'question'; question: LoseQuestion; deadlineMs: number | null }
  | { type: 'correct'; score: number; correct: number; feedback: LoseFeedback }
  | { type: 'end'; result: LoseResult };
