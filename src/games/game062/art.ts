// Procedural (code-drawn) sprites — NOT ImageGen. Art status: BLOCKED_ART (no approved ImageGen in session).
export const MINT = '#3fd9b0';
export const CORAL = '#ff7a6b';
export const INK = '#21324a';

export interface Sprites { bg: HTMLCanvasElement; capsules: HTMLCanvasElement[]; ship: HTMLCanvasElement; controller: HTMLCanvasElement; controllerCheer: HTMLCanvasElement }

function canvas(w: number, h: number, scale: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
  const g = c.getContext('2d')!; g.scale(scale, scale);
  return [c, g];
}

function bg(scale: number) {
  const [c, g] = canvas(480, 480, scale);
  const sky = g.createLinearGradient(0, 0, 0, 480);
  sky.addColorStop(0, '#d9f7ff'); sky.addColorStop(0.55, '#f2fbff'); sky.addColorStop(1, '#ffe9e2');
  g.fillStyle = sky; g.fillRect(0, 0, 480, 480);
  // soft planet + orbit rings
  g.fillStyle = 'rgba(255,122,107,0.18)'; g.beginPath(); g.arc(420, 70, 60, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(63,217,176,0.35)'; g.lineWidth = 3; g.beginPath(); g.ellipse(420, 70, 90, 18, -0.3, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 26; i++) { const x = (i * 97) % 470 + 5, y = (i * 53) % 260 + 44; g.beginPath(); g.arc(x, y, (i % 3) + 1, 0, Math.PI * 2); g.fill(); }
  // spaceport deck
  g.fillStyle = '#e6f3f7'; g.fillRect(0, 330, 480, 150);
  g.fillStyle = 'rgba(33,50,74,0.08)'; for (let x = 0; x < 480; x += 40) g.fillRect(x, 330, 2, 150);
  return c;
}

function capsule(scale: number, face: number) {
  const [c, g] = canvas(44, 52, scale);
  g.fillStyle = 'rgba(255,255,255,0.65)'; g.strokeStyle = '#9fd8e8'; g.lineWidth = 2.5;
  g.beginPath(); g.ellipse(22, 24, 18, 21, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  const colors = ['#9ff0c9', '#ffc2b8', '#c8d6ff'];
  g.fillStyle = colors[face]; g.beginPath(); g.ellipse(22, 29, 12, 11, 0, 0, Math.PI * 2); g.fill();
  if (face === 1) { g.beginPath(); g.ellipse(14, 19, 3, 5, -0.4, 0, Math.PI * 2); g.ellipse(30, 19, 3, 5, 0.4, 0, Math.PI * 2); g.fill(); }
  if (face === 2) { g.strokeStyle = colors[2]; g.lineWidth = 2; g.beginPath(); g.moveTo(22, 18); g.lineTo(22, 12); g.stroke(); g.beginPath(); g.arc(22, 11, 2.5, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = INK;
  if (face === 0) { g.beginPath(); g.arc(18, 28, 1.8, 0, Math.PI * 2); g.arc(26, 28, 1.8, 0, Math.PI * 2); g.fill(); }
  else { g.lineWidth = 1.6; g.strokeStyle = INK; g.beginPath(); g.arc(18, 29, 2, Math.PI, 0); g.stroke(); g.beginPath(); g.arc(26, 29, 2, Math.PI, 0); g.stroke(); }
  g.strokeStyle = INK; g.lineWidth = 1.4; g.beginPath(); g.arc(22, 32, 2.4, 0.1, Math.PI - 0.1); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(14, 12, 4, 6, -0.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = MINT; g.fillRect(14, 44, 16, 5);
  return c;
}

function ship(scale: number) {
  const [c, g] = canvas(480, 70, scale);
  const grad = g.createLinearGradient(0, 0, 0, 70);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, '#cfe7ef');
  g.fillStyle = grad;
  g.beginPath(); g.moveTo(10, 60); g.quadraticCurveTo(0, 20, 60, 10); g.lineTo(440, 10); g.quadraticCurveTo(480, 14, 474, 60); g.closePath(); g.fill();
  g.strokeStyle = '#9fd8e8'; g.lineWidth = 3; g.stroke();
  g.fillStyle = CORAL; g.fillRect(40, 50, 400, 6);
  g.fillStyle = MINT; g.fillRect(40, 14, 400, 4);
  return c;
}

function controller(scale: number, cheer: boolean) {
  const [c, g] = canvas(96, 96, scale);
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(12, 96); g.quadraticCurveTo(16, 62, 48, 60); g.quadraticCurveTo(80, 62, 84, 96); g.fill();
  g.fillStyle = MINT; g.fillRect(20, 76, 56, 6);
  g.fillStyle = CORAL; g.beginPath(); g.moveTo(42, 62); g.lineTo(48, 72); g.lineTo(54, 62); g.fill();
  g.fillStyle = '#f6d2b8'; g.fillRect(42, 50, 12, 12); g.beginPath(); g.ellipse(48, 38, 16, 18, 0, 0, Math.PI * 2); g.fill();
  // coral bob hair + mint headset
  g.fillStyle = '#e8665a';
  g.beginPath(); g.moveTo(30, 48); g.quadraticCurveTo(26, 16, 48, 16); g.quadraticCurveTo(70, 16, 66, 48); g.quadraticCurveTo(64, 30, 54, 26); g.quadraticCurveTo(40, 30, 34, 36); g.quadraticCurveTo(32, 44, 30, 48); g.fill();
  g.strokeStyle = MINT; g.lineWidth = 3; g.beginPath(); g.arc(48, 34, 20, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  g.fillStyle = MINT; g.fillRect(25, 34, 6, 10); g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.moveTo(28, 44); g.quadraticCurveTo(32, 52, 40, 50); g.stroke();
  g.strokeStyle = INK; g.lineWidth = 2; g.lineCap = 'round';
  if (cheer) {
    g.beginPath(); g.arc(42, 39, 2.5, Math.PI, 0); g.stroke(); g.beginPath(); g.arc(54, 39, 2.5, Math.PI, 0); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.ellipse(48, 46, 4, 3, 0, 0, Math.PI); g.fill();
    g.fillStyle = '#f6d2b8'; g.beginPath(); g.ellipse(82, 58, 7, 8, 0, 0, Math.PI * 2); g.fill(); // raised hand
  } else {
    g.fillStyle = INK; g.beginPath(); g.ellipse(42, 38, 2, 2.8, 0, 0, Math.PI * 2); g.ellipse(54, 38, 2, 2.8, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(48, 45, 3, 0.2, Math.PI - 0.2); g.stroke();
  }
  return c;
}

export function buildSprites(scale: number): Sprites {
  return { bg: bg(scale), capsules: [0, 1, 2].map(f => capsule(scale, f)), ship: ship(scale), controller: controller(scale, false), controllerCheer: controller(scale, true) };
}
