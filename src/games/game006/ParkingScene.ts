import Phaser from 'phaser';
import { ParkingRun, rectangleCorners } from './ParkingRun';
import type { ParkingChoice, ParkingController, ParkingEvent, ParkingHooks, ParkingPose, ParkingSlotKind, Point } from './contracts';

const variants = ['compact', 'sedan', 'van'];
const key = (variant: number): string => `parking-${variants[variant % variants.length]}`;
const INK = 0x31464e; const MINT = 0x73a99a; const CORAL = 0xd26951; const GOLD = 0xe9bb58;

/** Rendering owns no game input, credit, audio, storage or UI state. Assets never determine geometry. */
export function createParkingGame(parent: HTMLElement, hooks: ParkingHooks): ParkingController {
  let scene: ParkingScene | null = null;
  let paused = false; let pendingStart = false; let pendingPractice: number | null = null; let destroyed = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = new ParkingRun(event => { scene?.effect(event); hooks.onEvent(event); });

  class ParkingScene extends Phaser.Scene {
    private ground!: Phaser.GameObjects.Graphics;
    private g!: Phaser.GameObjects.Graphics;
    private cars: Phaser.GameObjects.Image[] = [];
    private popup!: Phaser.GameObjects.Text;
    private caption!: Phaser.GameObjects.Text;
    private slotMark!: Phaser.GameObjects.Text;
    private modeMark!: Phaser.GameObjects.Text;
    private visualTime = 0;
    private hud!: Phaser.GameObjects.Text;
    private feedback!: Phaser.GameObjects.Text;
    private bayLabels: Phaser.GameObjects.Text[] = [];
    private popupAge = 10;
    private failureAge = -1;
    private reported = false;
    constructor() { super('Parking'); }
    preload(): void {
      for (let i = 0; i < variants.length; i++) this.load.image(key(i), `./assets/game006/car-${variants[i]}.webp`);
      // A cheap progress graphic appears immediately while the three small textures load.
      const loading = this.add.graphics();
      loading.fillStyle(INK, 0.14); loading.fillRoundedRect(180, 294, 240, 6, 3);
      this.load.on('progress', (value: number) => { loading.clear(); loading.fillStyle(INK, 0.14); loading.fillRoundedRect(180, 294, 240, 6, 3); loading.fillStyle(MINT); loading.fillRoundedRect(180, 294, Math.max(2, value * 240), 6, 3); });
      this.load.once('complete', () => loading.destroy());
    }
    create(): void {
      scene = this;
      this.ground = this.add.graphics().setDepth(0);
      this.hud = this.add.text(300, 30, '', { fontFamily: 'Arcade Rounded,system-ui,sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#31464e', backgroundColor: '#f4ebd5', padding: { x: 12, y: 7 }, align: 'center' }).setOrigin(0.5, 0).setDepth(5);
      for (let i = 0; i < 2; i++) this.bayLabels.push(this.add.text(0,0,'',{fontFamily:'Arcade Rounded,system-ui,sans-serif',fontSize:'20px',fontStyle:'bold',color:'#31464e',backgroundColor:'#f4ebd5',padding:{x:4,y:3}}).setOrigin(0.5).setDepth(4).setVisible(false));
      this.feedback = this.add.text(300, 544, '', { fontFamily: 'Arcade Rounded,system-ui,sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#31464e', backgroundColor: '#f4ebd5', padding: { x: 9, y: 5 }, align: 'center' }).setOrigin(0.5).setDepth(5);
      for (let i = 0; i < 3; i++) this.cars.push(this.add.image(0, 0, '__WHITE').setDepth(2).setVisible(false));
      this.g = this.add.graphics().setDepth(3);
      this.caption = this.add.text(44, 90, '', { fontFamily: 'Arcade Rounded,system-ui,sans-serif', fontSize: '19px', fontStyle: 'bold', color: '#31464e' }).setDepth(4);
      this.modeMark = this.add.text(552, 90, '', { fontFamily: 'Arcade Rounded,system-ui,sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#ac533d' }).setOrigin(1, 0).setDepth(4);
      this.slotMark = this.add.text(0, 0, 'P', { fontFamily: 'monospace', fontSize: '24px', fontStyle: 'bold', color: '#73a99a' }).setOrigin(0.5).setDepth(1);
      this.popup = this.add.text(300, 170, '', { fontFamily: 'Arial Narrow,system-ui,sans-serif', fontSize: '27px', fontStyle: 'bold', color: '#31464e', stroke: '#f4ebd5', strokeThickness: 5, align: 'center' }).setOrigin(0.5).setDepth(4).setVisible(false);
      void document.fonts.load('700 19px "Arcade Rounded"', 'まっすぐ駐車斜めの区画縦列駐車禁断駐車').then(() => {
        if (destroyed || scene !== this) return;
        this.caption.updateText(); this.modeMark.updateText(); this.draw();
      }).catch(() => {});
      if (pendingPractice !== null) { const step = pendingPractice; pendingPractice = null; this.begin(step); }
      else if (pendingStart) { pendingStart = false; this.begin(); }
      this.draw();
    }
    begin(practiceStep?: number): void {
      if (practiceStep === undefined) run.start(); else run.startPractice(practiceStep); this.reported = false; this.popupAge = 10; this.failureAge = -1;
      this.popup.setVisible(false); this.cameras.main.resetFX(); hooks.onUpdate(run.snapshot()); this.draw();
    }
    title(): void {
      run.reset(); this.reported = true; this.popupAge = 10; this.failureAge = -1;
      this.popup.setVisible(false); this.cameras.main.resetFX(); this.draw();
    }
    act(): boolean {
      if (!run.act()) return false;
      hooks.onUpdate(run.snapshot()); this.draw(); return true;
    }
    choose(choice: ParkingChoice): boolean {
      if (!run.choose(choice)) return false;
      hooks.onUpdate(run.snapshot()); this.draw(); return true;
    }
    chooseSlot(choice: ParkingSlotKind): boolean {
      if (!run.chooseSlot(choice)) return false; hooks.onUpdate(run.snapshot()); this.draw(); return true;
    }
    effect(event: ParkingEvent): void {
      if (event.type === 'park') {
        this.popupAge = 0; this.popup.setText(`${event.grade}  +${event.points}\n余裕 ${event.margin.toFixed(1)}px${event.nearMissPoints ? ' · ギリギリ！' : ''}`).setVisible(true).setAlpha(1);
      }
      if (event.type === 'failure') {
        this.failureAge = 0;
        if (!reduced && event.outcome === 'collision') this.cameras.main.shake(120, 0.003);
      }
    }
    update(_time: number, delta: number): void {
      if (destroyed || paused) return;
      const snapshot = run.snapshot();
      if (snapshot.pending) { this.draw(); return; }
      const dt = Math.min(0.05, delta / 1000); this.visualTime += dt; this.popupAge += dt;
      if (snapshot.alive) {
        run.step(dt); hooks.onUpdate(run.snapshot());
        if (!run.snapshot().alive && !this.reported) {
          const result = run.result(); if (result) { this.reported = true; hooks.onEnd(result); }
        }
      } else if (this.failureAge >= 0) this.failureAge += dt;
      this.draw();
    }
    private outline(g: Phaser.GameObjects.Graphics, rect: ParkingPose, color: number, width: number, alpha = 1): void {
      const points = rectangleCorners(rect); g.lineStyle(width, color, alpha); g.beginPath(); g.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
      g.closePath(); g.strokePath();
    }
    private car(pose: ParkingPose, variant: number, index: number, player: boolean): void {
      const g = this.ground;
      g.save(); g.translateCanvas(pose.x, pose.y); g.rotateCanvas(pose.rotation);
      g.fillStyle(INK, 0.15); g.fillRoundedRect(-pose.width / 2 + 3, -pose.height / 2 + 4, pose.width, pose.height, 8); g.restore();
      const image = this.cars[index]; const hasTexture = this.textures.exists(key(variant)); image.setVisible(hasTexture);
      if (hasTexture) image.setTexture(key(variant)).setPosition(pose.x, pose.y).setDisplaySize(pose.width, pose.height).setRotation(pose.rotation).setAlpha(player ? 1 : 0.85);
      else {
        g.save(); g.translateCanvas(pose.x, pose.y); g.rotateCanvas(pose.rotation);
        g.fillStyle([CORAL, INK, MINT][variant % 3]); g.fillRoundedRect(-pose.width / 2 + 2, -pose.height / 2 + 1, pose.width - 4, pose.height - 2, 8);
        g.fillStyle(0x244350); g.fillRoundedRect(-pose.width / 2 + 7, -pose.height / 2 + 12, pose.width - 14, 15, 3);
        g.fillStyle(0xf4ebd5, 0.65); g.fillRect(-pose.width / 2 + 5, -pose.height / 2 + 4, 7, 3); g.fillRect(pose.width / 2 - 12, -pose.height / 2 + 4, 7, 3); g.restore();
      }
      if (player) this.outline(this.g, pose, INK, 1, 0.35);
    }
    private path(points: Point[], alpha: number): void {
      const g = this.g;
      g.lineStyle(1.5, INK, alpha);
      for (let i = 1; i < points.length; i += 2) g.lineBetween(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
    }
    private draw(): void {
      const view = run.inspection(); const s = view; const layout = view.layout;
      const ground = this.ground; const g = this.g; ground.clear(); g.clear();
      for (const car of this.cars) car.setVisible(false);
      ground.fillStyle(0xf4ebd5); ground.fillRect(0, 0, 600, 600);
      ground.fillStyle(0xdbded6); ground.fillRoundedRect(22, 22, 556, 556, 9);
      ground.lineStyle(5, 0xb9bcb2); ground.strokeRoundedRect(20, 20, 560, 560, 9);
      // Curb inner edge is exactly the model's 22..578 boundary.
      ground.lineStyle(1, INK, 0.24); ground.strokeRect(22, 22, 556, 556);
      for (let i = 0; i < 8; i++) { ground.lineStyle(1, INK, 0.045); ground.lineBetween(44 + i * 78, 74, 29 + i * 80, 548); }
      for (let i = 0; i < 6; i++) {
        const x = 50 + i * 95; ground.fillStyle(INK, 0.09); ground.fillRect(x, 555, 22, 3);
      }
      const bayColor = s.pending || s.mode === 'forbidden' || s.slotKind === 'challenge' ? CORAL : MINT;
      for (const option of view.options) {
        if (s.phase !== 'slot-choice' && option.kind === s.slotKind) continue;
        this.outline(ground, option.layout.slot, option.kind === 'safe' ? MINT : CORAL, s.phase === 'slot-choice' ? 3 : 1, s.phase === 'slot-choice' ? 0.9 : 0.35);
        ground.fillStyle(option.kind === 'safe' ? MINT : CORAL, 0.06);
        const p = option.layout.slot; ground.fillCircle(p.x, p.y, 7);
      }
      ground.save(); ground.translateCanvas(layout.slot.x, layout.slot.y); ground.rotateCanvas(layout.slot.rotation);
      ground.fillStyle(bayColor, 0.08); ground.fillRect(-layout.slot.width / 2, -layout.slot.height / 2, layout.slot.width, layout.slot.height); ground.restore();
      this.outline(ground, layout.slot, bayColor, 3);
      this.slotMark.setPosition(layout.slot.x, layout.slot.y).setRotation(layout.slot.rotation).setColor(s.pending || s.mode === 'forbidden' ? '#d26951' : '#73a99a');
      this.caption.setText(s.phase === 'slot-choice' ? '安全 ×1 / 挑戦 ×1.4' : layout.name); this.modeMark.setText(s.pending || s.mode === 'forbidden' ? '禁断駐車 ×2' : `LOT ${layout.id + 1}`);
      for (let i = 0; i < 2; i++) { const option = view.options[i]; this.bayLabels[i].setVisible(!!option && s.phase !== 'parked'); if (option) this.bayLabels[i].setText(option.kind === 'safe' ? '安全 ×1' : '挑戦 ×1.4').setPosition(option.layout.slot.x, option.layout.slot.y-82).setAlpha(s.phase === 'slot-choice' || s.slotKind === option.kind ? 1 : .45); }
      this.hud.setVisible(false);
      this.hud.setText(`SCORE ${s.score}    ${s.parked}台    ${s.mode === 'forbidden' ? '禁断 ×2' : 'V2'}${s.slotKind === 'challenge' ? ' ×1.4' : ''}`);
      this.feedback.setText(s.phase === 'slot-choice' ? '枠を指定してから、角度を決めよう' : s.phase === 'driving' ? s.brakeUsed ? '制動中 · 再加速できません' : '必要なら、もう一度入力でブレーキ' : s.phase === 'parked' ? `余裕 ${s.precision?.margin.toFixed(1)}px · ${s.noBrakePoints ? 'NO BRAKE +' + s.noBrakePoints : 'BRAKE'}${s.nearMissPoints ? ' · ギリギリ！ +' + s.nearMissPoints : ''}` : view.options.length ? `指定：${s.slotKind === 'safe' ? '安全枠' : '挑戦枠'} · 薄い枠は対象外` : '角度 → 強さ → 任意ブレーキ');
      if (s.alive && (s.phase === 'angle' || s.phase === 'power')) {
        this.path(view.projection, s.phase === 'angle' ? 0.22 : 0.42);
        if (s.phase === 'power') {
          // Neutral predicted whole body; never auto-colour a correct answer or change the model.
          this.outline(g, view.endpoint, INK, 1.5, 0.42);
          g.fillStyle(INK, 0.5); g.fillCircle(view.endpoint.x, view.endpoint.y, 2);
        }
      }
      for (let i = 0; i < layout.obstacles.length; i++) this.car(layout.obstacles[i], layout.obstacles[i].variant, i + 1, false);
      this.car(s.pose, layout.variant, 0, true);
      if (s.phase === 'angle' || s.phase === 'power') {
        // A nose marker shows forward travel without spinning the parked body with the gauge.
        const tip = { x: s.pose.x + Math.sin(s.pose.rotation) * (s.pose.height / 2 + 8), y: s.pose.y - Math.cos(s.pose.rotation) * (s.pose.height / 2 + 8) };
        g.fillStyle(GOLD, 0.8); g.fillCircle(tip.x, tip.y, 3);
      }
      if (view.contact) {
        const p = view.contact; g.lineStyle(3, CORAL, 0.95); g.strokeCircle(p.x, p.y, 9);
        g.lineBetween(p.x - 12, p.y - 12, p.x + 12, p.y + 12); g.lineBetween(p.x + 12, p.y - 12, p.x - 12, p.y + 12);
      }
      if (s.phase === 'ended' && s.outcome === 'outside') this.outline(g, s.pose, CORAL, 2.5);
      if (this.popupAge < PARK_POPUP_SECONDS && !s.pending) {
        this.popup.setVisible(true).setPosition(Math.max(130, Math.min(470, layout.slot.x)), Math.max(106, layout.slot.y - 88 - (reduced ? 0 : Math.min(0.65, this.popupAge) * 12))).setAlpha(Math.max(0, 1 - this.popupAge / PARK_POPUP_SECONDS));
      } else this.popup.setVisible(false);
      if (!s.alive && this.failureAge < 0 && !reduced) {
        g.lineStyle(2, MINT, 0.16 + Math.sin(this.visualTime * 1.4) * 0.07); g.strokeCircle(layout.slot.x, layout.slot.y, 57);
      }
    }
  }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: 600, height: 600, backgroundColor: '#f4ebd5', scene: ParkingScene,
    antialias: true, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 600, height: 600 },
    input: { keyboard: false, mouse: false, touch: false, gamepad: false }, fps: { target: 60, smoothStep: true }, render: { powerPreference: 'low-power' } });
  return {
    start: () => { if (destroyed) return; paused = false; pendingPractice = null; if (scene) scene.begin(); else pendingStart = true; },
    startPractice: step => { if (destroyed) return; paused = false; pendingStart = false; if (scene) scene.begin(step); else pendingPractice = step; },
    title: () => { if (destroyed) return; paused = false; pendingStart = false; pendingPractice = null; if (scene) scene.title(); else run.reset(); },
    act: () => !destroyed && !paused && !!scene && scene.act(),
    choose: choice => !destroyed && !paused && !!scene && scene.choose(choice),
    chooseSlot: choice => !destroyed && !paused && !!scene && scene.chooseSlot(choice),
    pause: value => { paused = value; }, snapshot: () => run.snapshot(), inspection: () => run.inspection(),
    destroy: () => { if (destroyed) return; destroyed = true; game.destroy(true); scene = null; },
  };
}
const PARK_POPUP_SECONDS = 0.95;
