import { SPACE_HEIGHT, WELL_HEIGHT, WORLD_WIDTH, type Obstacle, type Platform, type PlatformType, type WindZone } from './types';

/** Authored, repeatable climbing spine plus tempting narrow shortcuts. No random gaps. */
export function createLevel(seed = 1): { platforms: Platform[]; obstacles: Obstacle[]; wind: WindZone[] } {
  const platforms: Platform[] = [];
  const add = (center: number, y: number, width: number, type: PlatformType, route: Platform['route'], slide = 0) => platforms.push({ id: platforms.length, x: center - width / 2, y, width, height: 8, type, active: true, crumbleTimer: -1, restoreTimer: 0, slide, route });
  add(180, 0, WORLD_WIDTH - 48, 'stone', 'base');
  const centers = [100, 195, 270, 175, 85, 180, 265, 160];
  for (let row = 1, y = 38; y < WELL_HEIGHT; row++, y += 38) {
    const center = centers[(row - 1) % centers.length];
    // Stable alternatives allow retries after a temporary crumbling ledge disappears.
    const type: PlatformType = row % 7 === 0 ? 'moss' : row % 5 === 0 ? 'wood' : 'stone';
    add(center, y, row % 6 === 0 ? 70 : 82, type, 'safe', type === 'moss' ? (row % 2 ? 18 : -18) : 0);
    if (row % 3 === 0) add(center < 180 ? 286 : 74, y + 15, 38, row % 2 ? 'crumble' : 'thin', 'risky');
  }
  add(180, WELL_HEIGHT, 172, 'shore', 'base');
  for (let row = 1, y = WELL_HEIGHT + 36; y < SPACE_HEIGHT; row++, y += 36) {
    const center = [100, 200, 265, 170, 90, 185, 260, 150][(row - 1) % 8];
    add(center, y, row % 6 === 0 ? 72 : 88, 'cloud', 'safe');
    if (row % 4 === 0) add(center < 180 ? 285 : 72, y + 16, 36, 'crumble', 'risky');
  }
  add(180, SPACE_HEIGHT, 190, 'star', 'base');
  // Solid protrusions live beside the safe spine, and catch oversize detours.
  const obstacles: Obstacle[] = [
    { id: 0, x: 24, y: 265, width: 36, height: 16, type: 'ceiling' },
    { id: 1, x: 306, y: 490, width: 30, height: 28, type: 'wall' },
    { id: 2, x: 24, y: 720, width: 35, height: 14, type: 'ceiling' },
    { id: 3, x: 305, y: 905, width: 31, height: 32, type: 'wall' },
  ];
  const sign = (Math.abs(Math.trunc(Number.isFinite(seed) ? seed : 1)) % 2) ? 1 : -1;
  const wind: WindZone[] = Array.from({ length: 10 }, (_, i) => {
    const x = sign * (i % 2 ? -1 : 1) * (i % 3 === 0 ? 42 : 22);
    const y = i % 4 === 1 ? 65 : i % 4 === 3 ? -45 : 0;
    return { id: i, yMin: WELL_HEIGHT + i * 100, yMax: WELL_HEIGHT + (i + 1) * 100, x, y, label: `${x > 0 ? '右' : '左'}風${Math.abs(x) > 30 ? '・強' : '・弱'}${y > 0 ? ' ＋吹き上げ' : y < 0 ? ' ＋吹き下ろし' : ''}` };
  });
  return { platforms, obstacles, wind };
}
