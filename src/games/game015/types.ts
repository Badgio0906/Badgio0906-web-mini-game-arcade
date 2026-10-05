export const WORLD_WIDTH = 256;
export const WORLD_HEIGHT = 448;
export const PIXELS_PER_METER = 16;
export const PLAYER_WIDTH = 18;
export const PLAYER_WALL_MARGIN = 12;
export const PLAYER_HEIGHT = 33;
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
export const SCROLL_START_SPEED = 18;
export const SCROLL_MAX_SPEED = 36;
export const SCROLL_ACCELERATION = 0.22;
/** Logical HUD/ceiling boundary; the king's feet must remain below it. */
export const SCROLL_TOP_LIMIT = 60;
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
export type HazardKind = 'spikes' | 'wall_needle' | 'bird';
export type HazardState = 'idle' | 'warning' | 'active' | 'cooldown';
export interface HazardSeed {
  id?: string; kind: HazardKind; x: number; y: number; width: number; height: number;
  side?: -1 | 0 | 1; amplitude?: number; period?: number; phase?: number;
}
export interface FallHazard extends HazardSeed {
  id: string; originX: number; side: -1 | 0 | 1; amplitude: number; period: number; phase: number;
  state: HazardState; age: number; warningRemaining: number; anchorPlatformId: number | null;
}
export const BIRD_WARNING_SECONDS = 1;
export const NEEDLE_WARNING_SECONDS = 0.9;
export const NEEDLE_ACTIVE_SECONDS = 0.65;
export const NEEDLE_COOLDOWN_SECONDS = 1.25;
export interface FallPlayer {
  x: number; y: number; vx: number; vy: number;
  grounded: boolean; platformId: number | null; stunRemaining: number;
}
export interface LandingReport {
  kind: LandingKind; fallDistance: number; nice: boolean; platformId: number; platformType: PlatformType; depth: number;
}
export interface FallSnapshot {
  alive: boolean; time: number; depth: number; score: number; fallDistance: number;
  niceDrops: number; heldDrop: boolean; passedPlatforms: number; cameraY: number; scrollSpeed: number; topRemaining: number; horizontal: HorizontalInput;
  phase: 'grounded' | 'falling' | 'stunned' | 'ended';
  player: FallPlayer; platforms: FallPlatform[]; hazards: FallHazard[]; lastLanding: LandingReport | null;
  danger: 'safe' | 'danger' | 'fatal';
}
export interface FallInspection extends FallSnapshot {
  fallStartY: number; ignoredPlatformId: number | null; generatedThrough: number;
  nextPlatformId: number; milestones: number[];
}
export interface FallResult {
  depth: number; score: number; time: number; niceDrops: number;
  outcome: 'impact' | 'spike' | 'needle' | 'bird' | 'scroll'; reason: string; fallDistance: number; platformType: PlatformType | null;
}
export type FallEvent =
  | { type: 'drop'; platformId: number; depth: number }
  | { type: 'landing'; landing: LandingReport }
  | { type: 'nice_drop'; count: number; landing: LandingReport }
  | { type: 'crumble'; platformId: number }
  | { type: 'milestone'; depth: 1000; message: string }
  | { type: 'hazard_warning'; hazardId: string; kind: HazardKind; seconds: number }
  | { type: 'hazard_active'; hazardId: string; kind: HazardKind }
  | { type: 'end'; result: FallResult };
export interface FallHooks {
  onUpdate: (snapshot: FallSnapshot) => void; onEvent: (event: FallEvent) => void; onEnd: (result: FallResult) => void;
}
export interface FallController {
  start: () => void; title: () => void; pause: (paused: boolean) => void;
  setHorizontal: (direction: HorizontalInput) => void; setDropHeld: (held: boolean) => void; drop: () => boolean;
  snapshot: () => FallSnapshot; inspection: () => FallInspection; destroy: () => void;
}
/** Authored courses are useful for the independent practice and geometry tests; no live state mutation. */
export interface FallOptions { course?: readonly PlatformSeed[]; hazards?: readonly HazardSeed[]; endless?: boolean; scroll?: boolean }
