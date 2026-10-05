import { GOAL, GOAL_RADIUS, PLAYER_RADIUS, START, type Point } from './types';
import type { RainRun } from './RainRun';

export const VIEW = { width: 1000, height: 620 };
const depthScale = (): number => (VIEW.height - 212) / 600;
export function project(point: Point, height: number, camera: number): Point & { y: number } {
  const scale = 1 + (point.z - 300) * .00012;
  const sideX = 500 + (point.x - 500) * scale, topX = 58 + point.x * .884;
  return { x: sideX * (1 - camera) + topX * camera, y: (VIEW.height * .765 + (point.z - 300) * .11 - height * .7) * (1 - camera) + (116 + point.z * depthScale() - height * .08) * camera, z: point.z };
}
export function unproject(x: number, y: number): Point { return { x: (x - 58) / .884, z: (y - 116) / depthScale() }; }
export class RainBoard {
  private readonly context: CanvasRenderingContext2D;
  private readonly observer: ResizeObserver;
  private artScale = 1;
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(readonly canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('2d')!; canvas.width = VIEW.width; canvas.height = VIEW.height;
    this.observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      VIEW.height = Math.max(620, Math.min(1800, Math.round(height / width * VIEW.width)));
      if (canvas.height !== VIEW.height) canvas.height = VIEW.height;
      this.artScale = Math.max(1, Math.min(1.8, 600 / width));
    });
    this.observer.observe(canvas);
  }
  destroy(): void { this.observer.disconnect(); }
  private line(a: Point, b: Point, height: number, camera: number, color: string, width = 2): void {
    const p = project(a, height, camera), q = project(b, height, camera), c = this.context;
    c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
  }
  private polygon(points: (Point & { height?: number })[], camera: number, color: string): void {
    const c = this.context; c.fillStyle = color; c.beginPath();
    points.forEach((point, i) => { const p = project(point, point.height ?? 0, camera); if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.closePath(); c.fill();
  }
  private hero(point: Point, camera: number, mood: 'normal' | 'proud' | 'wet', alpha = 1): void {
    const p = project(point, 0, camera), c = this.context, top = camera;
    c.save(); c.globalAlpha = alpha; c.translate(p.x, p.y); c.scale((1 - .22 * top) * this.artScale, (1 - .35 * top) * this.artScale);
    c.fillStyle = '#102a4355'; c.beginPath(); c.ellipse(0, 3, 22, 7 + 8 * top, 0, 0, Math.PI * 2); c.fill();
    c.lineWidth = 4; c.strokeStyle = '#142c45'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-6, -17); c.lineTo(-14, -3); c.lineTo(-23, -3); c.moveTo(7, -17); c.lineTo(17, -3); c.lineTo(26, -3); c.stroke();
    c.fillStyle = mood === 'wet' ? '#94bfc8' : '#ffcf57'; c.beginPath(); c.roundRect(-15, -43, 31, 31, [10, 10, 5, 5]); c.fill(); c.stroke();
    c.fillStyle = '#ffedd1'; c.beginPath(); c.ellipse(1, -48, 17, 16, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#142c45'; c.beginPath(); c.ellipse(6, -49, 2, 2.7, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(1, -40); c.quadraticCurveTo(7, mood === 'wet' ? -48 : -35, 13, -41); c.stroke();
    c.fillStyle = '#ffcf57'; c.beginPath(); c.moveTo(-17, -51); c.quadraticCurveTo(-12, -77, 13, -64); c.lineTo(23, -53); c.closePath(); c.fill(); c.stroke();
    if (mood === 'proud') { c.beginPath(); c.moveTo(-14, -30); c.lineTo(-27, -38); c.lineTo(-23, -49); c.stroke(); }
    if (mood === 'wet') { c.fillStyle = '#8edfee'; c.beginPath(); c.ellipse(9, -42, 4, 7, .2, 0, Math.PI * 2); c.fill(); }
    // Exact effective player radius remains visible in the planning projection.
    c.restore();
    if (camera > .9 && alpha === 1) { c.strokeStyle = '#142c45'; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y, PLAYER_RADIUS * .884, PLAYER_RADIUS * depthScale(), 0, 0, Math.PI * 2); c.stroke(); }
  }
  render(run: RainRun, now: number, title = false): void {
    const c = this.context, camera = run.camera, phase = run.phase, paused = run.paused;
    const frozen = !title && ['rise', 'plan', 'lower'].includes(phase), clock = paused || frozen ? run.time : now / 1000;
    const sky = c.createLinearGradient(0, 0, 0, VIEW.height); sky.addColorStop(0, frozen ? '#9facb6' : '#64899e'); sky.addColorStop(1, '#c6dedc'); c.fillStyle = sky; c.fillRect(0, 0, VIEW.width, VIEW.height);
    // Small authored storefronts share XYZ projection with road, hero and rain.
    for (let i = 0; i < 8; i++) {
      const x = 25 + i * 135, z = i % 2 ? 620 : -25, h = 115 + i % 3 * 35;
      this.polygon([{ x, z, height: 0 }, { x: x + 103, z, height: 0 }, { x: x + 103, z, height: h }, { x, z, height: h }], camera, ['#547082', '#527e80', '#7b8c99'][i % 3]);
      this.polygon([{ x, z, height: h }, { x: x + 103, z, height: h }, { x: x + 103, z: z + 43, height: h }, { x, z: z + 43, height: h }], camera, '#334f63');
      for (let j = 0; j < 3; j++) this.line({ x: x + 18 + j * 28, z }, { x: x + 28 + j * 28, z }, h * .5, camera, '#eadba8', 6);
    }
    // Clouds lift into narrow rooflines as the shared projection rotates.
    c.save(); c.globalAlpha = 1 - camera * .75; c.fillStyle = '#304959';
    for (let i = 0; i < 6; i++) { const x = 70 + i * 173; c.beginPath(); c.ellipse(x, 90 + i % 2 * 25, 115, 40, 0, 0, Math.PI * 2); c.fill(); } c.restore();
    this.polygon([{ x: 0, z: 25 }, { x: 1000, z: 25 }, { x: 1000, z: 575 }, { x: 0, z: 575 }], camera, frozen ? '#d0d5d2' : '#557880');
    this.line({ x: 0, z: 25 }, { x: 1000, z: 25 }, 0, camera, '#edf0db', 4); this.line({ x: 0, z: 575 }, { x: 1000, z: 575 }, 0, camera, '#edf0db', 4);
    for (let x = 20; x < 1000; x += 75) this.line({ x, z: 300 }, { x: x + 32, z: 300 }, 0, camera, '#c8e0d5', 3);
    if (camera > .2) {
      c.save(); c.globalAlpha = camera;
      for (let x = 100; x < 1000; x += 100) this.line({ x, z: 40 }, { x, z: 560 }, 0, camera, '#77978d40');
      for (let z = 100; z < 600; z += 100) this.line({ x: 20, z }, { x: 980, z }, 0, camera, '#77978d40');
      c.restore();
    }
    if (title || phase === 'rain' || phase === 'warning') {
      c.strokeStyle = '#e6fbfd'; c.lineWidth = 2.5; c.globalAlpha = phase === 'warning' ? .15 : .75;
      for (let i = 0; i < 75; i++) { const x = 30 + (i * 137 % 940), y = (clock * 180 + i * 73) % 560; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 7, y + 21); c.stroke(); } c.globalAlpha = 1;
    }
    if (!title && ['rise', 'plan', 'lower', 'dash', 'clear', 'over'].includes(phase)) {
      for (const rain of run.scene.rain) {
        const point = project(rain.impact, 0, camera), radius = (rain.radius + PLAYER_RADIUS) * .884;
        c.save(); c.globalAlpha = rain.dangerous ? .95 : .22;
        c.fillStyle = rain.dangerous ? '#ef635fcc' : '#d7f4fc'; c.strokeStyle = rain.dangerous ? '#7e303c' : '#668792'; c.lineWidth = 2;
        c.beginPath(); c.ellipse(point.x, point.y, radius, (rain.radius + PLAYER_RADIUS) * (.11 * (1 - camera) + depthScale() * camera), 0, 0, Math.PI * 2); c.fill(); c.stroke();
        // A contrasting center and slash do not rely on red alone.
        if (rain.dangerous) { c.strokeStyle = '#ffffff'; c.beginPath(); c.moveTo(point.x - radius * .32, point.y - 4); c.lineTo(point.x + radius * .32, point.y + 4); c.stroke(); }
        const elapsed = Math.min(run.dashTime, rain.timeToImpact);
        const rainPoint = project({ x: rain.x + run.scene.wind.x * elapsed, z: rain.z + run.scene.wind.z * elapsed }, Math.max(0, rain.height - rain.fallSpeed * elapsed), camera);
        c.strokeStyle = rain.dangerous ? '#247b94' : '#e6fbfd'; c.lineWidth = 3; c.beginPath(); c.moveTo(rainPoint.x, rainPoint.y - 10); c.lineTo(rainPoint.x - 3, rainPoint.y + 8); c.stroke();
        if (camera > .8 && (run.scene.wind.x || run.scene.wind.z) && rain.dangerous) {
          const from = project(rain, 0, camera); c.strokeStyle = '#243b53'; c.lineWidth = 2; c.beginPath(); c.moveTo(from.x, from.y); c.lineTo(point.x, point.y); c.stroke();
          c.beginPath(); c.moveTo(point.x - 4, point.y - 7); c.lineTo(point.x, point.y); c.lineTo(point.x + 5, point.y - 6); c.stroke();
        }
        c.restore();
      }
    }
    const goal = project(GOAL, 0, camera), goalY = GOAL_RADIUS.z * (.11 * (1 - camera) + depthScale() * camera); c.save(); c.translate(goal.x, goal.y);
    c.fillStyle = '#194936'; c.strokeStyle = '#bdf2bc'; c.lineWidth = 4; c.beginPath(); c.ellipse(0, 0, GOAL_RADIUS.x * .884, goalY, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#ffffff'; c.font = 'bold ' + 23 * this.artScale + 'px sans-serif'; c.textAlign = 'center'; c.fillText('GOAL', 0, -goalY - 12); c.restore();
    if (run.route.length > 1 && !title) {
      c.lineJoin = c.lineCap = 'round'; c.strokeStyle = '#17485c'; c.lineWidth = 8 * this.artScale;
      for (let stroke = 0; stroke < 2; stroke++) {
        if (stroke) { c.strokeStyle = '#f5ff83'; c.lineWidth = 4 * this.artScale; }
        c.beginPath(); run.route.forEach((p, i) => { const q = project(p, 0, camera); if (i) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y); }); c.stroke();
      }
      if (phase === 'plan') { const tail = project(run.route[run.route.length - 1], 0, camera); c.strokeStyle = '#142c45'; c.fillStyle = '#f5ff83'; c.lineWidth = 3; c.beginPath(); c.arc(tail.x, tail.y, 10, 0, Math.PI * 2); c.fill(); c.stroke(); }
    }
    if (phase === 'dash') for (let i = 1; i <= 4; i++) {
      const at = run.trailingPosition(i * 28);
      if (at) this.hero(at, camera, 'normal', .22 - i * .035);
    }
    this.hero(title ? START : run.position, camera, phase === 'over' ? 'wet' : phase === 'clear' ? 'proud' : 'normal');
    c.fillStyle = '#fff6de'; c.font = '900 36px sans-serif'; c.textAlign = 'left';
    if (title) { c.fillText('雨？ 当たらなければ晴れです。', 45, 250); c.font = '900 88px sans-serif'; c.fillText('RAINSHIFT', 40, 348); }
    if (!title && phase === 'rise') { c.fillStyle = '#fff6de'; const hero = project(run.position, 0, camera);
      c.fillStyle = '#fff9e7'; c.strokeStyle = '#142c45'; c.lineWidth = 3; c.beginPath(); c.roundRect(Math.max(15, hero.x - 15), hero.y - 150 * this.artScale, 195 * this.artScale, 65 * this.artScale, 16); c.fill(); c.stroke();
      c.fillStyle = '#142c45'; c.font = '900 ' + 30 * this.artScale + 'px sans-serif'; c.fillText('超加速！', Math.max(30, hero.x), hero.y - 108 * this.artScale); c.save(); c.globalAlpha = this.reducedMotion ? 0 : Math.max(0, 1 - camera * 7) * .65; c.fillStyle = '#fff'; c.fillRect(0, 0, VIEW.width, VIEW.height); c.restore(); }
    if (phase === 'plan' && !title) {
      c.fillStyle = '#f5f9e8'; c.fillRect(30, 25, 940, 76);
      c.fillStyle = '#173e4b'; c.font = '900 31px sans-serif'; c.fillText('WORLD STOP · 赤い着地点を避ける', 45, 59);
      c.font = '23px sans-serif'; c.fillText('主人公 → GOAL。薄い雨は今回は届きません。', 45, 88);
    }
    if (phase === 'dash' && !title) { c.fillStyle = '#fff6de'; c.font = '900 30px sans-serif'; c.fillText('シュシュン！', 45, 85); }
    if (phase === 'clear' && !title) { c.fillStyle = '#fff6de'; c.font = '900 38px sans-serif'; c.fillText('DRY CLEAR', 45, 115); c.font = '25px sans-serif'; c.fillText('Rainy is basically sunny.', 45, 155); c.fillText('雨って実質、晴れと同じよな', 45, 191); }
    if (phase === 'over' && !title) { c.fillStyle = '#fff6de'; c.font = '900 33px sans-serif'; c.fillText('Rainy is still rainy...', 45, 115); c.font = '25px sans-serif'; c.fillText('雨はやっぱり雨だ……', 45, 151); }
  }
}
