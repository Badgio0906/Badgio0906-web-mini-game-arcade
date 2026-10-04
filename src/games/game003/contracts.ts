export type TowerPhase = 'hanging' | 'falling' | 'settling' | 'ended';
export type TowerOutcome = 'fall' | 'collapse';
export type TowerChoice = 'normal' | 'challenge';
export type TowerMode = 'normal' | 'challenge';
export interface CargoPose {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  mass: number;
  rotation: number;
  vx: number;
  vy: number;
}
export interface Foundation { x: number; y: number; width: number; height: number }
export interface AcceptedLanding {
  x: number;
  width: number;
  height: number;
  overlapRatio: number;
  loadCenter: number;
  supportMargin: number;
  perfect: boolean;
}
export interface TowerSnapshot {
  floors: number;
  height: number;
  time: number;
  pending: 'height15' | null;
  cMode: boolean;
  mode: TowerMode;
  speedMultiplier: 1 | 2;
  perfectMultiplier: 1 | 3;
  perfectCount: number;
  combo: number;
  maxCombo: number;
  precisionScore: number;
  alive: boolean;
  phase: TowerPhase;
  instability: number;
  outcome: TowerOutcome | null;
}
export interface TowerResult {
  floors: number;
  height: number;
  time: number;
  cMode: boolean;
  mode: TowerMode;
  speedMultiplier: 1 | 2;
  perfectMultiplier: 1 | 3;
  perfectCount: number;
  maxCombo: number;
  precisionScore: number;
  reason: string;
  outcome: TowerOutcome;
}
export type TowerEvent =
  | { type: 'release' }
  | { type: 'land'; floors: number }
  | { type: 'perfect'; combo: number; points: number }
  | { type: 'danger'; instability: number }
  | { type: 'collapse'; reason: TowerOutcome }
  | { type: 'milestone'; milestone: 'height15' }
  | { type: 'choice'; milestone: 'height15'; choice: TowerChoice };
export interface TowerInspection extends TowerSnapshot {
  cargo: CargoPose | null;
  stack: CargoPose[];
  foundation: Foundation;
  topCenter: number;
  topY: number;
  support: { left: number; right: number };
  supportY: number;
  loadCenter: number;
  weakJointIndex: number;
  recentlyAccepted: AcceptedLanding | null;
}
export interface TowerHooks {
  onUpdate: (snapshot: TowerSnapshot) => void;
  onEnd: (result: TowerResult) => void;
  onEvent: (event: TowerEvent) => void;
}
export interface TowerController {
  start: () => void;
  title: () => void;
  drop: () => boolean;
  choose: (choice: TowerChoice) => boolean;
  pause: (value: boolean) => void;
  snapshot: () => TowerSnapshot;
  inspection: () => TowerInspection;
  destroy: () => void;
}
