export const WORLD_WIDTH = 360;
export const VIEW_HEIGHT = 640;
export const PPM = 10;
export const GRAVITY = 400;
export const FIXED_STEP = 1 / 120;
export const WELL_HEIGHT = 1000;
export const SPACE_HEIGHT = 2000;
export type JumpSize = 'small' | 'medium' | 'large';
export type Direction = -1 | 0 | 1;
export type Chapter = 'well' | 'shore' | 'sky' | 'space';
export type Phase = 'grounded' | 'rising' | 'falling' | 'milestone' | 'clear' | 'quit';
export type PlatformType = 'stone' | 'wood' | 'moss' | 'crumble' | 'cloud' | 'thin' | 'shore' | 'star';
/** x is the left edge; y is the top surface, in upward-positive world pixels. */
export interface Platform { id: number; x: number; y: number; width: number; height: number; type: PlatformType; active: boolean; crumbleTimer: number; restoreTimer: number; slide: number; route: 'safe' | 'risky' | 'base' }
export interface Obstacle { id: number; x: number; y: number; width: number; height: number; type: 'ceiling' | 'wall' }
export interface WindZone { id: number; yMin: number; yMax: number; x: number; y: number; label: string }
/** y is the player's feet; width/height are collision dimensions. */
export interface FrogPlayer { x: number; y: number; vx: number; vy: number; width: number; height: number; grounded: boolean; facing: Direction; jumpSize: JumpSize; landingTimer: number; platformId: number | null }
export interface FrogSnapshot { alive: boolean; time: number; height: number; maxHeight: number; cameraY: number; chapter: Chapter; phase: Phase; cleared: boolean; player: FrogPlayer; platforms: Platform[]; obstacles: Obstacle[]; wind: WindZone[]; activeWind: WindZone | null; feedback: string; falls: number; milestoneSeen: boolean; milestoneProgress: number; practice: boolean; practiceBaseHeight: number }
export type FrogEvent = { type: 'jump'; size: JumpSize; direction: Direction; height: number } | { type: 'land'; platformId: number; height: number; drop: number } | { type: 'fall'; drop: number; height: number } | { type: 'bump'; obstacleId: number } | { type: 'milestone' | 'sky' | 'clear' | 'quit'; height: number; maxHeight: number };
export interface JumpForecast { size: JumpSize; direction: Direction; points: { x: number; y: number }[]; landing: { platformId: number; x: number; y: number } | null; maxHeight: number; milestone: boolean; cleared: boolean }
export const JUMPS: Record<JumpSize, { height: number; speed: number }> = { small: { height: 10, speed: 64 }, medium: { height: 50, speed: 104 }, large: { height: 90, speed: 140 } };
