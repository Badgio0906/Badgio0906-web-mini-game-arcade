import Phaser from 'phaser';
import type { GameHooks, GameplayEvent, OrbitController, RunSnapshot } from './contracts';
import { INNER_RADIUS, OrbitRun, OUTER_RADIUS } from './OrbitRun';

const CENTER = 300;
const MINT = 0xbfffa3;
const CYAN = 0x9ce6ed;
const CORAL = 0xff786c;
const GOLD = 0xe7c36c;
const TWO_PI = Math.PI * 2;
const inspections = new WeakMap<OrbitController, OrbitRun>();

/** Intended for a DEV-only read-only diagnostics hook; never changes the run. */
export function getOrbitInspection(controller: OrbitController) {
  const run = inspections.get(controller);
  return run ? {
    ...run.snapshot(), theta: run.theta, radius: run.radius,
    obstacles: run.obstacles.map(o => ({ ...o })), shards: run.shards.map(s => ({ ...s })),
  } : null;
}

interface Trail { x: number; y: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }
interface Popup { text: Phaser.GameObjects.Text; age: number; startY: number; active: boolean }

export function createOrbitGame(container: HTMLElement, hooks: GameHooks): OrbitController {
  let scene: OrbitScene | null = null;
  let paused = false;
  let pendingStart = false;
  let destroyed = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = new OrbitRun((event) => {
    scene?.effect(event);
    hooks.onEvent(event);
  });

  class OrbitScene extends Phaser.Scene {
    private graphics!: Phaser.GameObjects.Graphics;
    private trail: Trail[] = [];
    private particles: Particle[] = [];
    private popups: Popup[] = [];
    private demoAngle = -Math.PI / 2;
    private visualTime = 0;
    private pulse = 0;
    private nearFlash = 0;
    private deathAge = -1;
    private reported = false;

    constructor() { super('OrbitScene'); }

    create(): void {
      scene = this;
      this.graphics = this.add.graphics();
      for (let i = 0; i < 6; i++) {
        const text = this.add.text(0, 0, '', {
          fontFamily: 'system-ui, sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#bfffa3', align: 'center',
        }).setOrigin(0.5).setVisible(false);
        this.popups.push({ text, age: 0, startY: 0, active: false });
      }
      if (pendingStart) { pendingStart = false; this.begin(); }
      this.draw();
    }

    begin(): void {
      this.trail.length = this.particles.length = 0;
      for (const p of this.popups) { p.active = false; p.text.setVisible(false); }
      this.pulse = this.nearFlash = 0;
      this.deathAge = -1;
      this.reported = false;
      this.cameras.main.resetFX();
      run.start();
      hooks.onUpdate(run.snapshot());
    }

    showTitle(): void {
      run.reset();
      this.trail.length = this.particles.length = 0;
      for (const p of this.popups) { p.active = false; p.text.setVisible(false); }
      this.pulse = this.nearFlash = 0;
      this.deathAge = -1;
      this.reported = true;
      this.demoAngle = -Math.PI / 2;
      this.cameras.main.resetFX();
      this.draw();
    }

    effect(event: GameplayEvent): void {
      if (event.type === 'shift' && !reducedMotion) this.pulse = 1;
      if (event.type === 'shard') {
        this.popup(`+${event.points}`, '#e7c36c');
        this.burst(7, GOLD, false);
      }
      if (event.type === 'near_miss') {
        if (!reducedMotion) this.nearFlash = 1;
        this.popup(`NEAR MISS ×${event.combo}\n+${event.points}`, '#bfffa3');
      }
      if (event.type === 'death') {
        this.deathAge = 0;
        if (!reducedMotion) this.cameras.main.shake(180, 0.005);
        this.burst(26, CORAL, true);
      }
    }

    private popup(message: string, color: string): void {
      const p = this.popups.find(candidate => !candidate.active) ?? this.popups[0];
      const x = CENTER + Math.cos(run.theta) * run.radius;
      const y = CENTER + Math.sin(run.theta) * run.radius;
      p.age = 0; p.startY = y - 22; p.active = true;
      p.text.setText(message).setColor(color);
      const inset = Math.max(35, p.text.width / 2 + 16);
      p.text.setPosition(Phaser.Math.Clamp(x, inset, 600 - inset), p.startY).setAlpha(1).setVisible(true);
    }

    private burst(count: number, _color: number, death: boolean): void {
      const x = CENTER + Math.cos(run.theta) * run.radius;
      const y = CENTER + Math.sin(run.theta) * run.radius;
      for (let i = 0; i < count; i++) {
        const angle = TWO_PI * i / count + Math.random() * 0.3;
        const velocity = death ? 65 + Math.random() * 120 : 25 + Math.random() * 55;
        const life = death ? 0.55 + Math.random() * 0.35 : 0.35;
        this.particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life, maxLife: life });
      }
    }

    update(_time: number, delta: number): void {
      if (paused || destroyed) return;
      const dt = Math.min(delta / 1000, 0.05);
      this.visualTime += dt;
      this.pulse = Math.max(0, this.pulse - dt * 5);
      this.nearFlash = Math.max(0, this.nearFlash - dt * 3);
      if (run.alive) {
        run.step(dt);
        hooks.onUpdate(run.snapshot());
        if (!run.alive && !this.reported) {
          const result = run.result();
          if (result) {
            // Credit and best-score persistence happen on collision, independent of visual delay.
            this.reported = true;
            hooks.onGameOver(result);
          }
        }
      } else if (this.deathAge >= 0) {
        this.deathAge += dt;
      } else {
        this.demoAngle += dt * 0.42;
      }
      // Hit stop only affects death fragments; the run has already ended, so input is never held back.
      if (this.deathAge < 0 || this.deathAge > 0.085) {
        for (const particle of this.particles) {
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
          particle.life -= dt;
        }
        this.particles = this.particles.filter(p => p.life > 0);
      }
      for (const p of this.popups) {
        if (!p.active) continue;
        p.age += dt;
        p.text.setY(p.startY - p.age * (reducedMotion ? 0 : 35)).setAlpha(Math.max(0, 1 - p.age / 0.85));
        if (p.age > 0.85) { p.active = false; p.text.setVisible(false); }
      }
      this.draw();
    }

    private draw(): void {
      const g = this.graphics;
      g.clear();
      const active = run.alive || this.deathAge >= 0;
      const theta = active ? run.theta : this.demoAngle;
      const radius = active ? run.radius : INNER_RADIUS;
      // Gentle concentric grid: the two playable lanes remain brightest.
      g.lineStyle(1, 0x20302f, 0.28);
      g.strokeCircle(CENTER, CENTER, 90);
      g.strokeCircle(CENTER, CENTER, 253);
      for (let i = 0; i < 48; i++) {
        const a = i / 48 * TWO_PI;
        const start = i % 4 === 0 ? 250 : 253;
        g.lineBetween(CENTER + Math.cos(a) * start, CENTER + Math.sin(a) * start, CENTER + Math.cos(a) * 257, CENTER + Math.sin(a) * 257);
      }
      for (const r of [INNER_RADIUS, OUTER_RADIUS]) {
        g.lineStyle(9, CYAN, 0.025); g.strokeCircle(CENTER, CENTER, r);
        g.lineStyle(1.3, CYAN, 0.26); g.strokeCircle(CENTER, CENTER, r);
      }
      g.lineStyle(2, MINT, 0.28);
      g.beginPath(); g.arc(CENTER, CENTER, radius, theta - 0.21, theta + 0.21, false); g.strokePath();

      const glow = 1 + Math.sin(this.visualTime * 2) * 0.05;
      g.fillStyle(MINT, 0.016); g.fillCircle(CENTER, CENTER, 50 * glow);
      g.fillStyle(CYAN, 0.024); g.fillCircle(CENTER, CENTER, 36 * glow);
      g.lineStyle(1, CYAN, 0.3); g.strokeCircle(CENTER, CENTER, 23 * glow);
      const angle = this.visualTime * 0.12;
      const diamond: Phaser.Types.Math.Vector2Like[] = [];
      for (let i = 0; i < 4; i++) {
        const a = angle + i * Math.PI / 2;
        diamond.push({ x: CENTER + Math.cos(a) * 11, y: CENTER + Math.sin(a) * 11 });
      }
      g.fillStyle(MINT, 0.8); g.fillPoints(diamond, true);
      g.fillStyle(CYAN, 0.9); g.fillCircle(CENTER, CENTER, 3);

      if (active) {
        for (const o of run.obstacles) {
          const distance = o.angle - run.theta;
          if (distance < -0.5 || distance > 4.0) continue;
          const a = ((o.angle % TWO_PI) + TWO_PI) % TWO_PI;
          const r = o.lane === 'inner' ? INNER_RADIUS : OUTER_RADIUS;
          const alpha = o.passed ? 0.16 : Math.min(1, (4.0 - distance) / 0.4);
          g.lineStyle(30, CORAL, alpha * 0.08); g.beginPath(); g.arc(CENTER, CENTER, r, a - o.halfWidth, a + o.halfWidth); g.strokePath();
          g.lineStyle(23, CORAL, alpha); g.beginPath(); g.arc(CENTER, CENTER, r, a - o.halfWidth, a + o.halfWidth); g.strokePath();
          // Cross marks communicate danger even without color perception.
          const x = CENTER + Math.cos(a) * r; const y = CENTER + Math.sin(a) * r;
          g.lineStyle(2, 0x321d21, alpha);
          g.lineBetween(x - 4, y - 4, x + 4, y + 4); g.lineBetween(x - 4, y + 4, x + 4, y - 4);
        }
        for (const s of run.shards) {
          const distance = s.angle - run.theta;
          if (s.collected || distance < -0.3 || distance > 3.9) continue;
          const r = s.lane === 'inner' ? INNER_RADIUS : OUTER_RADIUS;
          const x = CENTER + Math.cos(s.angle) * r; const y = CENTER + Math.sin(s.angle) * r;
          const shimmer = 1 + Math.sin(this.visualTime * 6 + s.angle) * 0.1;
          g.fillStyle(GOLD, 0.09); g.fillCircle(x, y, 14);
          g.fillStyle(GOLD, 0.95); g.fillPoints([{ x, y: y - 7 * shimmer }, { x: x + 5, y }, { x, y: y + 7 * shimmer }, { x: x - 5, y }], true);
        }
      }

      const px = CENTER + Math.cos(theta) * radius;
      const py = CENTER + Math.sin(theta) * radius;
      if (run.alive || !active) {
        this.trail.push({ x: px, y: py });
        if (this.trail.length > (reducedMotion ? 6 : 19)) this.trail.shift();
      }
      for (let i = 0; i < this.trail.length; i++) {
        const p = this.trail[i];
        g.fillStyle(CYAN, i / this.trail.length * 0.15); g.fillCircle(p.x, p.y, 2 + i / this.trail.length * 2);
      }
      if (run.alive || !active || this.deathAge < 0.085) {
        const scale = 1 + this.pulse * 0.22;
        const tangent = theta + Math.PI / 2;
        const noseX = px + Math.cos(tangent) * 11 * scale; const noseY = py + Math.sin(tangent) * 11 * scale;
        const tailX = px - Math.cos(tangent) * 7 * scale; const tailY = py - Math.sin(tangent) * 7 * scale;
        g.fillStyle(MINT, 0.07); g.fillCircle(px, py, 18 + this.pulse * 3);
        g.fillStyle(MINT, 1);
        g.fillTriangle(noseX, noseY, tailX + Math.cos(theta) * 6 * scale, tailY + Math.sin(theta) * 6 * scale, tailX - Math.cos(theta) * 6 * scale, tailY - Math.sin(theta) * 6 * scale);
        g.fillStyle(0x0b1116, 0.8); g.fillCircle(px, py, 2);
      }
      for (const p of this.particles) {
        g.fillStyle(this.deathAge >= 0 ? CORAL : GOLD, p.life / p.maxLife);
        g.fillRect(p.x - 2, p.y - 2, 3, 3);
      }
      if (this.nearFlash > 0) {
        g.lineStyle(2, MINT, this.nearFlash * 0.3);
        g.strokeCircle(CENTER, CENTER, 267 - this.nearFlash * 10);
      }
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: 600,
    height: 600,
    backgroundColor: '#0b1116',
    transparent: false,
    antialias: true,
    scene: OrbitScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 600, height: 600 },
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    fps: { target: 60, smoothStep: true },
    render: { roundPixels: false, powerPreference: 'low-power' },
  });

  const controller: OrbitController = {
    startRun: () => {
      if (destroyed) return;
      paused = false;
      if (scene) scene.begin(); else pendingStart = true;
    },
    showTitle: () => {
      if (destroyed) return;
      paused = false;
      pendingStart = false;
      if (scene) scene.showTitle(); else run.reset();
    },
    shift: () => !destroyed && !paused && !!scene && run.shift(),
    setPaused: value => { paused = value; },
    getSnapshot: (): RunSnapshot => run.snapshot(),
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      inspections.delete(controller);
      game.destroy(true);
      scene = null;
    },
  };
  inspections.set(controller, run);
  return controller;
}
