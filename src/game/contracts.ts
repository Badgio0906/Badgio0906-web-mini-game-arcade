export type Lane = 'inner' | 'outer';
export type Difficulty = 'WARM UP' | 'EASY' | 'NORMAL' | 'HARD' | 'VERY HARD';

export interface RunSnapshot {
  time: number;
  score: number;
  combo: number;
  maxCombo: number;
  lane: Lane;
  difficulty: Difficulty;
  speed: number;
  shifting: boolean;
  alive: boolean;
}

export interface RunResult {
  score: number;
  time: number;
  maxCombo: number;
  passed: number;
  shards: number;
  nearMisses: number;
  reason: string;
}

export type GameplayEvent =
  | { type: 'shift' }
  | { type: 'shard'; points: number }
  | { type: 'near_miss'; points: number; combo: number }
  | { type: 'pass'; points: number }
  | { type: 'death' };

export interface GameHooks {
  onUpdate: (snapshot: RunSnapshot) => void;
  onGameOver: (result: RunResult) => void;
  onEvent: (event: GameplayEvent) => void;
}

export interface OrbitController {
  startRun: () => void;
  showTitle: () => void;
  shift: () => boolean;
  setPaused: (paused: boolean) => void;
  destroy: () => void;
  getSnapshot: () => RunSnapshot;
}
