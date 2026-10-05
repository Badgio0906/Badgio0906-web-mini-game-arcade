import { drawFrog } from './frogPixels';
import { VIEW_HEIGHT, WORLD_WIDTH, type Direction, type FrogSnapshot, type JumpForecast } from './types';

export type FrogPose = 'idle' | 'charge' | 'small' | 'medium' | 'large' | 'fall' | 'land' | 'wind' | 'fail';
const colors = { stone: '#789689', wood: '#ae8148', moss: '#5eaf55', crumble: '#af9d7e', cloud: '#f2fbfa', thin: '#687f67', shore: '#efd69a', star: '#cda0f4' };
export class FrogBoard {
  constructor(private readonly canvas: HTMLCanvasElement) { canvas.width = WORLD_WIDTH; canvas.height = VIEW_HEIGHT; }
  draw(s: FrogSnapshot, options: { charging?: boolean; direction?: Direction; forecast?: JumpForecast; title?: boolean } = {}): void {
    const c = this.canvas.getContext('2d'); if (!c) return;
    c.imageSmoothingEnabled = false;
    const sy = (y: number) => VIEW_HEIGHT - (y - s.cameraY);
    const upper = s.cameraY + VIEW_HEIGHT;
    const sky = upper > 1100;
    const space = s.cameraY > 1400;
    c.fillStyle = space ? '#292447' : sky ? '#a9dce5' : '#183d36'; c.fillRect(0, 0, 360, 640);
    // World-anchored masonry: rounded wet stones, moss, roots, and a tiny bucket.
    if (s.cameraY < 1000) {
      c.fillStyle = '#102f2b'; c.fillRect(0, 0, 24, 640); c.fillRect(336, 0, 24, 640);
      for (let y = Math.floor(s.cameraY / 38) * 38; y < Math.min(1000, upper + 38); y += 38) {
        for (const side of [0, 336]) {
          c.fillStyle = '#3b6251'; c.beginPath(); c.roundRect(side + 2, sy(y) - 34, 20, 31, 5); c.fill();
          c.fillStyle = '#577d65'; c.fillRect(side + 5, sy(y) - 30, 12, 3);
          if (y % 76 === 0) { c.fillStyle = '#78a84c'; c.fillRect(side + 4, sy(y) - 3, 17, 4); c.fillRect(side + 13, sy(y), 5, 8); }
        }
        c.fillStyle = '#254e41'; c.fillRect(35 + (y % 5) * 43, sy(y) - 20, 5, 9);
      }
      c.strokeStyle = '#7c663c'; c.lineWidth = 3;
      for (const side of [21, 339]) { c.beginPath(); c.moveTo(side, sy(480)); c.lineTo(side + (side < 180 ? 15 : -15), sy(430)); c.lineTo(side, sy(390)); c.stroke(); }
      c.fillStyle = '#705237'; c.fillRect(306, sy(112) - 16, 18, 16); c.fillStyle = '#b6a06c'; c.fillRect(305, sy(112) - 18, 20, 3); c.fillRect(313, sy(155), 2, 22);
      c.fillStyle = '#315e49'; c.fillRect(24, sy(0), 312, 30);
    }
    if (upper > 970) {
      const shoreline = sy(1000);
      c.fillStyle = '#43becb'; c.fillRect(24, shoreline - 23, 312, 26);
      for (let x = 25; x < 336; x += 29) { c.fillStyle = '#ecffdf'; c.fillRect(x, shoreline - 12, 17, 3); }
      c.fillStyle = '#ffe9a5'; c.fillRect(24, shoreline + 2, 312, 11);
    }
    if (sky) {
      for (let y = Math.max(1080, Math.floor(s.cameraY / 120) * 120); y < upper; y += 120) {
        if (space) {
          for (let i = 0; i < 7; i++) { const x = 26 + ((y * 7 + i * 57) % 305); c.fillStyle = i % 2 ? '#efdbad' : '#ab90d3'; c.fillRect(x, sy(y + i * 11), 3, 3); }
        } else {
          c.fillStyle = '#c9ecec'; const x = 25 + y % 207; c.fillRect(x, sy(y), 48, 7); c.fillRect(x + 11, sy(y) - 5, 28, 5);
        }
      }
    }
    for (const p of s.platforms) {
      const y = sy(p.y); if (y < -20 || y > 675 || !p.active) continue;
      c.fillStyle = '#0b2a27'; c.fillRect(Math.round(p.x) - 2, Math.round(y), p.width + 4, p.height + 3);
      c.fillStyle = colors[p.type]; c.fillRect(Math.round(p.x), Math.round(y), p.width, p.height);
      c.fillStyle = p.type === 'moss' ? '#b3d96d' : p.type === 'cloud' ? '#ffffff' : '#b2b990'; c.fillRect(p.x, y, p.width, 2);
      if (p.type === 'crumble') { c.fillStyle = '#5c534a'; for (let x = p.x + 9; x < p.x + p.width; x += 17) c.fillRect(x, y + 2, 2, 5); }
      if (p.type === 'wood') { c.fillStyle = '#755b37'; for (let x = p.x + 7; x < p.x + p.width; x += 18) c.fillRect(x, y + 4, 11, 2); }
      if (p.type === 'cloud') { c.fillStyle = '#d1e9ed'; c.fillRect(p.x + 5, y + p.height, p.width - 10, 3); }
    }
    for (const o of s.obstacles) { const y = sy(o.y); c.fillStyle = '#0d2b26'; c.fillRect(o.x, y, o.width, o.height); c.fillStyle = '#607461'; c.fillRect(o.x, y, o.width, 3); }
    // Sparse preview dots describe a chosen landing rather than offering air steering.
    if (options.forecast && s.player.grounded && !options.title) {
      c.fillStyle = '#ffdc8d'; for (const point of options.forecast.points.filter((_, i) => i % 3 === 0)) { const y = sy(point.y); if (y > 8 && y < 632) c.fillRect(Math.round(point.x) - 1, Math.round(y) - 2, 3, 3); }
    }
    if (s.activeWind) {
      const w = s.activeWind;
      c.globalAlpha = .4; c.strokeStyle = space ? '#d0c1f2' : '#fff'; c.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const x = (s.time * w.x + i * 63 + 3600) % 360; const y = 70 + i * 71; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sign(w.x) * 19, y - Math.sign(w.y) * 6); c.stroke(); } c.globalAlpha = 1;
    }
    const pose: FrogPose = options.charging ? 'charge' : s.phase === 'clear' ? 'idle' : s.phase === 'quit' ? 'fail' : s.player.landingTimer > 0 ? 'land' : s.player.grounded ? 'idle' : s.phase === 'falling' ? 'fall' : s.activeWind ? 'wind' : s.player.jumpSize;
    drawFrog(c, Math.round(s.player.x), Math.round(sy(s.player.y)), pose, options.direction || s.player.facing || 1, options.title ? 1.6 : 1.25);
    if (s.phase === 'milestone') {
      c.fillStyle = '#fcf6d4'; const x = s.player.x, y = sy(s.player.y) - 58; c.fillRect(x - 16, y, 32, 8); c.fillRect(x - 29, y - 8, 17, 6); c.fillRect(x + 12, y - 8, 17, 6); c.fillStyle = '#b17841'; c.fillRect(x + 16, y + 2, 9, 3);
      c.fillStyle = '#173d37'; c.fillRect(31, 82, 298, 75); c.fillStyle = '#f9edc8'; c.textAlign = 'center'; c.font = 'bold 18px "Arcade Rounded", sans-serif'; c.fillText('海だ！ ……あっ、鳥!?', 180, 111); c.font = '13px "Arcade Rounded", sans-serif'; c.fillText('井戸の外にも、まだ上がある。', 180, 139);
    }
    c.textAlign = 'left'; c.font = 'bold 10px monospace';
    for (let meters = Math.ceil(s.cameraY / 100) * 10; meters * 10 < upper; meters += 10) { const y = sy(meters * 10); c.fillStyle = sky ? '#365674' : '#a3b991'; c.fillRect(26, y, 9, 2); c.fillText(`${meters}m`, 38, y - 4); }
  }
}
