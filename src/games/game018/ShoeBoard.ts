import type { ShoeRun } from './ShoeRun';
import type { Effect, Obstacle, ShoeType } from './types';
import { drawShoe, drawStar, INK } from './ShoeArt';

const TAU = Math.PI * 2;
const FONT = '"Arcade Rounded", sans-serif';
const SKY_NAMES: Readonly<Record<string, string>> = {
  'CLOUD NINE': '雲まで届いた！', 'AIRPLANE BREAK': 'スポーン！', 'UFO INCIDENT': '宇宙まで靴、来た。',
  'ORBITAL SHOE': '地球を見下ろす靴。', 'WALL BREAK': '壁、スポーン！', 'IRON GETA EVENT': '鉄下駄の本気。', 'JET STREAM': '紙、空へ。', 'TORNADO ZORI': '回れ。草履。',
  'BUSINESS MISSILE': '社会人の重み！', 'IRON BREAKER': '鉄下駄、飛んだ。', 'DRILL THROUGH': 'ドリルシューズ！', 'HIGHWAY STAR': '靴、道路を制す。',
};
export interface BoardOptions { title?: boolean; reducedMotion?: boolean }
export interface BoardProjection { width: number; height: number; cameraX: number; cameraY: number; scale: number; shoeX: number; shoeY: number }

/** Canvas artwork only. Trajectory, break state, altitude and effects come from ShoeRun. */
export class ShoeBoard {
  private readonly c: CanvasRenderingContext2D;
  private readonly observer: ResizeObserver;
  private readonly prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private width = 1000;
  private height = 650;
  private artScale = 1;
  private cameraX = 0;
  private cameraY = 0;
  private scale = 3;
  private shoeX = 0;
  private shoeY = 0;
  private previousTime = 0;
  private following = false;
  constructor(readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas2D unavailable');
    this.c = context; canvas.width = this.width; canvas.height = this.height;
    this.observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      this.height = Math.max(400, Math.min(2100, Math.round(height / width * this.width)));
      if (canvas.height !== this.height) canvas.height = this.height;
      this.artScale = Math.max(1, Math.min(2.4, 730 / width, this.height * .83 / 330));
    });
    this.observer.observe(canvas);
  }
  destroy(): void { this.observer.disconnect(); }
  get projection(): BoardProjection {
    return { width: this.width, height: this.height, cameraX: this.cameraX, cameraY: this.cameraY, scale: this.scale, shoeX: this.shoeX, shoeY: this.shoeY };
  }
  private text(value: string, x: number, y: number, size: number, color = INK, align: CanvasTextAlign = 'center'): void {
    const c = this.c; c.font = '900 ' + size + 'px ' + FONT; c.fillStyle = color; c.textAlign = align; c.fillText(value, x, y);
  }
  private line(x1: number, y1: number, x2: number, y2: number, color: string, width = 3): void {
    const c = this.c; c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  private cloud(x: number, y: number, size: number, color: string): void {
    const c = this.c; c.fillStyle = color; c.beginPath(); c.ellipse(x, y, size, size * .3, 0, 0, TAU); c.ellipse(x - size * .34, y - size * .14, size * .47, size * .36, 0, 0, TAU); c.ellipse(x + size * .25, y - size * .24, size * .5, size * .4, 0, 0, TAU); c.fill();
  }
  private capsule(x: number, y: number, w: number, h: number, fill: string): void {
    const c = this.c; c.fillStyle = fill; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.roundRect(x, y, w, h, Math.min(18, h * .25)); c.fill(); c.stroke();
  }
  private arrow(x: number, y: number, angle: number, length: number, color: string, width = 7): void {
    const c = this.c; c.save(); c.translate(x, y); c.rotate(angle); c.lineCap = 'round'; this.line(0, 0, length, 0, color, width);
    c.fillStyle = color; c.beginPath(); c.moveTo(length + 9, 0); c.lineTo(length - 14, -12); c.lineTo(length - 14, 12); c.closePath(); c.fill(); c.restore();
  }
  render(run: ShoeRun, now: number, options: BoardOptions = {}): void {
    const reduced = options.reducedMotion ?? this.prefersReducedMotion;
    const title = options.title ?? false;
    const c = this.c, h = this.height;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.lineCap = 'round'; c.lineJoin = 'round';
    const flight = !title && ['flight', 'landing', 'result'].includes(run.phase);
    const dt = run.paused ? 0 : Math.max(0, Math.min(.1, (now - this.previousTime) / 1000)); this.previousTime = now;
    c.save();
    if (!reduced && !title && run.phase === 'kick' && run.phaseProgress > .45) { const decay = (1 - run.phaseProgress) * 10; c.translate(Math.sin(run.phaseProgress * 83) * decay, Math.cos(run.phaseProgress * 71) * decay); }
    if (flight) {
      this.updateCamera(run, dt, reduced);
      this.flightSky(run);
      this.world(run);
      this.effects(run, reduced);
      this.flightCaption(run);
      this.flyingShoe(run, reduced);
    } else {
      this.following = false;
      this.park(title ? now / 1000 : run.time);
      this.setup(run, title, reduced);
    }
    c.restore();
    // Ink border and small registration marks make the drawing feel like an authored comic panel.
    c.strokeStyle = '#18374635'; c.lineWidth = 2; c.strokeRect(12, 12, this.width - 24, h - 24);
  }
  private park(clock: number): void {
    const c = this.c, h = this.height;
    const sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#74dbda'); sky.addColorStop(.72, '#d6f3d5'); sky.addColorStop(1, '#fff0b9'); c.fillStyle = sky; c.fillRect(0, 0, this.width, h);
    drawStar(c, 850, h * .17, 68, '#fff0a5', .2);
    this.cloud(130, h * .15, 80, '#ffffffa8'); this.cloud(615 + Math.sin(clock * .1) * 8, h * .23, 105, '#ffffffa8');
    const ground = h * .83;
    c.fillStyle = '#a9d1ad'; c.beginPath(); c.moveTo(0, ground); c.bezierCurveTo(270, ground - 155, 410, ground - 25, 1000, ground - 145); c.lineTo(1000, h); c.lineTo(0, h); c.fill();
    for (let i = 0; i < 7; i++) {
      const x = i * 170 - 40, bh = 60 + i % 3 * 23;
      c.fillStyle = i % 2 ? '#b2ded2' : '#97c9c7'; c.fillRect(x, ground - bh - 28, 100, bh + 35); c.fillStyle = '#eff6cd';
      for (let j = 0; j < 3; j++) c.fillRect(x + 12 + j * 28, ground - bh - 9, 14, 19);
    }
    // Park railings are scenery, never disguised as destructible model obstacles.
    this.line(0, ground - 16, 1000, ground - 16, '#518e8990', 5);
    for (let x = 25; x < 1000; x += 90) this.line(x, ground - 16, x, ground + 25, '#518e8990', 4);
    c.fillStyle = '#efd792'; c.fillRect(0, ground + 15, 1000, h - ground);
    c.fillStyle = '#f9e5a7'; c.beginPath(); c.moveTo(0, ground + 41); c.lineTo(1000, ground + 17); c.lineTo(1000, ground + 46); c.lineTo(0, ground + 84); c.fill();
    this.line(0, ground + 17, 1000, ground + 17, '#baab76', 4);
    // A distant empty wall forecasts the low-angle route without falsely showing a break.
    c.fillStyle = '#e89875'; c.strokeStyle = '#976954'; c.lineWidth = 2; c.fillRect(858, ground - 36, 120, 51);
    for (let row = 0; row < 3; row++) { this.line(858, ground - 36 + row * 17, 978, ground - 36 + row * 17, '#a56b55', 2); for (let j = 0; j < 3; j++) this.line(858 + j * 43 + row % 2 * 20, ground - 36 + row * 17, 858 + j * 43 + row % 2 * 20, ground - 19 + row * 17, '#a56b55', 2); }
  }
  private setup(run: ShoeRun, title: boolean, reduced: boolean): void {
    const c = this.c, h = this.height, phase = run.phase, s = this.artScale;
    const spinFocus = phase === 'spin' ? 1 : phase === 'angle-lock' ? run.phaseProgress : phase === 'spin-lock' ? 1 - run.phaseProgress : 0;
    const focus = spinFocus * spinFocus * (3 - 2 * spinFocus);
    const scale = s * (1 + focus * .5);
    const hipX = Math.max(330, 200 * s), hipY = h * .83 - 115 * s;
    const poseAngle = title ? 51 + Math.sin(run.time * .9) * 12 : run.angle;
    const swing = (poseAngle - 45) * 2.5 * Math.PI / 180;
    const footX = hipX + Math.sin(swing) * 133 * scale;
    const footY = hipY + Math.cos(swing) * 133 * scale;
    const zoom = 1 + focus * (1.5 / s + .75);
    c.save(); c.translate(500 * focus, h * .57 * focus); c.scale(zoom, zoom); c.translate(-footX * focus, -footY * focus);
    this.boy(hipX, hipY, scale, swing, run.shoeType, run.spin, phase === 'kick' ? run.phaseProgress : 0, phase === 'max');
    if (phase === 'angle' && !title) {
      c.save(); c.strokeStyle = '#fff8cf'; c.lineWidth = 7; c.setLineDash([10, 15]); c.beginPath(); c.arc(hipX, hipY, 165 * scale, -.95, Math.PI + .95); c.stroke(); c.restore();
      this.arrow(footX + 20 * scale, footY - 15 * scale, -run.angle * Math.PI / 180, 85 * scale, '#e56b46', 9 * scale);
    }
    c.restore();
    if (phase === 'spin' && !title) {
      const cx = 500, cy = h * .57;
      c.save(); c.strokeStyle = '#ed785b'; c.lineWidth = 7 * s;
      c.beginPath(); c.ellipse(cx, cy, 158 * s, 62 * s, run.spin * .2, .15, Math.PI * 1.8); c.stroke(); c.restore();
      this.arrow(cx + 146 * s, cy - 15 * s, Math.PI / 2.5, 20 * s, '#ed785b', 5 * s);
      this.capsule(500 - 160 * s, h * .18, 320 * s, 60 * s, '#fff9da');
      this.text('足首をひねって、SPIN', 500, h * .18 + 39 * s, 26 * s);
    }
    if (phase === 'power' && !title) this.powerGauge(run.power);
    if (phase === 'angle-lock' || phase === 'spin-lock') {
      const label = phase === 'angle-lock' ? 'ANGLE LOCK!' : 'SPIN LOCK!';
      this.text(label, 500, h * .17, 42 * s, '#183746');
    }
    if (phase === 'max' && !title) {
      if (!reduced) { c.fillStyle = run.shoeType === 'iron-geta' ? '#ffffffbc' : '#fffbd170'; c.fillRect(0, 0, 1000, h); }
      for (let i = 0; i < 6; i++) drawStar(c, 110 + i * 153, h * (.27 + i % 2 * .11), 18 * s, i % 2 ? '#ec6d51' : '#ffcc49', i * .8);
      this.text('JUST MAX!!', 500, h * .25, 68 * Math.min(s, 1.65), '#b04138');
      this.text('靴の未来が、変わった。', 500, h * .25 + 55 * s, 25 * s, '#183746');
    }
    if (phase === 'kick' && !title) {
      this.capsule(485, h * .37 - 70 * s, 360 * Math.min(s, 1.3), 86 * s, '#fffbed');
      this.text('いっけぇぇぇ！！', 485 + 180 * Math.min(s, 1.3), h * .37 - 15 * s, 31 * s);
      if (!reduced && run.phaseProgress > .45) {
        c.save(); c.globalAlpha = (1 - run.phaseProgress) * .5; c.fillStyle = '#fff9cd'; c.fillRect(0, 0, 1000, h); c.restore();
      }
    }
  }
  private boy(x: number, y: number, size: number, swing: number, shoe: ShoeType, spin: number, kick: number, glowing: boolean, launched = false): void {
    const c = this.c; c.save(); c.translate(x, y); c.scale(size, size);
    const activeSwing = kick > .45 ? swing + (kick - .45) * 1.1 : swing;
    const fx = Math.sin(activeSwing) * 133, fy = Math.cos(activeSwing) * 133;
    c.fillStyle = '#18374624'; c.beginPath(); c.ellipse(8, 134, 76, 12, 0, 0, TAU); c.fill();
    // Standing leg and planted shoe.
    this.line(-19, -8, -25, 63, '#183746', 30); this.line(-25, 63, -32, 111, '#183746', 26);
    this.line(-19, -8, -25, 63, '#f4bc80', 22); this.line(-25, 63, -32, 111, '#f4bc80', 18);
    drawShoe(c, 'sneaker', -24, 117, .64);
    // The kicking leg rotates about one fixed hip. Bent knee joins retain a clear anatomy.
    const kx = fx * .48 - Math.cos(activeSwing) * 12, ky = fy * .48 + Math.sin(activeSwing) * 12;
    this.line(10, -7, kx, ky, '#183746', 31); this.line(kx, ky, fx, fy, '#183746', 27);
    this.line(10, -7, kx, ky, '#f4bc80', 23); this.line(kx, ky, fx, fy, '#f4bc80', 19);
    if (!launched) drawShoe(c, shoe, fx + 14, fy, .77, spin * .67);
    c.fillStyle = '#284555'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.roundRect(-37, -33, 73, 37, [8, 8, 3, 3]); c.fill(); c.stroke();
    c.fillStyle = '#38b9bd'; c.beginPath(); c.moveTo(-31, -100); c.quadraticCurveTo(-5, -113, 27, -91); c.lineTo(37, -34); c.lineTo(-40, -34); c.closePath(); c.fill(); c.stroke();
    // Arms counterbalance the moving leg, rather than following the shoe as separate detached parts.
    this.line(-26, -84, -53, -39, INK, 21); this.line(-53, -39, -72, -51, INK, 18);
    this.line(-26, -84, -53, -39, '#f4bc80', 14); this.line(-53, -39, -72, -51, '#f4bc80', 11);
    this.line(25, -83, 59, -63 - kick * 37, INK, 21); this.line(59, -63 - kick * 37, 78, -79 - kick * 32, INK, 18);
    this.line(25, -83, 59, -63 - kick * 37, '#f4bc80', 14); this.line(59, -63 - kick * 37, 78, -79 - kick * 32, '#f4bc80', 11);
    c.fillStyle = '#ffde9f'; c.beginPath(); c.ellipse(0, -139, 37, 41, -.1, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#153f4c'; c.beginPath(); c.moveTo(-36, -144); c.lineTo(-32, -169); c.lineTo(-15, -179); c.lineTo(17, -172); c.lineTo(39, -151); c.lineTo(21, -155); c.lineTo(13, -145); c.lineTo(3, -159); c.lineTo(-14, -149); c.lineTo(-16, -159); c.closePath(); c.fill();
    c.fillStyle = '#ee694e'; c.beginPath(); c.moveTo(-40, -161); c.quadraticCurveTo(-38, -197, 9, -186); c.lineTo(28, -171); c.lineTo(45, -166); c.lineTo(46, -158); c.lineTo(10, -158); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#183746'; c.beginPath(); c.ellipse(12, -139, 3, 6, 0, 0, TAU); c.ellipse(29, -138, 3, 6, 0, 0, TAU); c.fill();
    if (glowing) { drawStar(c, 12, -139, 13, '#fff1a7'); drawStar(c, 29, -138, 13, '#fff1a7'); }
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(11, -120); c.quadraticCurveTo(23, -110, 34, -122); c.stroke();
    c.fillStyle = '#e88e67'; c.beginPath(); c.ellipse(-13, -125, 9, 5, -.1, 0, TAU); c.fill();
    // T-shirt emblem is a tiny wing, a readable visual identity at every size.
    c.fillStyle = '#fff6cc'; c.beginPath(); c.moveTo(-15, -71); c.lineTo(16, -78); c.lineTo(5, -59); c.lineTo(-9, -59); c.closePath(); c.fill();
    c.restore();
  }
  private powerGauge(power: number): void {
    const c = this.c, s = this.artScale, h = this.height;
    const width = 620, height = 42 * s, x = 190, y = h * .23;
    this.text('POWER', 500, y - 30 * s, 35 * s);
    this.capsule(x - 13, y - 13, width + 26, height + 26, '#fffbe3');
    c.fillStyle = '#d3dfcd'; c.fillRect(x, y, width, height);
    const gradient = c.createLinearGradient(x, y, x + width, y); gradient.addColorStop(0, '#45b6b2'); gradient.addColorStop(.78, '#e4cb59'); gradient.addColorStop(.97, '#e86c4e'); gradient.addColorStop(1, '#fff3a2');
    c.fillStyle = gradient; c.fillRect(x, y, width * power / 100, height);
    c.fillStyle = '#fffcdb'; c.fillRect(x + width * .98, y, width * .02, height);
    c.strokeStyle = '#e65e46'; c.lineWidth = 4; c.strokeRect(x + width * .995, y - 3, width * .005, height + 6);
    for (let i = 0; i <= 4; i++) this.line(x + width * i / 4, y + height, x + width * i / 4, y + height + 10 * s, INK, 2);
    const px = x + width * power / 100;
    this.line(px, y - 9, px, y + height + 10, INK, 6); drawStar(c, px, y - 15, 13 * s, '#ef6953');
    this.text('0', x, y + height + 37 * s, 20 * s); this.text('MAX!', x + width - 22, y + height + 37 * s, 20 * s, '#ac433a');
  }
  private updateCamera(run: ShoeRun, dt: number, reduced: boolean): void {
    const speed = Math.hypot(run.velocity.x, run.velocity.y);
    // Camera pulls back with speed; the shoe stays visually enlarged independently of world scale.
    const wantedScale = Math.max(.012, Math.min(4, 620 / Math.max(155, speed * .075)));
    const ease = this.following ? 1 - Math.exp(-dt * 9) : 1;
    this.scale += (wantedScale - this.scale) * ease;
    const wantedX = run.position.x - this.width * .43 / this.scale;
    const wantedY = run.position.y - this.height * .5 / this.scale;
    this.cameraX += (wantedX - this.cameraX) * ease; this.cameraY += (wantedY - this.cameraY) * ease;
    this.following = true;
    let sx = (run.position.x - this.cameraX) * this.scale, sy = this.height - (run.position.y - this.cameraY) * this.scale;
    // Bound the tracking lag. High-speed records must never leave the visible panel.
    const lowX = 120 * this.artScale, highX = this.width - 120 * this.artScale, lowY = 110 * this.artScale, highY = this.height - 110 * this.artScale;
    if (sx < lowX || sx > highX) { sx = Math.max(lowX, Math.min(highX, sx)); this.cameraX = run.position.x - sx / this.scale; }
    if (sy < lowY || sy > highY) { sy = Math.max(lowY, Math.min(highY, sy)); this.cameraY = run.position.y - (this.height - sy) / this.scale; }
    this.shoeX = sx; this.shoeY = sy;
    if (reduced) { this.cameraX = wantedX; this.cameraY = wantedY; this.shoeX = this.width * .43; this.shoeY = this.height * .5; }
  }
  private flightSky(run: ShoeRun): void {
    const c = this.c, h = this.height, altitude = run.position.y;
    const t = Math.max(0, Math.min(1, altitude / 11000));
    const mix = (a: number, b: number): number => Math.round(a + (b - a) * t);
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, 'rgb(' + mix(106, 18) + ',' + mix(210, 27) + ',' + mix(218, 72) + ')');
    sky.addColorStop(1, 'rgb(' + mix(230, 48) + ',' + mix(245, 75) + ',' + mix(199, 127) + ')'); c.fillStyle = sky; c.fillRect(0, 0, 1000, h);
    if (altitude > 6500) {
      c.save(); c.globalAlpha = Math.min(1, (altitude - 6500) / 8500);
      for (let i = 0; i < 34; i++) { const x = (i * 163 + 83) % 970 + 15, y = (i * 97 + 41) % Math.floor(h * .75); drawStar(c, x, y, i % 5 ? 2.4 : 6, '#f7f4cf', i); } c.restore();
    }
    // Clouds are background. AIRPLANE/UFO/satellite are only drawn for actual model events.
    const cloudFade = altitude < 4000 ? 1 : Math.max(0, 1 - (altitude - 4000) / 2500);
    if (cloudFade > 0) {
      c.save(); c.globalAlpha = cloudFade;
      const offset = run.position.x * .007;
      for (let i = 0; i < 5; i++) { const x = ((i * 293 - offset) % 1450 + 1450) % 1450 - 180, y = h * .21 + (i % 3) * h * .13 + Math.min(220, altitude * .03); this.cloud(x, y, 75 + i % 3 * 23, '#fffdf0aa'); } c.restore();
    }
    if (altitude > 18000) {
      c.save(); c.globalAlpha = Math.min(1, (altitude - 18000) / 7000); c.fillStyle = '#4aaeb9'; c.strokeStyle = '#b6f4dc'; c.lineWidth = 8;
      c.beginPath(); c.ellipse(530, h * 1.27, 790, h * .46, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#99d29f'; c.beginPath(); c.ellipse(355, h * .975, 100, 32, -.25, 0, TAU); c.ellipse(725, h * .985, 150, 43, .2, 0, TAU); c.fill(); c.restore();
    }
  }
  private world(run: ShoeRun): void {
    const c = this.c, h = this.height;
    const ground = h + this.cameraY * this.scale;
    if (ground < h + 190) {
      // Distant scenery repeats a bounded set; no world-sized array is generated.
      const district = Math.floor(run.position.x / 1400) % 5;
      const offset = ((run.position.x * .012) % 150 + 150) % 150;
      for (let i = -1; i < 8; i++) {
        const x = i * 150 - offset, base = Math.min(h * .95, ground - 12), high = 70 + (i + 8) % 3 * 42;
        if (district === 3) { c.fillStyle = '#77a99d'; c.beginPath(); c.moveTo(x - 60, base); c.lineTo(x + 70, base - high); c.lineTo(x + 190, base); c.closePath(); c.fill(); }
        else if (district === 4) { c.fillStyle = '#5cbcc9'; c.fillRect(x, base - 36, 150, h); this.line(x, base - 24, x + 70, base - 24, '#d9f1d8', 4); }
        else { c.fillStyle = district === 1 ? '#92bcc0' : '#add2bf'; c.fillRect(x, base - high, 110, high); c.fillStyle = '#e6edc9'; for (let k = 0; k < 3; k++) c.fillRect(x + 16 + k * 29, base - high + 18, 14, 19); }
      }
      c.fillStyle = '#e9d48e'; c.fillRect(0, ground, 1000, h - ground); this.line(0, ground, 1000, ground, '#8d9c6d', 5);
      const stripeStep = Math.max(60, 40 * this.scale), start = -((this.cameraX * this.scale) % stripeStep);
      if (ground + 38 < h) for (let x = start; x < 1000; x += stripeStep) this.line(x, ground + 38, x + stripeStep * .5, ground + 38, '#fff3bf', 5);
    }
    // The boy stays at the real launch origin for the first departing frames only.
    // He carries no launched shoe and leaves naturally as the tracking camera moves.
    const originX = -this.cameraX * this.scale;
    if (run.phase === 'flight' && run.flightElapsed < .9 && originX > -90 && originX < 1000 && ground < h + 100) {
      const size = Math.min(.8 * this.artScale, h / 720);
      this.boy(originX - 40 * size, ground - 117 * size, size, .9, run.shoeType, 0, 1, false, true);
    }
    for (const obstacle of run.obstacles) this.obstacle(obstacle, run.effects);
  }
  private obstacle(o: Readonly<Obstacle>, effects: readonly Effect[]): void {
    const c = this.c;
    const x = (o.x - this.cameraX) * this.scale, y = this.height - (o.y - this.cameraY) * this.scale;
    const w = o.width * this.scale, h = o.height * this.scale;
    if (x + w < -100 || x > 1100 || y < -100 || y - h > this.height + 100) return;
    c.save(); c.translate(x, y - h); c.lineWidth = Math.max(2, this.scale * .65); c.strokeStyle = INK;
    const base = o.type === 'truck' ? '#edb456' : o.type === 'vending' ? '#f17761' : o.type === 'wall' ? '#d68b70' : '#e9d5ac';
    c.fillStyle = base;
    if (o.type === 'fence') {
      c.fillStyle = '#9a8771'; for (let i = 0; i < 4; i++) c.fillRect(w * i / 4, 0, Math.max(2, w * .12), h);
      c.fillRect(0, h * .22, w, h * .12); c.fillRect(0, h * .72, w, h * .1);
    } else if (o.type === 'sign') {
      c.fillStyle = '#6c7e76'; c.fillRect(w * .42, h * .46, w * .17, h * .54);
      c.fillStyle = '#ffd671'; c.beginPath(); c.roundRect(0, 0, w, h * .6, Math.min(10, w * .1)); c.fill(); c.stroke();
      this.arrow(w * .16, h * .25, 0, w * .55, '#476479', Math.max(2, h * .04));
    } else if (o.type === 'truck') {
      c.fillRect(0, 0, w * .7, h * .78); c.strokeRect(0, 0, w * .7, h * .78);
      c.fillStyle = '#e47959'; c.fillRect(w * .7, h * .18, w * .3, h * .62);
      c.fillStyle = '#c1e8de'; c.fillRect(w * .77, h * .25, w * .15, h * .2);
      c.fillStyle = '#284252'; for (const a of [.23, .8]) { c.beginPath(); c.arc(w * a, h * .83, h * .15, 0, TAU); c.fill(); }
    } else {
      c.fillRect(0, 0, w, h); c.strokeRect(0, 0, w, h);
      if (o.type === 'wall') {
        c.strokeStyle = '#995c49'; const row = Math.max(5, h / 5); for (let j = 1; j < 5; j++) { this.line(0, j * row, w, j * row, '#995c49', 1.5); for (let k = 0; k < 3; k++) this.line(w * (k / 3 + j % 2 / 6), (j - 1) * row, w * (k / 3 + j % 2 / 6), j * row, '#995c49', 1.5); }
      } else if (o.type === 'vending') { c.fillStyle = '#b5e4df'; c.fillRect(w * .12, h * .12, w * .76, h * .43); c.fillStyle = '#fff4b5'; for (let j = 0; j < 3; j++) c.fillRect(w * (.2 + j * .22), h * .2, w * .1, h * .21); c.fillStyle = '#43595c'; c.fillRect(w * .2, h * .76, w * .55, h * .12); }
      else { c.fillStyle = '#89bfb7'; for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) c.fillRect(w * (.12 + k * .46), h * (.1 + j * .25), w * .27, h * .12); c.fillStyle = '#a98c6d'; c.fillRect(w * .3, h * .76, w * .42, h * .24); }
    }
    if (o.broken) {
      const impact = effects.find(e => e.obstacleId === o.id && e.type === 'impact');
      if (impact) {
        const holeX = (impact.x - o.x) * this.scale, holeY = h - (impact.y - o.y) * this.scale;
        const r = Math.max(8, Math.min(w * .45, 11 * this.scale));
        // A dark comic hole sits on the true collision point; it is never assigned to intact objects.
        c.fillStyle = '#294653'; c.strokeStyle = '#ffebb3'; c.lineWidth = 3; c.beginPath();
        for (let i = 0; i < 14; i++) { const a = i * TAU / 14, rr = r * (i % 2 ? .72 : 1.1); const px = holeX + Math.cos(a) * rr, py = holeY + Math.sin(a) * rr; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.closePath(); c.fill(); c.stroke();
      }
    }
    c.restore();
  }
  private effects(run: ShoeRun, reduced: boolean): void {
    const c = this.c, s = this.artScale;
    for (const effect of run.effects) {
      const age = run.flightElapsed - effect.time;
      if (age < 0 || age > 2.5) continue;
      const x = (effect.x - this.cameraX) * this.scale, y = this.height - (effect.y - this.cameraY) * this.scale;
      if (effect.type === 'impact') {
        c.save(); c.globalAlpha = Math.max(0, 1 - age / .9);
        if (!reduced && effect.name === 'BREAK!') for (let i = 0; i < 7; i++) { const a = i * TAU / 7, r = (25 + age * 95) * s; c.fillStyle = i % 2 ? '#f37d50' : '#ffe09b'; c.save(); c.translate(x + Math.cos(a) * r, y + Math.sin(a) * r + age * age * 65); c.rotate(a + age * 5); c.fillRect(-7 * s, -5 * s, 14 * s, 10 * s); c.restore(); }
        drawStar(c, x, y, 50 * s * Math.max(.2, 1 - age), '#ffe899', .3); this.text(effect.name === 'BREAK!' ? 'ドゴッ！' : 'ゴツン！', x + 40 * s, y - 40 * s, 25 * s, '#a64939'); c.restore();
      } else this.specialObject(effect, x, y, age, s);
    }
  }
  private specialObject(effect: Effect, x: number, y: number, age: number, size: number): void {
    const c = this.c;
    if (!['CLOUD NINE', 'AIRPLANE BREAK', 'UFO INCIDENT', 'ORBITAL SHOE'].includes(effect.name)) return;
    c.save(); c.translate(x - age * 42, y); c.scale(size, size); c.lineWidth = 3; c.strokeStyle = INK;
    if (effect.name === 'CLOUD NINE') { this.cloud(0, 0, 86, '#fff9e6'); }
    else if (effect.name === 'AIRPLANE BREAK') {
      c.fillStyle = '#fff4d5'; c.beginPath(); c.moveTo(-112, 0); c.lineTo(-63, -11); c.lineTo(70, -11); c.quadraticCurveTo(117, -3, 107, 9); c.lineTo(-105, 12); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ec7962'; c.beginPath(); c.moveTo(-50, -4); c.lineTo(-87, -43); c.lineTo(-65, -43); c.lineTo(-20, -5); c.moveTo(17, 2); c.lineTo(41, 43); c.lineTo(67, 43); c.lineTo(52, -2); c.fill(); c.stroke();
      c.fillStyle = '#3a99b0'; for (let i = -35; i <= 70; i += 22) c.fillRect(i, -5, 9, 7);
      c.fillStyle = '#265574'; c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fill(); c.strokeStyle = '#ffedb6'; c.stroke();
    } else if (effect.name === 'UFO INCIDENT') {
      c.fillStyle = '#bbf0bc'; c.beginPath(); c.ellipse(0, -13, 41, 30, 0, Math.PI, TAU); c.fill(); c.stroke();
      c.fillStyle = '#889eae'; c.beginPath(); c.ellipse(0, 2, 81, 24, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#f2d557'; for (let i = -54; i <= 54; i += 27) { c.beginPath(); c.arc(i, 6, 5, 0, TAU); c.fill(); }
      c.fillStyle = '#183746'; c.beginPath(); c.arc(0, -12, 17, 0, TAU); c.fill(); this.text('!?', 28, -42, 26, '#fff4cb');
    } else {
      c.fillStyle = '#a2c8d1'; c.fillRect(-16, -20, 32, 40); c.strokeRect(-16, -20, 32, 40);
      for (const ax of [-74, 27]) { c.fillStyle = '#5373a9'; c.fillRect(ax, -24, 48, 48); c.strokeRect(ax, -24, 48, 48); for (let i = 1; i < 3; i++) { this.line(ax + i * 16, -24, ax + i * 16, 24, '#b6e9e8', 1); this.line(ax, -24 + i * 16, ax + 48, -24 + i * 16, '#b6e9e8', 1); } }
      this.line(0, -20, 10, -43, '#d9f1e5', 3); drawStar(c, 10, -43, 8, '#f9e5a4');
    }
    c.restore();
  }
  private flyingShoe(run: ShoeRun, reduced: boolean): void {
    const c = this.c, s = this.artScale, x = this.shoeX, y = this.shoeY;
    const speed = Math.hypot(run.velocity.x, run.velocity.y), angle = Math.atan2(-run.velocity.y, run.velocity.x);
    if (run.phase === 'flight' && !reduced && speed > 30) {
      c.save(); c.translate(x, y); c.rotate(angle); c.globalAlpha = .44;
      for (let i = 0; i < 5; i++) this.line(-75 * s - i % 2 * 25, (i - 2) * 14 * s, -(125 + Math.min(110, speed * .03)) * s - i % 2 * 30, (i - 2) * 14 * s, '#fffbdc', (i % 2 ? 3 : 5) * s);
      c.restore();
    }
    const reentry = run.maxHeight >= 18000 && run.velocity.y < -200 && run.position.y > 1000;
    if (reentry && !reduced) {
      c.save(); c.translate(x, y); c.rotate(angle); c.fillStyle = '#ffac5b'; c.beginPath(); c.moveTo(-25 * s, -25 * s); c.lineTo(-160 * s, -13 * s); c.lineTo(-125 * s, 4 * s); c.lineTo(-165 * s, 20 * s); c.lineTo(-25 * s, 27 * s); c.closePath(); c.fill(); c.restore();
    }
    drawShoe(c, run.shoeType, x, y, 1.13 * s, -run.rotation, true);
    if (run.phase === 'landing' || run.phase === 'result') {
      c.fillStyle = '#18374620'; c.beginPath(); c.ellipse(x, y + 35 * s, 59 * s, 10 * s, 0, 0, TAU); c.fill();
      this.text('ポスッ。', x + 95 * s, y - 35 * s, 27 * s, '#415961');
      if (run.phase === 'landing') for (let i = 0; i < 3; i++) this.cloud(x + (i - 1) * 57 * s, y + 22 * s, 27 * s, '#fff1bfaa');
    }
  }
  private flightCaption(run: ShoeRun): void {
    const c = this.c, s = this.artScale;
    let latest: Effect | undefined;
    const effects = run.effects;
    for (let i = effects.length - 1; i >= 0; i--) { const e = effects[i], age = run.flightElapsed - e.time; if (e.type === 'special' && age >= 0 && age < 2.5) { latest = e; break; } }
    if (latest) {
      const w = 860, x = (1000 - w) / 2, height = Math.min(86 * s, this.height * .18);
      // Keep the announcement away from the actual tracking position, with shoe art on top.
      const y = this.shoeY < this.height * .42 ? this.height - height - 24 * s : 24 * s;
      c.save(); c.globalAlpha = .93; this.capsule(x, y, w, height, '#fff8d9'); c.restore();
      this.text(latest.name, 500, y + height * .45, 30 * Math.min(s, 1.75), '#a74739');
      this.text(SKY_NAMES[latest.name] ?? '靴の可能性、拡大中。', 500, y + height * .79, 18 * s, '#294956');
    } else if (run.breakCombo > 1) {
      this.text('BREAK COMBO × ' + run.breakCombo, 500, 75 * s, 30 * s, '#fff6d3');
    }
  }
}
