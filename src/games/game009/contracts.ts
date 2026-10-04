export type StampColor = 'red' | 'blue';
export type StampShape = 'round' | 'square';
export type DeskKind = 'stamp' | 'paper' | 'pen' | 'clip' | 'memo' | 'calculator' | 'cup' | 'stapler';
export type StampChoice = 'clean' | 'continue';
export interface StampRequest { color: StampColor; shape: StampShape; text: string }
export interface DeskObject { id: number; kind: DeskKind; color: StampColor | null; shape: StampShape | null; rotation: number; stackCount: number; placement: number }
export interface DeskBounds { id: number; left: number; top: number; width: number; height: number }
export interface DeskLayout { width: number; height: number; bounds: DeskBounds[] }
export interface StampSnapshot {
  round: number; roundId: number; correct: number; score: number; time: number; alive: boolean;
  phase: 'searching' | 'feedback' | 'choice' | 'ended'; pending: 'cleanup' | null;
  multiplier: number; clutterLevel: number; clutterCount: number; objectCount: number;
  request: StampRequest; objects: DeskObject[]; remaining: number; deadline: number;
  lastPicked: number | null; lastPoints: number;
}
export interface StampResult {
  round: number; correct: number; score: number; time: number; multiplier: number; clutterLevel: number;
  outcome: 'wrong' | 'timeout'; reason: string; request: StampRequest; picked: DeskObject | null; matchingIds: number[];
}
export type StampEvent =
  | { type: 'correct'; objectId: number; points: number; correct: number }
  | { type: 'mistake'; objectId: number }
  | { type: 'timeout' }
  | { type: 'milestone'; milestone: 'cleanup'; correct: number }
  | { type: 'choice'; milestone: 'cleanup'; choice: StampChoice; multiplier: number; clutterLevel: number };
export interface StampInspection extends StampSnapshot { matchingIds: number[]; phaseTime: number; layout: DeskLayout | null }
export interface StampHooks {
  onUpdate: (snapshot: StampSnapshot) => void; onEnd: (result: StampResult) => void; onEvent: (event: StampEvent) => void;
}
export interface StampController {
  start: () => void; title: () => void; pick: (id: number) => boolean; choose: (choice: StampChoice) => boolean;
  pause: (value: boolean) => void; snapshot: () => StampSnapshot; inspection: () => StampInspection; destroy: () => void;
}
