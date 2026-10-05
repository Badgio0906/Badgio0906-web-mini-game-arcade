export type ShoeType = 'paper' | 'zori' | 'sneaker' | 'leather' | 'iron-geta';
export type Phase = 'angle' | 'angle-lock' | 'spin' | 'spin-lock' | 'power' | 'max' | 'kick' | 'flight' | 'landing' | 'result' | 'practice-complete';
export type Route = 'ground' | 'distance' | 'sky';
export type PracticeStage = 0 | 1 | 2 | 3;
export interface Vector { x: number; y: number }
export interface Inputs { angle: number; spin: number; power: number; shoeType: ShoeType }
export interface Shoe {
  id: ShoeType; name: string; nameJa: string; tagline: string; color: string;
  weight: number; aerodynamics: number; spinEfficiency: number; launchSpeed: number; gravity: number; drag: number; penetration: number; optimalSpin: number;
}
export type ObstacleType = 'fence' | 'wall' | 'vending' | 'sign' | 'truck' | 'warehouse' | 'building';
export interface Obstacle { id: number; type: ObstacleType; x: number; y: number; width: number; height: number; resistance: number; broken: boolean; time: number }
export interface Effect { type: 'impact' | 'special'; name: string; x: number; y: number; time: number; obstacleId?: number }
export interface Score { distance: number; height: number; breaks: number; spin: number; justMax: number; special: number; total: number }
export interface Result { distance: number; height: number; breaks: number; maxBreakCombo: number; spinRating: 'LOW' | 'GOOD' | 'GREAT'; powerRating: 'NORMAL' | 'PERFECT' | 'JUST MAX'; specials: string[]; score: Score; inputs: Inputs; duration: number; practice: boolean }
export interface Sample { t: number; x: number; y: number; vx: number; vy: number; rotation: number; angularVelocity: number; maxHeight: number; breaks: number }
export interface ReplayHold { name: string; physicalTime: number; start: number; end: number; x: number; y: number }
export interface Trajectory { samples: Sample[]; effects: Effect[]; obstacles: Obstacle[]; duration: number; motionDuration: number; physicalDuration: number; holds: ReplayHold[]; result: Result }
export type ShoeEvent = { type: 'phase'; phase: Phase } | { type: 'lock'; step: 'angle' | 'spin' | 'power'; value: number } | { type: 'impact'; effect: Effect } | { type: 'special'; effect: Effect } | { type: 'end'; result: Result };
export const LOCK_SECONDS = .3;
export const KICK_SECONDS = .6;
export const LANDING_SECONDS = .65;
export const JUST_MAX_SECONDS = .38;
export const FIXED_STEP = 1 / 30;
export const JUST_MAX_THRESHOLD = 99.5;
