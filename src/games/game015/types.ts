export const WORLD_WIDTH = 256;
export const WORLD_HEIGHT = 448;
export const PIXELS_PER_METER = 16;
export const PLAYER_WIDTH = 12;
export const PLAYER_HEIGHT = 22;
export const GRAVITY = 180;
export const TERMINAL_VELOCITY = 145;
export const MAX_HORIZONTAL_SPEED = 90;
export const AIR_ACCELERATION = 230;
export const AIR_DRAG = 0.5;
export const GROUND_ACCELERATION = 360;
export const GROUND_DRAG = 12;
export const SAFE_FALL_METERS = 6;
export const FATAL_FALL_METERS = 9;
export const SOFT_SAFE_METERS = 9;
export const SOFT_FATAL_METERS = 12;
export const CRUMBLE_SECONDS = 1.25;
export const HARD_STUN_SECONDS = 0.32;
export type HorizontalInput = -1 | 0 | 1;
export type PlatformType = 'normal' | 'soft' | 'crumble' | 'moving';
export type LandingKind = 'safe' | 'hard' | 'fatal';
export interface PlatformSeed {
  x: number; y: number; width: number; type: PlatformType;
  route?: boolean; pattern?: string; amplitude?: number; period?: number; phase?: number;
}
export interface FallPlatform extends PlatformSeed {
  id: number; originX: number; height: number; route: boolean; pattern: string;
  amplitude: number; period: number; phase: number; crumbleAge: number | null; gone: boolean;
}
export interface FallPlayer {
  x: number; y: number; vx: number; vy: number;
  grounded: boolean; platformId: number | null; stunRemaining: number;
}
export interface LandingReport {
  kind: LandingKind; fallDistance: number; nice: boolean; platformId: number; platformType: PlatformType; depth: number;
}
export interface FallSnapshot {
  alive: boolean; time: number; depth: number; score: number; fallDistance: number;
  niceDrops: number; cameraY: number; horizontal: HorizontalInput;
  phase: 'grounded' | 'falling' | 'stunned' | 'ended';
  player: FallPlayer; platforms: FallPlatform[]; lastLanding: LandingReport | null;
  danger: 'safe' | 'danger' | 'fatal';
}
export interface FallInspection extends FallSnapshot {
  fallStartY: number; ignoredPlatformId: number | null; generatedThrough: number;
  nextPlatformId: number; milestones: number[];
}
export interface FallResult {
  depth: number; score: number; time: number; niceDrops: number;
  outcome: 'impact'; reason: string; fallDistance: number; platformType: PlatformType | null;
}
export type FallEvent =
  | { type: 'drop'; platformId: number; depth: number }
  | { type: 'landing'; landing: LandingReport }
  | { type: 'nice_drop'; count: number; landing: LandingReport }
  | { type: 'crumble'; platformId: number }
  | { type: 'milestone'; depth: 1000; message: string }
  | { type: 'end'; result: FallResult };
export interface FallHooks {
  onUpdate: (snapshot: FallSnapshot) => void; onEvent: (event: FallEvent) => void; onEnd: (result: FallResult) => void;
}
export interface FallController {
  start: () => void; title: () => void; pause: (paused: boolean) => void;
  setHorizontal: (direction: HorizontalInput) => void; drop: () => boolean;
  snapshot: () => FallSnapshot; inspection: () => FallInspection; destroy: () => void;
}
/** Authored courses are useful for the independent practice and geometry tests; no live state mutation. */
export interface FallOptions { course?: readonly PlatformSeed[]; endless?: boolean }
