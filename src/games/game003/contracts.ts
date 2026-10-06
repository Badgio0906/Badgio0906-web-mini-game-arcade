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
export interface SupportInterface { index: number; left: number; right: number; loadCenter: number; margin: number; instability: number }
export interface ArtPair { firstId: number; secondId: number; firstX: number; secondX: number; firstRatio: number; secondRatio: number; recoveryPixels: number; points: number }
export interface TowerSnapshot {
  rulesVersion: 2;
  artPairs: number;
  artScore: number;
  artStreak: number;
  bonusScore: number;
  foundationCenter: number;
  supportMargin: number;
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
  rulesVersion: 2;
  artPairs: number;
  artScore: number;
  bonusScore: number;
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
  | { type: 'overhang'; cargoId: number; offsetRatio: number; margin: number; weakJointIndex: number }
  | { type: 'art'; pair: ArtPair; streak: number }
  | { type: 'support_failure'; jointIndex: number; margin: number; contact: boolean }
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
  recentArtPair: ArtPair | null;
  interfaces: SupportInterface[];
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
