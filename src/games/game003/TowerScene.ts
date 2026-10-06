import Phaser from 'phaser';
import { FOUNDATION, TowerRun } from './TowerRun';
import type { CargoPose, TowerChoice, TowerController, TowerEvent, TowerHooks } from './contracts';

const STEEL = 0x344b60;
const GOLD = 0xdcb451;
const INK = 0x344b60;
const DANGER = 0xbf674b;
const facades = ['cafe', 'apartment', 'office', 'mechanical', 'utility'];
const assetKey = (name: string): string => `tower-${name}`;
interface Spark { x: number; y: number; vx: number; vy: number; age: number }

export function createTowerGame(parent: HTMLElement, hooks: TowerHooks): TowerController {
  let scene: TowerScene | null = null;
  let paused = false; let pending = false; let destroyed = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = new TowerRun(event => { scene?.effect(event); hooks.onEvent(event); });

  class TowerScene extends Phaser.Scene {
    private background!: Phaser.GameObjects.Graphics;
    private city!: Phaser.GameObjects.Image;
    private modules: Phaser.GameObjects.Image[] = [];
    private moduleCursor = 0;
    private g!: Phaser.GameObjects.Graphics;
    private popup!: Phaser.GameObjects.Text;
    private weight!: Phaser.GameObjects.Text;
    private warning!: Phaser.GameObjects.Text;
    private modeLabel!: Phaser.GameObjects.Text;
    private labels: Phaser.GameObjects.Text[] = [];
    private cameraY = 0;
    private visualTime = 0;
    private impactAge = 10;
    private popupAge = 10;
    private artAge = 10;
    private deathAge = -1;
    private reported = false;
    private collapseVisual = false;
    private sparks: Spark[] = [];
    constructor() { super('DropTower'); }
    preload(): void {
      for (const facade of facades) this.load.image(assetKey(facade), `./assets/game003/module-${facade}.webp`);
      this.load.image(assetKey('city'), './assets/game003/city-sky.webp');
    }
    create(): void {
      scene = this;
      this.background = this.add.graphics().setDepth(0);
      this.city = this.add.image(300, 684, '__WHITE').setOrigin(0.5, 1).setDepth(1).setVisible(false);
      // At least 38px per accepted floor bounds visible floors; retain a fixed presentation pool.
      for (let i = 0; i < 26; i++) this.modules.push(this.add.image(0, 0, '__WHITE').setDepth(3).setVisible(false));
      this.g = this.add.graphics().setDepth(4);
      this.popup = this.add.text(300, 180, '', { fontFamily: 'Arial Narrow,system-ui,sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#344b60', stroke: '#fff5d6', strokeThickness: 5 }).setOrigin(0.5).setDepth(5).setVisible(false);
      this.weight = this.add.text(300, 220, '', { fontFamily: 'monospace', fontSize: '15px', fontStyle: 'bold', color: '#fff5d6', backgroundColor: '#344b60', padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(5);
      this.warning = this.add.text(300, 122, '重心に注意', { fontFamily: 'system-ui,sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ad4b35', stroke: '#fff5d6', strokeThickness: 4 }).setOrigin(0.5).setDepth(5).setVisible(false);
      this.modeLabel = this.add.text(498, 114, 'C国 MODE', { fontFamily: 'Arcade Rounded,system-ui,sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#344b60', backgroundColor: '#fff5d6', padding: { x: 6, y: 3 } }).setOrigin(0.5).setDepth(5).setVisible(false);
      void document.fonts.load('700 13px "Arcade Rounded"', 'C国 MODE').then(() => {
        if (destroyed || scene !== this || !this.modeLabel.scene) return;
        this.modeLabel.updateText(); this.draw();
      }).catch(() => {});
      for (let i = 0; i < 14; i++) this.labels.push(this.add.text(58, 0, '', { fontFamily: 'monospace', fontSize: '11px', color: '#537986' }).setOrigin(1, 0.5).setDepth(5).setVisible(false));
      if (pending) { pending = false; this.begin(); }
      this.draw();
    }
    begin(): void {
      run.start(); this.cameraY = 0; this.deathAge = -1; this.reported = false; this.sparks.length = 0;
      this.collapseVisual = false;
      this.impactAge = this.popupAge = this.artAge = 10; this.popup.setVisible(false); this.cameras.main.resetFX(); hooks.onUpdate(run.snapshot());
    }
    title(): void {
      run.reset(); this.cameraY = 0; this.deathAge = -1; this.reported = true; this.sparks.length = 0;
      this.collapseVisual = false;
      this.impactAge = this.popupAge = this.artAge = 10; this.popup.setVisible(false); this.warning.setVisible(false); this.cameras.main.resetFX(); this.draw();
    }
    choose(choice: TowerChoice): boolean {
      if (!run.choose(choice)) return false;
      hooks.onUpdate(run.snapshot()); this.draw(); return true;
    }
    effect(event: TowerEvent): void {
      if (event.type === 'land') {
        this.impactAge = 0;
        const top = run.stack[run.stack.length - 1];
        if (top) for (let i = 0; i < 10; i++) this.sparks.push({ x: top.x + (Math.random() - 0.5) * top.width, y: top.y + top.height / 2,
          vx: (Math.random() - 0.5) * 70, vy: -20 - Math.random() * 25, age: 0 });
      }
      if (event.type === 'perfect') {
        this.popupAge = 0;
        this.popup.setText(`PERFECT${event.combo > 1 ? ` ×${event.combo}` : ''}  +${event.points}`).setFontSize(26).setVisible(true).setAlpha(1);
      }
      if (event.type === 'art') {
        this.artAge = this.popupAge = 0;
        this.popup.setText(`釣り合った！ 芸術 +${event.pair.points}`).setFontSize(23).setVisible(true).setAlpha(1);
      }
      if (event.type === 'collapse') {
        this.deathAge = 0;
        this.collapseVisual = event.reason === 'collapse';
        if (!reduced) this.cameras.main.shake(170, 0.004);
      }
    }
    update(_time: number, delta: number): void {
      if (paused || destroyed) return;
      if (run.pending) { this.draw(); return; }
      const dt = Math.min(0.05, delta / 1000); this.visualTime += dt;
      this.impactAge += dt; this.popupAge += dt; this.artAge += dt;
      if (run.alive) {
        run.step(dt); hooks.onUpdate(run.snapshot());
        if (!run.alive && !this.reported) { const result = run.result(); if (result) { this.reported = true; hooks.onEnd(result); } }
      } else if (this.deathAge >= 0) this.deathAge += dt;
      if (run.alive) this.cameraY += (Math.min(0, run.topY - 445) - this.cameraY) * (1 - Math.exp(-dt * 5));
      if (this.deathAge < 0 || this.deathAge > 0.08) {
        for (const spark of this.sparks) { spark.age += dt; spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.vy += dt * 85; }
        this.sparks = this.sparks.filter(spark => spark.age < 0.6);
      }
      this.draw();
    }

    private crate(cargo: CargoPose, active: boolean, demo = false): void {
      const g = this.g;
      let x = cargo.x; let y = cargo.y - this.cameraY; let rotation = cargo.rotation;
      const diagnostic = run.supportDiagnostic;
      const dead = this.collapseVisual && this.deathAge > 0.08 && cargo.id >= (run.stack[diagnostic.failureJointIndex]?.id ?? 0);
      if (dead && !reduced) {
        const age = Math.min(0.8, this.deathAge - 0.08);
        const side = diagnostic.loadCenter >= (diagnostic.left + diagnostic.right) / 2 ? 1 : -1;
        x += side * age * age * (30 + cargo.id * 2);
        y += age * age * 170;
        rotation += side * age * 0.28;
      }
      const sway = reduced || demo || !active ? 0 : Math.sin(this.impactAge * 18) * Math.exp(-this.impactAge * 5) * run.instability * 0.012;
      const key = assetKey(facades[cargo.id % facades.length]);
      if (this.textures.exists(key) && this.moduleCursor < this.modules.length) {
        this.modules[this.moduleCursor++].setTexture(key).setPosition(x, y).setDisplaySize(cargo.width, cargo.height).setRotation(rotation + sway).setVisible(true);
        // Generated façade and code boundary use exactly the same full physical rectangle.
        g.save(); g.translateCanvas(x, y); g.rotateCanvas(rotation + sway);
        g.lineStyle(2, INK, 0.9); g.strokeRect(-cargo.width / 2, -cargo.height / 2, cargo.width, cargo.height);
        g.lineStyle(1, 0xfff3ce, 0.6); g.lineBetween(-cargo.width / 2 + 2, -cargo.height / 2 + 2, cargo.width / 2 - 2, -cargo.height / 2 + 2);
        if (!active && this.impactAge < 0.3 && cargo.id === run.stack[run.stack.length - 1]?.id) {
          g.lineStyle(2, 0xfff0bd, (1 - this.impactAge / 0.3) * 0.85); g.lineBetween(-cargo.width / 2 + 2, cargo.height / 2 - 1, cargo.width / 2 - 2, cargo.height / 2 - 1);
        }
        g.restore();
        return;
      }
      g.save(); g.translateCanvas(x, y); g.rotateCanvas(rotation + sway);
      const w = cargo.width; const h = cargo.height;
      g.fillStyle(0x5e625b, 0.09); g.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
      g.fillStyle(active ? 0xe1b56d : cargo.id % 3 === 0 ? 0xc99d58 : cargo.id % 3 === 1 ? 0xd7b174 : 0xb99c6f);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 3);
      g.lineStyle(2, INK, 0.7); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 3);
      g.lineStyle(1, INK, 0.17);
      g.lineBetween(-w / 2 + 2, 0, w / 2 - 2, 0);
      g.lineBetween(-w / 2 + 2, h / 4, w / 2 - 2, h / 4);
      for (const px of [-w * 0.34, w * 0.34]) {
        g.fillStyle(0x8e744f, 0.45); g.fillRect(px - 4, -h / 2 + 1, 8, h - 2);
        g.fillStyle(0x695942, 0.7); g.fillCircle(px, -h / 2 + 7, 1.5); g.fillCircle(px, h / 2 - 7, 1.5);
      }
      g.lineStyle(2, INK, 0.48);
      g.lineBetween(-w / 2 + 15, h / 2 - 8, -w / 2 + 15, -h / 2 + 9);
      g.lineBetween(-w / 2 + 15, -h / 2 + 9, -w / 2 + 11, -h / 2 + 14);
      g.lineBetween(-w / 2 + 15, -h / 2 + 9, -w / 2 + 19, -h / 2 + 14);
      g.restore();
    }

    private draw(): void {
      const g = this.g; g.clear();
      this.modeLabel.setVisible(run.cMode);
      const bg = this.background; bg.clear(); this.moduleCursor = 0;
      for (const image of this.modules) image.setVisible(false);
      const active = run.alive || this.deathAge >= 0;
      const altitude = Math.max(0, -this.cameraY);
      const warmth = Math.min(1, Math.max(0, (altitude - 800) / 1600));
      const sky = (Math.round(169 + warmth * 43) << 16) | (Math.round(209 + warmth * 8) << 8) | Math.round(214 - warmth * 8);
      bg.fillStyle(sky); bg.fillRect(0, 0, 600, 720);
      const cityBottom = 684 - this.cameraY * 0.42;
      const hasCity = this.textures.exists(assetKey('city'));
      this.city.setVisible(hasCity && cityBottom - 300 < 720);
      if (hasCity) this.city.setTexture(assetKey('city')).setDisplaySize(600, 300).setPosition(300, cityBottom);
      else {
        for (let i = 0; i < 9; i++) {
          const h = 45 + i % 3 * 23; bg.fillStyle(i % 2 ? 0x8da699 : 0x7f9ba5, 0.5); bg.fillRect(i * 74 - 25, cityBottom - h, 58, h);
          bg.fillStyle(0xe9e3d5, 0.65); for (let row = 0; row < 3; row++) bg.fillRect(i * 74 - 14, cityBottom - h + 12 + row * 19, 34, 8);
        }
      }
      // Quiet cloud layers follow the existing camera only; decoration consumes no model RNG.
      for (let row = -1; row < 3; row++) {
        const y = row * 310 + (altitude * 0.18) % 310;
        for (const [x, offset] of [[132, 35], [484, 176]]) {
          const drift = reduced ? 0 : Math.sin(this.visualTime * 0.045 + row) * 6;
          bg.fillStyle(0xf9f5e8, 0.34); bg.fillEllipse(x + drift, y + offset, 125, 14);
          bg.fillEllipse(x - 21 + drift, y + offset - 5, 47, 16); bg.fillEllipse(x + 18 + drift, y + offset - 3, 66, 12);
        }
      }
      g.lineStyle(1, 0x537986, 0.3); g.lineBetween(74, 0, 74, 720);
      const firstMeter = Math.max(0, Math.floor((FOUNDATION.y - FOUNDATION.height / 2 - this.cameraY - 720) / 60));
      for (let i = 0; i < this.labels.length; i++) {
        const meter = firstMeter + i; const y = FOUNDATION.y - FOUNDATION.height / 2 - meter * 60 - this.cameraY;
        const visible = y >= 0 && y <= 720;
        this.labels[i].setText(`${meter} m`).setY(y).setVisible(visible);
        if (visible) { g.lineStyle(1, 0x537986, 0.45); g.lineBetween(70, y, 82, y); }
      }
      const baseY = FOUNDATION.y - this.cameraY;
      if (baseY < 750) {
        g.fillStyle(0xe9e3d5); g.fillRect(0, baseY + FOUNDATION.height / 2, 600, 720 - baseY - FOUNDATION.height / 2);
        g.fillStyle(STEEL); g.fillRoundedRect(FOUNDATION.x - FOUNDATION.width / 2, baseY - FOUNDATION.height / 2, FOUNDATION.width, FOUNDATION.height, 4);
        g.fillStyle(0x8fa0a4); g.fillRect(FOUNDATION.x - FOUNDATION.width / 2 + 3, baseY - FOUNDATION.height / 2 + 3, FOUNDATION.width - 6, 5);
        for (const offset of [-FOUNDATION.width / 2 + 14, FOUNDATION.width / 2 - 14]) { g.fillStyle(GOLD); g.fillCircle(FOUNDATION.x + offset, baseY + 4, 3); }
      }
      if (active) {
        // Iterate downward from the top and stop below the screen: render cost follows visible boxes.
        for (let i = run.stack.length - 1; i >= 0; i--) {
          const cargo = run.stack[i];
          if (cargo.y - this.cameraY > 780) break;
          if (cargo.y - this.cameraY < -80) continue;
          this.crate(cargo, false);
        }
      } else {
        for (let i = 0; i < 3; i++) this.crate({ id: i, x: 300 + (i === 1 ? 8 : i === 2 ? -3 : 0), y: 619 - i * 40,
          width: 176 - i * 4, height: 40, mass: 60, vx: 0, vy: 0, rotation: 0 }, false, true);
      }
      const cargo = active ? run.cargo : { id: 3, x: 300 + Math.sin(this.visualTime * 0.55) * 38, y: 240,
        width: 168, height: 40, mass: 60, vx: 0, vy: 0, rotation: Math.sin(this.visualTime * 0.55) * 0.012 };
      const trolleyX = cargo?.x ?? 300;
      g.fillStyle(STEEL); g.fillRoundedRect(98, 55, 404, 22, 4);
      g.fillStyle(0x7b919a); g.fillRect(98, 56, 404, 5);
      g.lineStyle(2, 0x7892a0, 0.8);
      for (let i = 0; i < 5; i++) { g.lineBetween(100 + i * 80, 75, 140 + i * 80, 57); g.lineBetween(140 + i * 80, 57, 180 + i * 80, 75); }
      g.fillStyle(0x607e8a); g.fillRoundedRect(trolleyX - 23, 73, 46, 27, 5);
      g.fillStyle(0xb4c3c4); g.fillCircle(trolleyX - 13, 88, 4); g.fillCircle(trolleyX + 13, 88, 4);
      if (cargo) {
        const y = cargo.y - this.cameraY;
        if (!active || run.phase === 'hanging') {
          g.lineStyle(2, 0x8a9285); g.lineBetween(cargo.x - 31, 100, cargo.x - 31, y - cargo.height / 2); g.lineBetween(cargo.x + 31, 100, cargo.x + 31, y - cargo.height / 2);
          const projection = active ? run.landingProjection() : cargo.x;
          const topY = active ? run.topY - this.cameraY : 519;
          g.fillStyle(0x758f97, 0.13); g.fillRect(projection - cargo.width / 2, topY - 3, cargo.width, 6);
          g.lineStyle(1, 0x748e98, 0.32);
          for (let gy = y + cargo.height / 2 + 16; gy < topY - 8; gy += 18) g.lineBetween(projection, gy, projection, gy + 5);
          g.fillStyle(0x708e9a, 0.65); g.fillTriangle(projection, topY - 6, projection - 4, topY - 13, projection + 4, topY - 13);
        }
        this.crate(cargo, true, !active);
        this.weight.setText(`${cargo.mass} kg`).setPosition(cargo.x + 6, y - cargo.height / 2 - 14).setRotation(cargo.rotation).setVisible(y > 0 && y < 720);
      } else this.weight.setVisible(false);

      if (active && run.stack.length) {
        const diag = run.supportDiagnostic;
        const y = diag.y - this.cameraY + 2;
        if (y >= 0 && y < 690) {
          g.lineStyle(run.instability >= .62 ? 3 : 2, run.instability >= .62 ? DANGER : 0x698e79, .8);
          g.lineBetween(diag.left, y, diag.right, y);
          g.fillStyle(run.instability >= .62 ? DANGER : INK, .9);
          g.fillTriangle(diag.loadCenter, y - 3, diag.loadCenter - 5, y - 13, diag.loadCenter + 5, y - 13);
        }
        const snap = run.snapshot();
        // Foundation aggregate COM is distinct from the weakest upper contact COM.
        const cx = 300 + Math.max(-90, Math.min(90, snap.foundationCenter - FOUNDATION.x));
        g.fillStyle(0xfff5d6, .88); g.fillRoundedRect(178, 646, 244, 37, 4);
        g.lineStyle(2, INK, .5); g.lineBetween(204, 668, 396, 668); g.lineBetween(300, 662, 300, 675);
        g.fillStyle(GOLD); g.fillTriangle(cx, 660, cx - 5, 651, cx + 5, 651);
      }
      const pair = run.artDiagnostic;
      if (pair && this.artAge < 1.3) {
        const first = run.stack.find(c => c.id === pair.firstId), second = run.stack.find(c => c.id === pair.secondId);
        if (first && second) {
          g.lineStyle(3, GOLD, .55 * (1 - this.artAge / 1.3));
          g.lineBetween(first.x, first.y - this.cameraY, second.x, second.y - this.cameraY);
        }
      }
      if (run.instability >= 0.62 && active) {
        const support = run.supportDiagnostic;
        const y = support.y - this.cameraY + 2;
        if (y >= 0 && y < 720) {
          g.lineStyle(3, DANGER, 0.75); g.lineBetween(support.left, y, support.right, y);
          g.fillStyle(DANGER, 0.8); g.fillTriangle(support.loadCenter, y - 5, support.loadCenter - 4, y - 12, support.loadCenter + 4, y - 12);
        }
        this.warning.setVisible(run.alive).setText(run.instability > 0.9 ? '重心が端へ！' : '重心に注意');
      } else this.warning.setVisible(false);
      if (this.popupAge < 0.9) this.popup.setPosition(Math.max(150, Math.min(450, run.topCenter)), run.topY - this.cameraY - 42 - (reduced ? 0 : this.popupAge * 15)).setAlpha(1 - this.popupAge / 0.9);
      else this.popup.setVisible(false);
      for (const spark of this.sparks) { g.fillStyle(0xb7945c, (1 - spark.age / 0.6) * 0.65); g.fillRect(spark.x - 2, spark.y - this.cameraY - 2, 3, 3); }
    }
  }

  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: 600, height: 720, backgroundColor: '#a9d1d6', scene: TowerScene,
    antialias: true, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 600, height: 720 },
    input: { keyboard: false, mouse: false, touch: false, gamepad: false }, fps: { target: 60, smoothStep: true }, render: { powerPreference: 'low-power' },
  });
  return {
    start: () => { if (destroyed) return; paused = false; if (scene) scene.begin(); else pending = true; },
    title: () => { if (destroyed) return; paused = false; pending = false; if (scene) scene.title(); else run.reset(); },
    drop: () => !destroyed && !paused && !!scene && run.drop(), pause: value => { paused = value; },
    choose: choice => !destroyed && !paused && !!scene && scene.choose(choice),
    snapshot: () => run.snapshot(), inspection: () => run.inspection(),
    destroy: () => { if (destroyed) return; destroyed = true; game.destroy(true); scene = null; },
  };
}
