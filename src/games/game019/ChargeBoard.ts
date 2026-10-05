import { drawFrog, type FrogPose } from './frogPixels';
import { MAX_CHARGE_MS, PPM, VIEW_HEIGHT, WORLD_WIDTH, type ChargeSnapshot, type Section } from './chargeTypes';

const surfaceColors = { stone: '#91a58b', wood: '#c39756', moss: '#73bc58', crumble: '#bd9970', bucket: '#b18d56', cloud: '#eaf7ef', thin: '#95a99b', shore: '#f4d999', star: '#dbbeed' };
/** Authored world art follows the same coordinates as collisions; no trajectory prediction. */
export class ChargeBoard {
  private camera = 0;
  constructor(private readonly canvas: HTMLCanvasElement) { canvas.width = WORLD_WIDTH; canvas.height = VIEW_HEIGHT; }
  draw(s: ChargeSnapshot, options: { dt?: number; peek?: boolean; practice?: boolean; title?: boolean } = {}): void {
    const c = this.canvas.getContext('2d'); if (!c) return;
    const target = Math.max(0, s.player.y - (options.peek && s.player.grounded ? 350 : 125));
    this.camera += (target - this.camera) * (1 - Math.exp(-Math.max(0, options.dt ?? 1 / 60) * (s.phase === 'falling' ? 13 : 8)));
    const camera = Math.round(this.camera), upper = camera + VIEW_HEIGHT;
    const sy = (y: number) => Math.round(VIEW_HEIGHT - (y - camera));
    c.imageSmoothingEnabled = false;
    // Each horizontal pixel band is world-anchored: light rises toward the real exit.
    for (let y = 0; y < VIEW_HEIGHT; y += 8) {
      const meters = (camera + VIEW_HEIGHT - y) / PPM;
      c.fillStyle = meters >= 172 ? '#252840' : meters >= 155 ? '#53859c' : meters >= 100 ? '#9cd7e0' : meters >= 91 ? '#437568' : meters >= 72 ? '#2d5546' : meters >= 35 ? '#22473b' : '#173a31';
      c.fillRect(0, y, WORLD_WIDTH, 8);
    }
    if (camera < 100 * PPM) {
      c.fillStyle = '#0f2a23'; c.fillRect(0, Math.max(0, sy(100 * PPM)), 24, VIEW_HEIGHT); c.fillRect(336, Math.max(0, sy(100 * PPM)), 24, VIEW_HEIGHT);
      for (let y = Math.floor(camera / 36) * 36; y < Math.min(100 * PPM, upper + 36); y += 36) {
        for (const x of [2, 338]) { c.fillStyle = '#3b5b45'; c.fillRect(x, sy(y) - 33, 20, 31); c.fillStyle = '#62795e'; c.fillRect(x + 2, sy(y) - 32, 15, 2); }
      }
    }
    for (const section of s.sections) if (section.from * PPM < upper && section.to * PPM > camera) this.motif(c, section, sy, s.time);
    if (upper >= 99 * PPM && camera < 103 * PPM) {
      const sea = sy(100 * PPM); c.fillStyle = '#35aebc'; c.fillRect(24, sea - 21, 312, 23);
      c.fillStyle = '#d7fff0'; for (let x = 28; x < 330; x += 35) c.fillRect(x, sea - 12 + (Math.floor(s.time * 2) % 2), 19, 2);
      c.fillStyle = '#efd795'; c.fillRect(24, sea + 2, 312, 8);
      // Exit light forms a readable opening before the final jump.
      c.fillStyle = '#d8eee0'; c.fillRect(24, sea - 67, 13, 46); c.fillRect(323, sea - 67, 13, 46);
    }
    for (const w of s.winds) {
      const a = Math.max(w.from * PPM, camera), b = Math.min(w.to * PPM, upper); if (a >= b) continue;
      const y = sy(a) - Math.min(28, Math.round((b - a) / 2));
      c.fillStyle = '#557a84'; c.fillRect(30, y - 17, 2, 28);
      const left = w.direction === 'left', vertical = w.direction === 'up' || w.direction === 'down';
      c.fillStyle = w.strength === 'strong' ? '#e7a669' : w.strength === 'medium' ? '#f0cf85' : '#f2e7b9';
      c.fillRect(left ? 18 : 32, y - 17, w.strength === 'strong' ? 17 : 11, 8);
      c.fillStyle = '#426877';
      if (vertical) { c.fillRect(36, y - 16, 2, 6); c.fillRect(w.direction === 'up' ? 35 : 34, w.direction === 'up' ? y - 17 : y - 10, 4, 2); }
      else c.fillRect(left ? 20 : 39, y - 15, 3, 3);
      // Stable spatial belts, moving environmental lines: no random weather state.
      c.save(); c.beginPath(); c.rect(24, sy(b), 312, b - a); c.clip(); c.globalAlpha = .42;
      c.fillStyle = '#eefaf0';
      for (let i = 0; i < 5; i++) {
        const px = 28 + ((i * 71 + s.time * w.x * .6 + 100000) % 302);
        const py = sy(a) - 16 - i * 33 + Math.round(s.time * w.y * .12) % 24;
        c.fillRect(Math.round(px), Math.round(py), Math.abs(w.x) > 0 ? w.strength === 'strong' ? 23 : 12 : 2, Math.abs(w.x) > 0 ? 2 : 14);
      }
      c.restore();
    }
    for (const l of s.ledges) {
      const y = sy(l.y), x = Math.round(l.x), width = Math.round(l.width); if (!l.active || y < -24 || y > VIEW_HEIGHT + 30) continue;
      c.fillStyle = '#0b2924'; c.fillRect(x - 2, y, width + 4, 11);
      c.fillStyle = surfaceColors[l.surface]; c.fillRect(x, y, width, 7);
      c.fillStyle = l.route === 'shortcut' ? '#edc783' : l.route === 'catch' || l.route === 'safe' ? '#c5dfa8' : l.surface === 'cloud' ? '#fff' : '#e1d8b6'; c.fillRect(x, y, width, 2);
      if (l.surface === 'crumble') { c.fillStyle = '#675242'; for (let a = 8; a < width; a += 14) c.fillRect(x + a, y + 2, 3, 5); }
      if (l.surface === 'wood') { c.fillStyle = '#795b39'; for (let a = 5; a < width; a += 19) c.fillRect(x + a, y + 4, 13, 2); }
      if (l.surface === 'moss') { c.fillStyle = '#3c863d'; for (let a = 5; a < width; a += 11) c.fillRect(x + a, y + 4, 5, 5); }
      if (l.route === 'catch') { c.fillStyle = '#668e61'; c.fillRect(x + 3, y + 10, 4, 12); c.fillRect(x + width - 7, y + 10, 4, 12); }
      if (l.surface === 'cloud') { c.fillStyle = '#c0dce0'; c.fillRect(x + 4, y + 7, Math.max(1, width - 8), 3); }
      if (l.surface === 'bucket') { c.fillStyle = '#6e4f2e'; c.fillRect(x + 3, y + 7, width - 6, 17); c.fillStyle = '#d9bf84'; c.fillRect(x + Math.floor(width / 2), y - 49, 2, 47); c.fillRect(x + 6, y + 10, width - 12, 2); }
      if (l.surface === 'star') { c.fillStyle = '#faf0ad'; c.fillRect(x + Math.floor(width / 2) - 3, y - 5, 6, 6); }
    }
    // b.y is its physical top. Positive canvas height extends down to b.y-b.height.
    for (const b of s.blocks) {
      const y = sy(b.y), x = Math.round(b.x), height = Math.round(b.height), width = Math.round(b.width);
      c.fillStyle = '#112c25'; c.fillRect(x, y, width, height); c.fillStyle = '#8e7445'; c.fillRect(x, y, width, 3); c.fillStyle = '#bd9e63'; c.fillRect(x, y + height - 3, width, 3);
      c.fillStyle = '#4b3d2b'; for (let a = 10; a < width; a += 26) c.fillRect(x + a, y + 4, 2, Math.max(1, height - 7));
    }
    c.font = '9px monospace'; c.textAlign = 'left';
    for (let m = Math.ceil(camera / PPM / 5) * 5; m * PPM < upper; m += 5) { c.fillStyle = m >= 100 ? '#375a70' : '#a2b397'; c.fillRect(25, sy(m * PPM), 5, 1); c.fillText(`${m}m`, 33, sy(m * PPM) - 3); }
    const facing = s.player.facing || 1;
    const pose: FrogPose = s.phase === 'charging' ? s.chargeBand === 'short' ? 'charge1' : s.chargeBand === 'medium' ? 'charge2' : 'charge-max' : s.clear ? 'clear' : s.player.slipTime > 0 ? 'slip' : s.player.landTime > 0 ? 'land' : s.player.grounded ? 'idle' : s.phase === 'falling' ? 'fall' : s.wind?.direction === 'left' ? 'wind-left' : s.wind?.direction === 'right' ? 'wind-right' : Math.abs(s.player.vx) < 1 ? 'jump-up' : s.player.vx < 0 ? 'jump-left' : 'jump-right';
    const x = Math.round(s.player.x), y = sy(s.player.y);
    drawFrog(c, x, y, pose, s.phase === 'charging' ? s.direction || facing : facing, options.title ? 2 : 1);
    if (s.phase === 'charging' && s.chargeBand === 'long') { c.fillStyle = '#c8eb8b'; c.fillRect(x - 20, y - 8, 2, 3); c.fillRect(x + 19, y - 11, 2, 3); }
    if (options.practice && s.phase === 'charging') { c.fillStyle = '#0b2923'; c.fillRect(x - 23, y - 40, 46, 6); c.fillStyle = '#d1e77a'; c.fillRect(x - 22, y - 39, Math.round(s.chargeMs / MAX_CHARGE_MS * 44), 4); }
    if (s.phase === 'sea') {
      const birdX = x, birdY = y - 36, flap = Math.floor(s.seaProgress * 12) % 2;
      c.fillStyle = '#34516a'; c.fillRect(birdX - 17, birdY - 2, 36, 13); c.fillStyle = '#fff7d7'; c.fillRect(birdX - 15, birdY, 32, 8);
      c.fillRect(birdX - 34, birdY - (flap ? 8 : 2), 20, 6); c.fillRect(birdX + 14, birdY - (flap ? 8 : 2), 20, 6); c.fillStyle = '#dfa34e'; c.fillRect(birdX + 16, birdY + 3, 10, 4); c.fillStyle = '#0c2930'; c.fillRect(birdX + 12, birdY + 1, 2, 2);
      c.fillStyle = '#daaa58'; c.fillRect(x - 3, birdY + 10, 2, 12); c.fillRect(x + 3, birdY + 10, 2, 12);
    }
    if (!options.title) this.overview(c, s);
    if (options.peek && s.player.grounded) { c.fillStyle = '#e0e5ad'; c.font = '10px monospace'; c.fillText('LOOKING DOWN', 118, 17); }
  }
  private motif(c: CanvasRenderingContext2D, section: Section, sy: (y: number) => number, time: number): void {
    const centerY = (section.from + section.to) * .5 * PPM, y = sy(centerY);
    c.save(); c.beginPath(); c.rect(24, sy(section.to * PPM), 312, (section.to - section.from) * PPM); c.clip();
    // Decoration remains low-contrast and against walls, separate from solid ledges.
    if (section.motif === 'water') { c.fillStyle = '#306558'; for (let i = 0; i < 5; i++) c.fillRect(29 + i * 61, y + (i % 3) * 20, 3, 8); }
    if (section.motif === 'brick') { c.fillStyle = '#4d5340'; for (const x of [28, 311]) for (let i = 0; i < 4; i++) { c.fillRect(x, y - 34 + i * 17, 19, 12); c.fillStyle = '#25392d'; c.fillRect(x + 8, y - 32 + i * 17, 2, 8); c.fillStyle = '#4d5340'; } }
    if (section.motif === 'roots') { c.fillStyle = '#615a35'; for (const x of [27, 324]) for (let i = 0; i < 6; i++) { c.fillRect(x + (i % 3) * (x < 180 ? 4 : -4), y - 50 + i * 13, 3, 18); c.fillRect(x + (i % 3) * (x < 180 ? 4 : -4) + (x < 180 ? 3 : -7), y - 44 + i * 13, 7, 2); } }
    if (section.motif === 'moss') { c.fillStyle = '#406936'; for (const x of [25, 322]) { c.fillRect(x, y - 55, 13, 83); for (let i = 0; i < 7; i++) c.fillRect(x + (i % 3) * 3, y + 25 + i * 4, 4, 11); } }
    if (section.motif === 'wood' || section.motif === 'bucket') { c.fillStyle = '#535137'; c.fillRect(26, y - 30, 9, 55); c.fillRect(325, y - 30, 9, 55); if (section.motif === 'bucket') { c.fillStyle = '#736746'; c.fillRect(34, y - 69, 13, 13); c.fillStyle = '#98805a'; c.fillRect(38, y - 65, 5, 5); } }
    if (section.motif === 'light') { c.fillStyle = '#627d53'; for (let i = 0; i < 4; i++) c.fillRect(48 + i * 68, y - 58, 8, 74); c.fillStyle = '#5b7847'; c.fillRect(25, y - 33, 15, 8); c.fillRect(320, y - 6, 15, 8); }
    if (['cloud', 'flag', 'bird', 'ice', 'stars'].includes(section.motif)) {
      for (let i = 0; i < 4; i++) { const x = 48 + (i * 73 + Math.floor(time * 3)) % 240, py = y - 40 + i * 29;
        if (section.motif === 'stars') { c.fillStyle = '#c8bd94'; c.fillRect(x, py, 2, 6); c.fillRect(x - 2, py + 2, 6, 2); }
        else if (section.motif === 'ice') { c.fillStyle = '#b7dce2'; c.fillRect(x, py, 3, 9); c.fillRect(x - 3, py + 3, 9, 3); }
        else if (section.motif === 'bird') { c.fillStyle = '#7fabbb'; c.fillRect(x, py, 8, 2); c.fillRect(x - 3, py - 2, 4, 2); c.fillRect(x + 7, py - 2, 4, 2); }
        else { c.fillStyle = '#bbdfe4'; c.fillRect(x, py, 24, 5); c.fillRect(x + 5, py - 3, 14, 3); }
      }
    }
    c.restore();
  }
  private overview(c: CanvasRenderingContext2D, s: ChargeSnapshot): void {
    // A schematic of physical catch shelves, not a checkpoint or a landing forecast.
    const x = 342, top = 56, height = 280, max = Math.max(20, s.goal);
    const y = (meters: number) => Math.round(top + height * (1 - Math.max(0, Math.min(max, meters)) / max));
    c.fillStyle = '#17382f'; c.fillRect(x - 2, top - 9, 19, height + 17); c.fillStyle = '#668878'; c.fillRect(x + 7, top, 1, height);
    for (const l of s.ledges.filter(l => l.active && (l.route === 'catch' || l.route === 'base'))) { c.fillStyle = '#abd894'; c.fillRect(x + Math.round(l.x / WORLD_WIDTH * 14), y(l.y / PPM), Math.max(2, Math.round(l.width / WORLD_WIDTH * 14)), 2); }
    c.fillStyle = '#fff0a8'; c.fillRect(x + Math.round(s.player.x / WORLD_WIDTH * 14) - 1, y(s.height) - 1, 3, 3);
    c.fillStyle = '#bfd4bb'; c.font = '8px monospace'; c.fillText('TOP', x - 2, top - 3); c.fillText('0', x + 6, top + height + 10);
    const catchLedge = s.ledges.filter(l => l.active && l.y < s.player.y - PPM && (l.route === 'catch' || l.route === 'base')).sort((a, b) => b.y - a.y)[0];
    if (catchLedge && s.player.grounded) { c.fillStyle = '#142f29'; c.fillRect(32, 459, 166, 15); c.fillStyle = '#d3e1b8'; c.font = '9px monospace'; c.fillText(`SHELF ${Math.round(catchLedge.y / PPM)}m / DOWN ${(s.height - catchLedge.y / PPM).toFixed(1)}m`, 37, 470); }
  }
  resetCamera(y = 0): void { this.camera = Math.max(0, y - 125); }
}
