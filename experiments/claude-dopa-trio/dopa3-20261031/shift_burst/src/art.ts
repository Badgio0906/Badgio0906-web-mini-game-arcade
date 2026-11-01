// Procedural (code-drawn) sprites — NOT ImageGen. Art status: BLOCKED_ART (no approved ImageGen in session).
export const COPPER = '#b8643a';
export const CREAM = '#f6ead2';
export const TURQ = '#2fe0c8';
export const BRASS = '#d9a441';

export interface Sprites { bg: HTMLCanvasElement; armor: HTMLCanvasElement; armorBroken: HTMLCanvasElement; core: HTMLCanvasElement; cannon: HTMLCanvasElement; gear: HTMLCanvasElement; gunner: HTMLCanvasElement; gunnerWin: HTMLCanvasElement }

function canvas(w: number, h: number, scale: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
  const g = c.getContext('2d')!; g.scale(scale, scale);
  return [c, g];
}

function bg(scale: number) {
  const [c, g] = canvas(480, 480, scale);
  const grad = g.createLinearGradient(0, 0, 0, 480);
  grad.addColorStop(0, '#3a1f17'); grad.addColorStop(0.6, '#4d2a1c'); grad.addColorStop(1, '#2a1610');
  g.fillStyle = grad; g.fillRect(0, 0, 480, 480);
  g.strokeStyle = 'rgba(217,164,65,0.12)'; g.lineWidth = 2;
  for (let x = 0; x < 480; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 480); g.stroke(); }
  // rivet rails
  g.fillStyle = 'rgba(246,234,210,0.15)';
  for (let x = 12; x < 480; x += 32) { g.beginPath(); g.arc(x, 52, 2, 0, Math.PI * 2); g.arc(x, 312, 2, 0, Math.PI * 2); g.fill(); }
  return c;
}

function armor(scale: number, broken: boolean) {
  const [c, g] = canvas(72, 62, scale);
  if (broken) {
    g.strokeStyle = 'rgba(246,234,210,0.25)'; g.setLineDash([4, 4]); g.lineWidth = 2; g.strokeRect(4, 4, 64, 54);
    g.fillStyle = 'rgba(184,100,58,0.35)';
    g.beginPath(); g.moveTo(6, 58); g.lineTo(18, 46); g.lineTo(28, 58); g.fill();
    g.beginPath(); g.moveTo(50, 58); g.lineTo(60, 50); g.lineTo(66, 58); g.fill();
    return c;
  }
  const grad = g.createLinearGradient(0, 0, 0, 62);
  grad.addColorStop(0, '#d98a5a'); grad.addColorStop(0.5, COPPER); grad.addColorStop(1, '#7a3d22');
  g.fillStyle = grad; g.fillRect(3, 3, 66, 56);
  g.strokeStyle = '#4a2214'; g.lineWidth = 3; g.strokeRect(3, 3, 66, 56);
  g.strokeStyle = 'rgba(255,230,200,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(8, 10); g.lineTo(64, 10); g.stroke();
  g.fillStyle = BRASS; for (const [x, y] of [[10, 52], [62, 52], [10, 16], [62, 16]]) { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = 'rgba(74,34,20,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, 34); g.lineTo(58, 34); g.stroke();
  return c;
}

function core(scale: number) {
  const [c, g] = canvas(72, 62, scale);
  g.fillStyle = '#2b3b3a'; g.fillRect(3, 3, 66, 56);
  g.strokeStyle = BRASS; g.lineWidth = 3; g.strokeRect(3, 3, 66, 56);
  const glow = g.createRadialGradient(36, 31, 2, 36, 31, 26);
  glow.addColorStop(0, '#e9fffb'); glow.addColorStop(0.35, TURQ); glow.addColorStop(1, 'rgba(47,224,200,0)');
  g.fillStyle = glow; g.beginPath(); g.arc(36, 31, 26, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#e9fffb'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(36, 15); g.lineTo(50, 31); g.lineTo(36, 47); g.lineTo(22, 31); g.closePath(); g.stroke();
  return c;
}

function cannon(scale: number) {
  const [c, g] = canvas(64, 70, scale);
  g.fillStyle = '#5b3424'; g.fillRect(8, 44, 48, 22);
  g.fillStyle = BRASS; g.fillRect(4, 40, 56, 8);
  const grad = g.createLinearGradient(20, 0, 44, 0);
  grad.addColorStop(0, '#8f4a2b'); grad.addColorStop(0.5, '#e9a77a'); grad.addColorStop(1, '#8f4a2b');
  g.fillStyle = grad; g.fillRect(22, 6, 20, 38);
  g.fillStyle = BRASS; g.fillRect(19, 2, 26, 8);
  g.fillStyle = TURQ; g.fillRect(28, 0, 8, 4);
  return c;
}

function gear(scale: number) {
  const [c, g] = canvas(28, 28, scale);
  g.translate(14, 14); g.fillStyle = BRASS;
  for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.fillRect(-3, -13, 6, 6); }
  g.beginPath(); g.arc(0, 0, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#4a2214'; g.beginPath(); g.arc(0, 0, 3.5, 0, Math.PI * 2); g.fill();
  return c;
}

function gunner(scale: number, win: boolean) {
  const [c, g] = canvas(96, 96, scale);
  // cream uniform with copper trim
  g.fillStyle = CREAM; g.beginPath(); g.moveTo(10, 96); g.quadraticCurveTo(14, 62, 48, 60); g.quadraticCurveTo(82, 62, 86, 96); g.fill();
  g.strokeStyle = COPPER; g.lineWidth = 4; g.beginPath(); g.moveTo(48, 62); g.lineTo(48, 96); g.stroke();
  g.fillStyle = COPPER; g.fillRect(18, 74, 60, 5);
  g.fillStyle = '#f0c7a4'; g.fillRect(42, 50, 12, 12); g.beginPath(); g.ellipse(48, 38, 16, 18, 0, 0, Math.PI * 2); g.fill();
  // copper-red ponytail + cap
  g.fillStyle = '#9b3b22';
  g.beginPath(); g.moveTo(32, 40); g.quadraticCurveTo(30, 16, 50, 17); g.quadraticCurveTo(68, 18, 65, 40); g.quadraticCurveTo(60, 27, 48, 27); g.quadraticCurveTo(38, 27, 35, 44); g.fill();
  g.beginPath(); g.ellipse(70, 34, 7, 14, -0.4, 0, Math.PI * 2); g.fill();
  g.fillStyle = CREAM; g.fillRect(32, 16, 34, 7); g.fillStyle = TURQ; g.fillRect(45, 15, 8, 9);
  g.strokeStyle = '#3a1a10'; g.lineWidth = 2; g.lineCap = 'round';
  if (win) {
    g.beginPath(); g.moveTo(39, 38); g.lineTo(45, 37); g.stroke();
    g.beginPath(); g.moveTo(51, 36); g.quadraticCurveTo(54, 33, 57, 36); g.stroke();
    g.beginPath(); g.moveTo(42, 45); g.quadraticCurveTo(48, 51, 55, 45); g.stroke();
  } else {
    g.fillStyle = '#3a1a10'; g.beginPath(); g.ellipse(42, 38, 2, 3, 0, 0, Math.PI * 2); g.ellipse(54, 38, 2, 3, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(45, 47); g.lineTo(51, 46); g.stroke();
  }
  return c;
}

export function buildSprites(scale: number): Sprites {
  return { bg: bg(scale), armor: armor(scale, false), armorBroken: armor(scale, true), core: core(scale), cannon: cannon(scale), gear: gear(scale), gunner: gunner(scale, false), gunnerWin: gunner(scale, true) };
}
