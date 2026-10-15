import { bloomHeight, LAUNCH_Y, type FireworkSnapshot } from './FireworkRun';
const background = new Image();
background.src = new URL('./assets/game033/reorganization/night-river.webp', document.baseURI).href;
export function paintFireworks(canvas: HTMLCanvasElement, s: FireworkSnapshot): void {
  const c = canvas.getContext('2d')!; c.setTransform(1, 0, 0, 1, 0, 0);
  const sky = c.createLinearGradient(0, 0, 0, 680); sky.addColorStop(0, '#080f25'); sky.addColorStop(.7, '#1a2540'); sky.addColorStop(1, '#0b1b2c');
  c.fillStyle = sky; c.fillRect(0, 0, 480, 680);
  if (background.complete && background.naturalWidth) c.drawImage(background, 0, 0, 480, 680);
  else { c.fillStyle = '#0e192b'; c.fillRect(0, 515, 480, 165); for (let i = 0; i < 18; i++) { c.fillStyle = '#132037'; c.fillRect(i * 29, 480 + (i * 17 % 31), 25, 55); c.fillStyle = '#b1a26b'; c.fillRect(i * 29 + 8, 500, 3, 2); } }
  c.fillStyle = '#04091b30'; c.fillRect(0, 0, 480, 680);
  // Faint fixed stars give the sky scale without noisy per-frame random flicker.
  for (let i = 0; i < 32; i++) { c.fillStyle = i % 3 ? '#edf1ff55' : '#fff1cf99'; c.fillRect((i * 137 + 19) % 480, 30 + (i * 71 % 330), 1, 1); }
  if (s.phase === 'playing') {
    const target = s.target; c.save(); c.strokeStyle = '#ffe4aa99'; c.lineWidth = 1; c.setLineDash([5, 6]); c.beginPath(); c.ellipse(target.x, target.y, 48, 28, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#fff0d4'; c.font = '12px system-ui'; c.textAlign = 'center'; c.fillText('ここに、咲かせよう', target.x, target.y - 41);
    if (s.holding) { const y = LAUNCH_Y - bloomHeight(s.charge), accurate = Math.abs(y - target.y) <= 32; c.strokeStyle = accurate ? '#aaf5d9' : '#fff0cc66'; c.beginPath(); c.moveTo(target.x - 17, y); c.lineTo(target.x + 17, y); c.stroke(); c.fillStyle = accurate ? '#aaf5d9' : '#fff0cc'; c.beginPath(); c.arc(target.x, y, 3, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  for (const rocket of s.rockets) {
    const gradient = c.createLinearGradient(rocket.x, rocket.y, rocket.x, rocket.y + 45); gradient.addColorStop(0, '#fff5d9'); gradient.addColorStop(1, '#f5a55a00');
    c.strokeStyle = gradient; c.lineWidth = 2; c.beginPath(); c.moveTo(rocket.x, rocket.y); c.lineTo(rocket.x, rocket.y + 45); c.stroke();
    c.fillStyle = '#fff8df'; c.beginPath(); c.arc(rocket.x, rocket.y, 2.5, 0, Math.PI * 2); c.fill();
  }
  for (const p of s.particles) if (p.smoke) { c.fillStyle = `hsla(${p.hue},20%,65%,${p.life / p.maxLife * .045})`; c.beginPath(); c.arc(p.x, p.y, p.size * (2 - p.life / p.maxLife), 0, Math.PI * 2); c.fill(); }
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const p of s.particles) if (!p.smoke) {
    const alpha = Math.max(0, p.life / p.maxLife), color = `hsla(${p.hue},95%,76%,${alpha})`;
    c.strokeStyle = color; c.lineWidth = p.size; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * .045, p.y - p.vy * .045); c.stroke();
    c.fillStyle = `hsla(${p.hue},95%,70%,${alpha * .08})`; c.beginPath(); c.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2); c.fill();
    // Rippling, softened reflection uses the same active particle positions.
    c.fillStyle = `hsla(${p.hue},90%,70%,${alpha * .15})`; c.fillRect(p.x - 3 + Math.sin(p.y * .2 + s.time * 2) * 3, 570 + (550 - p.y) * .17, 6 + alpha * 4, 1.5);
  }
  c.restore();
  for (const b of s.blooms) if (b.age < .9) { c.save(); c.globalAlpha = Math.max(0, 1 - b.age / .9); c.fillStyle = b.quality === 'miss' ? '#e4c4b5' : '#fff2cf'; c.font = b.special ? 'bold 19px system-ui' : 'bold 15px system-ui'; c.textAlign = 'center'; c.fillText(b.quality === 'miss' ? 'もう少し、高さを合わせて' : `${b.quality === 'perfect' ? 'ぴったり！' : 'GOOD'} +${b.points}`, b.x, b.y - 16 - b.age * 18); if (b.chain > 1) { c.font = '12px system-ui'; c.fillStyle = '#b7f2e4'; c.fillText(`${b.chain} CHAIN${b.special ? ' · 八重咲き' : ''}`, b.x, b.y + 7); } c.restore(); }
  c.fillStyle = '#fff0ce55'; c.fillRect(0, 547, 480, 1);
}
