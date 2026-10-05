export const WORLD_WIDTH = 360;
export const VIEW_HEIGHT = 480;
export const PPM = 24;
export const GRAVITY = 720;
export const STEP = 1 / 120;
export const MAX_CHARGE_MS = 700;
export type Direction = -1 | 0 | 1;
export type ChargeBand = 'short' | 'medium' | 'long';
export type Chapter = 'well' | 'sea' | 'sky' | 'space';
export type Surface = 'stone' | 'wood' | 'moss' | 'crumble' | 'bucket' | 'cloud' | 'thin' | 'shore' | 'star';
export interface Ledge {
  id: string; x: number; y: number; width: number; surface: Surface;
  section: string; route: 'main' | 'safe' | 'shortcut' | 'catch' | 'base';
  originX: number; amplitude: number; period: number; offset: number;
  active: boolean; crumbleAt: number | null; restoreAt: number | null;
}
export interface Block { id: string; x: number; y: number; width: number; height: number }
export interface Wind { id: string; from: number; to: number; x: number; y: number; direction: 'left' | 'right' | 'up' | 'down'; strength: 'weak' | 'medium' | 'strong'; label: string }
export interface Section { id: string; from: number; to: number; name: string; motif: 'water' | 'brick' | 'roots' | 'moss' | 'wood' | 'bucket' | 'light' | 'cloud' | 'flag' | 'bird' | 'ice' | 'stars'; purpose: string }
export interface Level { id: string; goal: number; seaHeight: number | null; startX: number; startY: number; ledges: Ledge[]; blocks: Block[]; winds: Wind[]; sections: Section[] }
export interface Frog { x: number; y: number; vx: number; vy: number; width: number; height: number; grounded: boolean; ledgeId: string | null; facing: Direction; landTime: number; slipTime: number }
export interface ChargeSnapshot {
  alive: boolean; clear: boolean; levelId: string; goal: number; time: number; height: number; maxHeight: number;
  player: Frog; phase: 'grounded' | 'charging' | 'rising' | 'falling' | 'sea' | 'clear' | 'quit';
  chargeMs: number; chargeBand: ChargeBand; direction: Direction; chapter: Chapter; seaProgress: number; wellCleared: boolean;
  ledges: Ledge[]; blocks: Block[]; winds: Wind[]; sections: Section[]; section: Section | null;
  wind: Wind | null; nextWind: Wind | null; totalFall: number; falls: number; biggestFall: number; jumps: number;
  feedback: string; lastLanding: { id: string; height: number; drop: number; loss: number; success: boolean } | null;
}
export type ChargeEvent = { type: string; data: Record<string, string | number | boolean> };
export interface Forecast { chargeMs: number; direction: Direction; landing: { id: string; x: number; y: number } | null; peak: number; bump: boolean; clear: boolean; sea: boolean; duration: number }
export function powerFor(ms: number): number { return Math.max(0, Math.min(1, ms / MAX_CHARGE_MS)); }
export function bandFor(ms: number): ChargeBand { const p = powerFor(ms); return p < .28 ? 'short' : p < .76 ? 'medium' : 'long'; }
export function jumpFor(ms: number): { power: number; height: number; speed: number } {
  const power = powerFor(ms);
  return { power, height: PPM * (.2 + 8.8 * Math.pow(power, 1.4)), speed: 50 + 100 * Math.sqrt(power) };
}
export function ledge(id: string, center: number, meters: number, width: number, surface: Surface = 'stone', section = 'test', route: Ledge['route'] = 'main', amplitude = 0, period = 4): Ledge {
  return { id, x: center - width / 2, originX: center - width / 2, y: meters * PPM, width, surface, section, route, amplitude, period, offset: 0, active: true, crumbleAt: null, restoreAt: null };
}
