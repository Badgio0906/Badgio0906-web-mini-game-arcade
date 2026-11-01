// Procedural (code-drawn) sprites. These are NOT ImageGen assets: ImageGen was unavailable in the
// production session, so art status is BLOCKED_ART and these are labelled placeholder-grade art.
const NAVY = '#1f2f6b';
const CYAN = '#38e0ff';
const GOLD = '#ffc531';

export interface Sprites {
  bg: HTMLCanvasElement;
  drone: HTMLCanvasElement;
  boss: HTMLCanvasElement;
  bossDamaged: HTMLCanvasElement;
  heroNormal: HTMLCanvasElement;
  heroSmug: HTMLCanvasElement;
}

function canvas(w: number, h: number, scale: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const g = c.getContext('2d')!;
  g.scale(scale, scale);
  return [c, g];
}

function background(scale: number) {
  const [c, g] = canvas(480, 480, scale);
  const sky = g.createLinearGradient(0, 0, 0, 480);
  sky.addColorStop(0, '#0b1240'); sky.addColorStop(0.55, '#1d2f7a'); sky.addColorStop(1, '#2a3f8f');
  g.fillStyle = sky; g.fillRect(0, 0, 480, 480);
  // distant cloud banks
  g.fillStyle = 'rgba(120,150,230,0.18)';
  for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(30 + i * 58, 380 + (i % 3) * 10, 70, 22, 0, 0, Math.PI * 2); g.fill(); }
  // sky factory silhouettes: towers, pipes, cranes
  g.fillStyle = '#121c4f';
  const towers = [[18, 250, 34], [70, 300, 22], [400, 230, 40], [452, 290, 24], [340, 320, 18]];
  for (const [x, y, w] of towers) { g.fillRect(x, y, w, 420 - y); g.fillRect(x - 4, y, w + 8, 8); }
  g.strokeStyle = '#1b2a66'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(0, 345); g.lineTo(480, 330); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.moveTo(400, 230); g.lineTo(300, 200); g.lineTo(300, 230); g.stroke();
  // tiny window lights in gold
  g.fillStyle = 'rgba(255,197,49,0.55)';
  for (const [x, y, w] of towers) for (let yy = y + 16; yy < 400; yy += 18) g.fillRect(x + w / 2 - 2, yy, 4, 5);
  // field frame lines (reflection walls are drawn live)
  return c;
}

function drone(scale: number) {
  const [c, g] = canvas(40, 40, scale);
  g.translate(20, 20);
  g.fillStyle = '#5a6a9a'; g.fillRect(-17, -3, 34, 4);
  for (const sx of [-15, 15]) { g.fillStyle = 'rgba(200,220,255,0.55)'; g.beginPath(); g.ellipse(sx, -4, 7, 2.2, 0, 0, Math.PI * 2); g.fill(); }
  const body = g.createRadialGradient(-4, -5, 2, 0, 0, 14);
  body.addColorStop(0, '#e6ecff'); body.addColorStop(0.45, '#8f9fca'); body.addColorStop(1, '#39477a');
  g.fillStyle = body; g.beginPath(); g.arc(0, 1, 12, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#1a2250'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#0d1236'; g.beginPath(); g.arc(0, 2, 6, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ff5a6e'; g.beginPath(); g.arc(0, 2, 3.2, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(-1.2, 0.8, 1.1, 0, Math.PI * 2); g.fill();
  return c;
}

function boss(scale: number, damaged: boolean) {
  const [c, g] = canvas(90, 90, scale);
  g.translate(45, 48);
  const grad = g.createLinearGradient(-30, -30, 30, 30);
  grad.addColorStop(0, damaged ? '#8a7a6a' : '#c9d3ef'); grad.addColorStop(1, damaged ? '#3a2e2a' : '#4d5b8f');
  g.fillStyle = grad;
  g.beginPath(); g.moveTo(-30, -6); g.lineTo(0, -26); g.lineTo(30, -6); g.lineTo(30, 26); g.lineTo(-30, 26); g.closePath(); g.fill();
  g.strokeStyle = '#141b45'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#1b234f'; g.fillRect(-12, 4, 24, 22);
  g.strokeStyle = GOLD; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-12, 8 + i * 5); g.lineTo(12, 8 + i * 5); g.stroke(); }
  // lightning-avoiding rod on the roof
  g.strokeStyle = '#d9e2ff'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -26); g.lineTo(0, -42); g.stroke();
  g.fillStyle = CYAN; g.beginPath(); g.arc(0, -43, 4, 0, Math.PI * 2); g.fill();
  if (damaged) {
    g.strokeStyle = '#ff7a3d'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-22, -4); g.lineTo(-10, 6); g.lineTo(-16, 16); g.stroke();
    g.beginPath(); g.moveTo(20, -2); g.lineTo(10, 10); g.stroke();
  }
  return c;
}

function hero(scale: number, smug: boolean) {
  const [c, g] = canvas(96, 96, scale);
  // coat / shoulders
  g.fillStyle = NAVY;
  g.beginPath(); g.moveTo(10, 96); g.quadraticCurveTo(14, 64, 48, 60); g.quadraticCurveTo(82, 64, 86, 96); g.closePath(); g.fill();
  g.fillStyle = '#2d43a0'; g.beginPath(); g.moveTo(40, 62); g.lineTo(48, 82); g.lineTo(56, 62); g.closePath(); g.fill();
  g.fillStyle = GOLD; g.fillRect(44, 66, 8, 4);
  // neck + face
  g.fillStyle = '#f2c9a8'; g.fillRect(42, 50, 12, 12);
  g.beginPath(); g.ellipse(48, 38, 17, 19, 0, 0, Math.PI * 2); g.fill();
  // short hair with cyan streak
  g.fillStyle = '#1a1838';
  g.beginPath(); g.moveTo(30, 40); g.quadraticCurveTo(28, 14, 50, 16); g.quadraticCurveTo(70, 16, 66, 42); g.quadraticCurveTo(62, 26, 50, 26); g.quadraticCurveTo(38, 26, 34, 44); g.closePath(); g.fill();
  g.strokeStyle = CYAN; g.lineWidth = 2; g.beginPath(); g.moveTo(56, 18); g.quadraticCurveTo(62, 24, 63, 34); g.stroke();
  // goggles on head
  g.fillStyle = GOLD; g.fillRect(34, 20, 28, 5);
  g.fillStyle = '#7fe9ff'; g.beginPath(); g.arc(41, 22, 4, 0, Math.PI * 2); g.arc(55, 22, 4, 0, Math.PI * 2); g.fill();
  // eyes / mouth
  g.strokeStyle = '#1a1838'; g.lineWidth = 2; g.lineCap = 'round';
  if (smug) {
    g.beginPath(); g.moveTo(39, 38); g.quadraticCurveTo(42, 35, 45, 38); g.stroke();
    g.beginPath(); g.moveTo(51, 38); g.quadraticCurveTo(54, 35, 57, 38); g.stroke();
    g.beginPath(); g.moveTo(43, 47); g.quadraticCurveTo(50, 51, 55, 45); g.stroke();
    g.fillStyle = 'rgba(255,120,140,0.45)'; g.beginPath(); g.ellipse(38, 44, 3.5, 2, 0, 0, Math.PI * 2); g.ellipse(58, 44, 3.5, 2, 0, 0, Math.PI * 2); g.fill();
  } else {
    g.fillStyle = '#1a1838'; g.beginPath(); g.ellipse(42, 38, 2, 2.8, 0, 0, Math.PI * 2); g.ellipse(54, 38, 2, 2.8, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(45, 47); g.lineTo(51, 47); g.stroke();
  }
  // yellow insulated glove holding the booking terminal
  g.fillStyle = '#5b6fb8'; g.fillRect(62, 70, 30, 20);
  g.fillStyle = CYAN; g.fillRect(65, 73, 24, 10);
  g.fillStyle = GOLD; g.beginPath(); g.ellipse(64, 84, 8, 7, 0, 0, Math.PI * 2); g.fill();
  return c;
}

export function buildSprites(scale: number): Sprites {
  return {
    bg: background(scale), drone: drone(scale), boss: boss(scale, false), bossDamaged: boss(scale, true),
    heroNormal: hero(scale, false), heroSmug: hero(scale, true),
  };
}
