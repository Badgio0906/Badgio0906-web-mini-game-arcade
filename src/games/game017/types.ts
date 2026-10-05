export interface Point { x: number; z: number }
export interface Rain extends Point { id: number; height: number; fallSpeed: number; timeToImpact: number; impact: Point; radius: number; dangerous: boolean }
export interface Scene { rain: Rain[]; wind: Point; safeRoute: Point[]; attempts: number; rejected: number; fallback: boolean }
export type Phase = 'warning' | 'rain' | 'rise' | 'plan' | 'lower' | 'dash' | 'clear' | 'over';
export const WORLD = { width: 1000, depth: 600 } as const;
export const START: Readonly<Point> = Object.freeze({ x: 70, z: 300 });
export const GOAL: Readonly<Point> = Object.freeze({ x: 930, z: 300 });
export const GOAL_RADIUS = { x: 30, z: 65 } as const;
export const PLAYER_RADIUS = 8;
export const DASH_SECONDS = 1.4;
export const CAMERA_SECONDS = .55;
export const PLAN_SECONDS = 5;
export interface Result { reason: 'rain' | 'activation' | 'unfinished'; score: number; round: number; streak: number; time: number; collision: Point | null }
export type RainEvent = { type: 'phase'; phase: Phase } | { type: 'clear'; points: number; closeCalls: number; score: number; round: number } | { type: 'end'; result: Result };
