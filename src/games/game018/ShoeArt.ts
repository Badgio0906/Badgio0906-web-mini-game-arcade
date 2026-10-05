import type { ShoeType } from './types';

export const INK = '#183746';
const TAU = Math.PI * 2;
/** Original Canvas vector silhouettes, shared by the field and selection previews. */
export function drawShoe(c: CanvasRenderingContext2D, type: ShoeType, x: number, y: number, size = 1, rotation = 0, flying = false): void {
  c.save(); c.translate(x, y); c.rotate(rotation); c.scale(size, size); c.lineJoin = 'round'; c.lineCap = 'round';
  if (flying) { c.strokeStyle = '#fffbdf'; c.lineWidth = 13; shoeOutline(c, type); c.stroke(); }
  c.strokeStyle = INK; c.lineWidth = 4;
  if (type === 'paper') {
    c.fillStyle = '#fffae9'; shoeOutline(c, type); c.fill(); c.stroke();
    c.strokeStyle = '#bd9e72'; c.lineWidth = 2; c.beginPath(); c.moveTo(-43, 11); c.lineTo(-12, -20); c.lineTo(34, 9); c.lineTo(8, 15); c.lineTo(-12, -20); c.moveTo(-43, 11); c.lineTo(8, 15); c.stroke();
    c.fillStyle = '#efc278'; c.beginPath(); c.moveTo(-24, -8); c.lineTo(-12, -20); c.lineTo(-1, -12); c.lineTo(-17, -1); c.fill();
  } else if (type === 'zori') {
    c.fillStyle = '#efbf6d'; shoeOutline(c, type); c.fill(); c.stroke();
    c.strokeStyle = '#b18049'; c.lineWidth = 1.5; for (let i = -35; i < 35; i += 8) { c.beginPath(); c.moveTo(i, -8); c.lineTo(i + 6, 14); c.stroke(); }
    c.strokeStyle = '#ef5f58'; c.lineWidth = 9; c.beginPath(); c.moveTo(-21, -10); c.lineTo(5, 2); c.lineTo(29, -8); c.moveTo(5, 2); c.lineTo(7, 13); c.stroke();
    c.fillStyle = '#fff1bd'; c.beginPath(); c.arc(5, 2, 4, 0, TAU); c.fill();
  } else if (type === 'sneaker') {
    c.fillStyle = '#f26758'; shoeOutline(c, type); c.fill(); c.stroke();
    c.fillStyle = '#fff9e8'; c.beginPath(); c.moveTo(-43, 8); c.lineTo(39, 8); c.quadraticCurveTo(47, 13, 40, 18); c.lineTo(-43, 18); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#32b7b8'; c.beginPath(); c.moveTo(-32, -22); c.lineTo(-16, -22); c.lineTo(-7, -7); c.lineTo(-21, -2); c.closePath(); c.fill();
    c.strokeStyle = '#fff9e8'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-12 + i * 8, -16 + i * 3); c.lineTo(-20 + i * 8, -10 + i * 3); c.stroke(); }
    c.fillStyle = '#ffe29b'; c.beginPath(); c.moveTo(-12, 0); c.lineTo(9, -6); c.lineTo(23, -2); c.lineTo(-3, 5); c.fill();
  } else if (type === 'leather') {
    c.fillStyle = '#613a38'; shoeOutline(c, type); c.fill(); c.stroke();
    c.fillStyle = '#231f2a'; c.fillRect(-43, 9, 82, 11); c.fillRect(-39, 16, 19, 9);
    c.strokeStyle = '#bc8970'; c.lineWidth = 3; c.beginPath(); c.moveTo(12, -8); c.quadraticCurveTo(17, -2, 16, 9); c.moveTo(-35, -16); c.quadraticCurveTo(-26, -27, -13, -15); c.stroke();
    c.strokeStyle = '#f4d4a4'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-20 + i * 7, -11 + i * 2); c.lineTo(-24 + i * 7, -5 + i * 2); c.stroke(); }
    c.fillStyle = '#ffffff30'; c.beginPath(); c.ellipse(28, 0, 12, 3, -.1, 0, TAU); c.fill();
  } else {
    c.fillStyle = '#668296'; shoeOutline(c, type); c.fill(); c.stroke();
    c.fillStyle = '#263b50'; c.fillRect(-32, 13, 14, 20); c.fillRect(18, 13, 14, 20);
    c.strokeStyle = '#f5cc56'; c.lineWidth = 7; c.beginPath(); c.moveTo(-23, -7); c.lineTo(4, 3); c.lineTo(30, -6); c.moveTo(4, 3); c.lineTo(4, 12); c.stroke();
    c.fillStyle = '#ddedf1'; for (const ax of [-33, 32]) { c.beginPath(); c.arc(ax, 8, 3, 0, TAU); c.fill(); }
    c.strokeStyle = '#b0d7dd'; c.lineWidth = 2; c.beginPath(); c.moveTo(-35, -10); c.lineTo(-2, -11); c.stroke();
  }
  c.restore();
}
function shoeOutline(c: CanvasRenderingContext2D, type: ShoeType): void {
  c.beginPath();
  if (type === 'paper') { c.moveTo(-46, 12); c.lineTo(-30, -5); c.lineTo(-14, -24); c.lineTo(-7, -8); c.lineTo(31, 1); c.lineTo(46, 12); c.lineTo(11, 19); c.closePath(); }
  else if (type === 'zori') { c.ellipse(0, 3, 44, 16, -.03, 0, TAU); }
  else if (type === 'iron-geta') { c.roundRect(-45, -13, 90, 31, 7); }
  else { c.moveTo(-44, 11); c.lineTo(-42, -24); c.quadraticCurveTo(-27, -31, -16, -19); c.lineTo(-4, -9); c.lineTo(24, -6); c.quadraticCurveTo(49, -4, 44, 13); c.lineTo(35, 18); c.lineTo(-42, 18); c.closePath(); }
}
export function drawStar(c: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, rotation = 0): void {
  c.save(); c.translate(x, y); c.rotate(rotation); c.fillStyle = color; c.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? radius * .26 : radius; const px = Math.cos(a) * r, py = Math.sin(a) * r; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
  c.closePath(); c.fill(); c.restore();
}
