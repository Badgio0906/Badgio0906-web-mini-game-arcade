export type SortSide = 'left' | 'right';
export type SortDimension = 'shape' | 'brightness' | 'size' | 'symbol';
export type SortPhase = 'sorting' | 'dispatch' | 'rule_change' | 'ended';
export interface SortParcel {
  id: number;
  shape: 'round' | 'angular';
  brightness: 'light' | 'dark';
  size: 'small' | 'large';
  symbol: 'circle' | 'cross';
}
export interface SortRule {
  dimension: SortDimension;
  inverted: boolean;
  label: string;
  leftLabel: string;
  rightLabel: string;
}
export interface SortSnapshot {
  sorted: number;
  combo: number;
  time: number;
  phase: SortPhase;
  alive: boolean;
  rule: SortRule;
  ruleChanges: number;
  parcel: SortParcel | null;
  remaining: number;
  decisionSeconds: number;
  lastSide: SortSide | null;
}
export interface SortResult {
  sorted: number;
  combo: number;
  time: number;
  ruleChanges: number;
  outcome: 'wrong' | 'timeout';
  expectedSide: SortSide;
  actualSide: SortSide | null;
  parcel: SortParcel;
  rule: SortRule;
  correctSummary: string;
  reason: string;
}
export type SortEvent =
  | { type: 'correct'; combo: number; side: SortSide }
  | { type: 'rule_change'; rule: SortRule; count: number }
  | { type: 'mistake'; expected: SortSide; actual: SortSide }
  | { type: 'timeout'; expected: SortSide };
export interface SortInspection extends SortSnapshot { expectedSide: SortSide | null; phaseRemaining: number }
export interface SortHooks {
  onUpdate: (snapshot: SortSnapshot) => void;
  onEnd: (result: SortResult) => void;
  onEvent: (event: SortEvent) => void;
}
export interface SortController {
  start: () => void;
  title: () => void;
  input: (side: SortSide) => boolean;
  pause: (value: boolean) => void;
  snapshot: () => SortSnapshot;
  inspection: () => SortInspection;
  destroy: () => void;
}
