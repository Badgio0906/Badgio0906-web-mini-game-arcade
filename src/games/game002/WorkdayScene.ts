import Phaser from 'phaser';
import { WorkdayRun, laneX, PLAYER_Y } from './WorkdayRun';
import type { Direction, Enemy, WorkdayChoice, WorkdayEvent, WorkdayResult, WorkdaySnapshot } from './WorkdayRun';

interface Hooks {
  onUpdate: (snapshot: WorkdaySnapshot) => void;
  onEnd: (result: WorkdayResult) => void;
  onEvent: (event: WorkdayEvent) => void;
}
export interface WorkdayController {
  start: () => void;
  title: () => void;
  move: (direction: Direction) => boolean;
  choose: (choice: WorkdayChoice) => boolean;
  pause: (value: boolean) => void;
  snapshot: () => WorkdaySnapshot;
  inspection: () => ReturnType<WorkdayRun['inspection']>;
  destroy: () => void;
}
const palettes = [
  { verge: 0xdce8d5, wall: 0xf5d4ac, roof: 0x809c8b, pavement: 0xf3eddf },
  { verge: 0xf5ddc6, wall: 0xffd7b7, roof: 0xcf7b58, pavement: 0xf4ece0 },
  { verge: 0xd7e3e3, wall: 0xc7dce0, roof: 0x568795, pavement: 0xeaf0ec },
  { verge: 0xdbdfed, wall: 0xbdcbd7, roof: 0x536e81, pavement: 0xebedf0 },
];
const characters = ['hero', 'commuter-broad', 'commuter-newspaper', 'commuter-phone', 'commuter-hurried', 'commuter-shopping'];
const districts = ['residential', 'shopping', 'station', 'office'];
const assetKey = (name: string): string => `workday-${name}`;

export function createWorkdayGame(parent: HTMLElement, hooks: Hooks): WorkdayController {
  let scene: StreetScene | null = null;
  let paused = false;
  let pending = false;
  let destroyed = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = new WorkdayRun(event => { scene?.effect(event); hooks.onEvent(event); });

  class StreetScene extends Phaser.Scene {
    private street!: Phaser.GameObjects.Graphics;
    private shadows!: Phaser.GameObjects.Graphics;
    private g!: Phaser.GameObjects.Graphics;
    private people: Phaser.GameObjects.Image[] = [];
    private buildings: Phaser.GameObjects.Image[] = [];
    private company!: Phaser.GameObjects.Image;
    private parkedBike!: Phaser.GameObjects.Image;
    private companyLabel!: Phaser.GameObjects.Text;
    private personCursor = 0;
    private nice!: Phaser.GameObjects.Text;
    private sign!: Phaser.GameObjects.Text;
    private visualTime = 0;
    private endAge = -1;
    private niceAge = 10;
    private reported = false;
    private movePulse = 0;
    constructor() { super('WorkdayStreet'); }
    preload(): void {
      for (const name of characters) this.load.image(assetKey(name), `./assets/game002/${name}.webp`);
      for (const name of ['company', 'parked-bike', 'rider-bike']) this.load.image(assetKey(name), `./assets/game002/${name}.webp`);
      for (const district of districts) for (const side of ['left', 'right']) {
        const name = `district-${district}-${side}`;
        this.load.image(assetKey(name), `./assets/game002/${name}.webp`);
      }
    }
    create(): void {
      scene = this;
      this.street = this.add.graphics().setDepth(0);
      for (let i = 0; i < 6; i++) this.buildings.push(this.add.image(0, 0, '__WHITE').setOrigin(0, 0).setDepth(1).setVisible(false));
      this.shadows = this.add.graphics().setDepth(2);
      for (let i = 0; i < 16; i++) this.people.push(this.add.image(0, 0, '__WHITE').setDepth(3).setVisible(false));
      this.company = this.add.image(54, 0, '__WHITE').setDepth(3).setVisible(false);
      this.parkedBike = this.add.image(546, 0, '__WHITE').setDepth(3).setVisible(false);
      this.g = this.add.graphics().setDepth(4);
      this.nice = this.add.text(300, 414, 'NICE DODGE!', { fontFamily: 'Arial Rounded MT Bold,system-ui,sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#df684d', stroke: '#fff3df', strokeThickness: 5 }).setOrigin(0.5).setDepth(5).setVisible(false);
      this.sign = this.add.text(300, 28, 'OFFICE  1000 m', { fontFamily: 'Arcade Rounded,Arial Narrow,system-ui,sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#fff3df' }).setOrigin(0.5).setDepth(5);
      this.companyLabel = this.add.text(54, 0, '弊社', { fontFamily: 'Arcade Rounded,system-ui,sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#24384a', backgroundColor: '#fff3df', padding: { x: 2, y: 0 } }).setOrigin(0.5).setDepth(5).setVisible(false);
      // Canvas text does not inherit CSS font-display swaps; rebuild the cached glyphs once ready.
      void document.fonts.load('700 16px "Arcade Rounded"', '弊社まで旅は続く').then(() => {
        if (destroyed || scene !== this || !this.companyLabel.scene) return;
        this.companyLabel.updateText(); this.sign.updateText(); this.draw();
      }).catch(() => {});
      if (pending) { pending = false; this.begin(); }
      this.draw();
    }
    begin(): void {
      run.start(); this.endAge = -1; this.reported = false; this.niceAge = 10; this.nice.setVisible(false);
      this.cameras.main.resetFX(); hooks.onUpdate(run.snapshot());
    }
    title(): void {
      run.reset(); this.endAge = -1; this.reported = true; this.niceAge = 10; this.nice.setVisible(false);
      this.cameras.main.resetFX(); this.draw();
    }
    choose(choice: WorkdayChoice): boolean {
      if (!run.choose(choice)) return false;
      hooks.onUpdate(run.snapshot());
      if (!run.alive && !this.reported) { const result = run.result(); if (result) { this.reported = true; hooks.onEnd(result); } }
      this.draw(); return true;
    }
    effect(event: WorkdayEvent): void {
      if (event.type === 'move' && !reduced) this.movePulse = 1;
      if (event.type === 'dodge') { this.niceAge = 0; this.nice.setVisible(true).setAlpha(1); }
      if (event.type === 'collision') {
        this.endAge = 0;
        if (!reduced) this.cameras.main.shake(150, 0.004);
      }
      if (event.type === 'clear' || event.type === 'safe_exit') this.endAge = 0;
    }
    update(_time: number, delta: number): void {
      if (destroyed || paused) return;
      if (run.pending) { this.draw(); return; }
      const dt = Math.min(0.05, delta / 1000);
      this.visualTime += dt;
      this.movePulse = Math.max(0, this.movePulse - dt * 7);
      if (run.alive) {
        run.step(dt); hooks.onUpdate(run.snapshot());
        if (!run.alive && !this.reported) {
          const result = run.result();
          if (result) { this.reported = true; hooks.onEnd(result); }
        }
      } else if (this.endAge >= 0) this.endAge += dt;
      this.niceAge += dt;
      if (this.niceAge < 0.9) this.nice.setAlpha(1 - this.niceAge / 0.9).setY(414 - (reduced ? 0 : this.niceAge * 22));
      else this.nice.setVisible(false);
      this.draw();
    }

    private person(x: number, y: number, player: boolean, id: number, struck = false): void {
      const g = this.g;
      const riding = player && run.mode === 'bike';
      const key = assetKey(riding ? 'rider-bike' : characters[player ? 0 : 1 + id % 5]);
      if (this.textures.exists(key) && this.personCursor < this.people.length) {
        const image = this.people[this.personCursor++];
        // The transparent 160×192 canvas preserves the original 52×63 visual envelope.
        // A shared -5px centre offset keeps head/feet aligned to the prior illustration.
        const bob = reduced || struck ? 0 : Math.sin(this.visualTime * 10 + id) * 0.65;
        const recoil = player && struck && !reduced ? Math.sin(Math.min(1, Math.max(0, this.endAge)) * Math.PI) * -0.12 : 0;
        this.shadows.fillStyle(0x24384a, 0.15); this.shadows.fillEllipse(x, y + 26, 43, 13);
        image.setTexture(key).setDisplaySize(riding ? 42 : 52, 63).setPosition(x, y - 5 + bob).setRotation(recoil).setVisible(true);
        return;
      }
      const walk = struck || reduced ? 0 : Math.sin(this.visualTime * 10 + id) * 4;
      if (riding) {
        g.fillStyle(0x24384a); g.fillRoundedRect(x - 5, y - 28, 10, 18, 4); g.fillRoundedRect(x - 5, y + 19, 10, 17, 4);
        g.lineStyle(4, 0x6a7880); g.lineBetween(x - 17, y - 10, x + 17, y - 10);
      }
      const suit = player ? 0x2b4154 : id % 3 === 0 ? 0xcc6751 : id % 3 === 1 ? 0xb85642 : 0xd89b57;
      g.fillStyle(0x283c3b, 0.12); g.fillEllipse(x, y + 26, 43, 13);
      // Legs and briefcase make the commuter recognizable without a texture.
      g.lineStyle(9, player ? 0x2b4154 : 0x59605b); g.lineBetween(x - 7, y + 8, x - 8 + walk, y + 24); g.lineBetween(x + 7, y + 8, x + 8 - walk, y + 24);
      g.fillStyle(0x273b43); g.fillRoundedRect(x - 15 + walk, y + 22, 12, 5, 2); g.fillRoundedRect(x + 3 - walk, y + 22, 12, 5, 2);
      g.lineStyle(6, suit); g.lineBetween(x - 13, y - 7, x - 19, y + 9 + walk / 2); g.lineBetween(x + 13, y - 7, x + 19, y + 9 - walk / 2);
      g.fillStyle(suit); g.fillRoundedRect(x - 14, y - 13, 28, 27, 6);
      if (player) {
        g.fillStyle(0xffffff); g.fillTriangle(x - 6, y - 12, x + 6, y - 12, x, y + 1);
        g.fillStyle(0x62ac95); g.fillTriangle(x, y - 9, x + 3, y + 7, x - 3, y + 7);
        g.lineStyle(2, 0x6b513b); g.strokeRect(x + 17, y + 4, 8, 7);
        g.fillStyle(0xb7874f); g.fillRoundedRect(x + 14, y + 10, 18, 14, 3);
      } else {
        g.lineStyle(3, 0xf5d6b0); g.lineBetween(x - 12, y - 3, x + 12, y - 3);
        g.fillStyle(0xefb689); g.fillCircle(x - 19, y + 10 + walk / 2, 4); g.fillCircle(x + 19, y + 10 - walk / 2, 4);
      }
      g.fillStyle(0xefbf95); g.fillCircle(x, y - 23, 12);
      g.fillStyle(player ? 0x283b41 : 0x66534c); g.fillEllipse(x, y - 32, 22, 10);
      g.lineStyle(2, 0x51453c);
      if (struck) {
        for (const side of [-1, 1]) { g.lineBetween(x + side * 5 - 2, y - 25, x + side * 5 + 2, y - 21); g.lineBetween(x + side * 5 - 2, y - 21, x + side * 5 + 2, y - 25); }
      } else { g.lineBetween(x - 7, y - 23, x - 3, y - 23); g.lineBetween(x + 3, y - 23, x + 7, y - 23); }
      if (!player) { g.lineBetween(x - 7, y - 28, x - 2, y - 26); g.lineBetween(x + 2, y - 26, x + 7, y - 28); }
    }

    private warning(enemy: Enemy): void {
      if (run.worldTime < enemy.warningStart || run.worldTime > enemy.changeEnd) return;
      const g = this.g; const x = enemy.x; const y = enemy.y - 62;
      g.fillStyle(0xffda6b); g.fillRoundedRect(x - 23, y - 12, 46, 24, 9);
      g.lineStyle(2, 0x8e6940); g.strokeRoundedRect(x - 23, y - 12, 46, 24, 9);
      const direction = enemy.type === 'B' ? Math.sign(enemy.finalLane - enemy.fromLane) : enemy.feintDirection;
      g.lineStyle(3, 0x584936); g.lineBetween(x - direction * 12, y, x + direction * 12, y);
      g.lineBetween(x + direction * 12, y, x + direction * 6, y - 5); g.lineBetween(x + direction * 12, y, x + direction * 6, y + 5);
      if (enemy.type === 'C') {
        g.lineBetween(x - direction * 12, y, x - direction * 6, y - 5); g.lineBetween(x - direction * 12, y, x - direction * 6, y + 5);
      } else {
        // A dashed target marker adds destination information to the directional pre-motion signal.
        g.lineStyle(2, 0xb48749, 0.45); g.strokeEllipse(laneX(enemy.finalLane), enemy.y + 28, 43, 15);
      }
    }

    private draw(): void {
      const g = this.street; g.clear(); this.g.clear(); this.shadows.clear();
      this.personCursor = 0; for (const image of this.people) image.setVisible(false);
      for (const image of this.buildings) image.setVisible(false);
      const index = run.distance <= 1000 ? Math.min(3, Math.floor(run.distance / 250)) : run.distance < 1600 ? 0 : 1 + Math.floor((run.distance - 1600) / 700) % 3;
      const colors = palettes[index];
      const active = run.alive || this.endAge >= 0;
      const scroll = (active ? run.distance * 10 : this.visualTime * 16) % 150;
      g.fillStyle(colors.verge); g.fillRect(0, 0, 600, 600);
      g.fillStyle(colors.pavement); g.fillRect(90, 0, 30, 600); g.fillRect(480, 0, 30, 600);
      g.fillStyle(0xfff3df); g.fillRect(120, 0, 360, 600);
      g.fillStyle(0xc5b89c); g.fillRect(115, 0, 5, 600); g.fillRect(480, 0, 5, 600);
      g.lineStyle(1, 0xe9ddc4, 0.52);
      for (let y = -64 + scroll % 64; y < 600; y += 64) g.lineBetween(120, y, 480, y);
      const tileScroll = (active ? run.distance * 10 : this.visualTime * 16) % 300;
      let buildingCursor = 0;
      const hasCity = this.textures.exists(assetKey(`district-${districts[index]}-left`)) && this.textures.exists(assetKey(`district-${districts[index]}-right`));
      if (hasCity) for (const [x, side] of [[0, 'left'], [510, 'right']] as const) for (let row = -1; row < 2; row++) {
        this.buildings[buildingCursor++].setTexture(assetKey(`district-${districts[index]}-${side}`)).setDisplaySize(90, 300).setPosition(x, row * 300 + tileScroll).setVisible(true);
      }
      // Distinct districts use the same small draw budget; no scene allocation on transitions.
      if (!hasCity) for (let row = -1; row < 5; row++) {
        const y = row * 150 + scroll;
        for (const x of [5, 515]) {
          g.fillStyle(colors.wall); g.fillRoundedRect(x, y, 80, index === 3 ? 122 : 95, 6);
          g.fillStyle(colors.roof); g.fillRect(x, y, 80, index === 0 ? 13 : 9);
          if (index === 0) { g.fillStyle(colors.roof); g.fillTriangle(x - 3, y, x + 40, y - 23, x + 83, y); }
          for (let j = 0; j < (index >= 2 ? 3 : 2); j++) for (let k = 0; k < 2; k++) {
            g.fillStyle(index === 3 ? 0xe9f3ed : 0xfff8de); g.fillRect(x + 12 + k * 35, y + 22 + j * 27, 19, 14);
          }
          if (index === 1) { g.fillStyle(0xffffff); g.fillRect(x, y + 45, 80, 12); for (let k = 0; k < 4; k++) { g.fillStyle(0xc87855); g.fillRect(x + k * 20, y + 45, 10, 12); } }
          if (index === 2) { g.lineStyle(3, 0x568795); g.lineBetween(x + 8, y + 88, x + 72, y + 88); }
        }
      }
      for (const x of [240, 360]) for (let y = -70 + scroll % 76; y < 650; y += 76) { g.fillStyle(0xdedacb); g.fillRoundedRect(x - 1, y, 2, 33, 1); }
      // Little planted verges and crosswalk marks ground the joke in a walkable city.
      if (!hasCity) for (const x of [105, 495]) for (let y = -80 + scroll; y < 650; y += 150) {
        g.fillStyle(0x639b7f); g.fillCircle(x, y, 10); g.fillStyle(0x8bb494); g.fillCircle(x - 3, y - 3, 7);
      }
      const crossY = 610 - ((active ? run.distance * 8 : this.visualTime * 12) % 720);
      for (let i = 0; i < 7; i++) { g.fillStyle(0xe5e0ce, 0.7); g.fillRect(133 + i * 50, crossY, 33, 13); }
      this.g.fillStyle(0x24384a); this.g.fillRoundedRect(212, 9, 176, 36, 5);
      this.g.lineStyle(2, 0xedb849); this.g.strokeRoundedRect(212, 9, 176, 36, 5);
      this.sign.setText(run.mode === 'bike' ? '旅は続く · BIKE 200%' : run.mode === 'journey' ? '旅は続く · WALK' : `弊社まで  ${Math.max(0, 1000 - Math.floor(run.distance))} m`);
      const companyY = PLAYER_Y - (1000 - run.distance) * 2;
      const companyVisible = active && run.distance > 750 && run.distance < 1110;
      this.company.setVisible(companyVisible && this.textures.exists(assetKey('company')));
      if (this.company.visible) this.company.setTexture(assetKey('company')).setDisplaySize(90, 120).setPosition(54, companyY);
      if (companyVisible && !this.company.visible) {
        this.g.fillStyle(0xe0c9a6); this.g.fillRect(9, companyY - 60, 90, 120);
        this.g.lineStyle(2, 0x24384a); this.g.strokeRect(9, companyY - 60, 90, 120);
        this.g.fillStyle(0x8cb6bf); for (let row = 0; row < 3; row++) this.g.fillRect(19, companyY - 43 + row * 28, 70, 16);
      }
      this.companyLabel.setVisible(companyVisible).setPosition(54, companyY + 25);
      const bikeY = PLAYER_Y - (2000 - run.distance) * 2;
      const bikeVisible = active && run.mode !== 'bike' && run.distance > 1770 && run.distance < 2100;
      this.parkedBike.setVisible(bikeVisible && this.textures.exists(assetKey('parked-bike')));
      if (this.parkedBike.visible) this.parkedBike.setTexture(assetKey('parked-bike')).setDisplaySize(46, 69).setPosition(546, bikeY);
      if (bikeVisible && !this.parkedBike.visible) {
        this.g.fillStyle(0x24384a); this.g.fillRoundedRect(542, bikeY - 33, 8, 18, 3); this.g.fillRoundedRect(542, bikeY + 16, 8, 18, 3);
        this.g.lineStyle(4, 0x697c84); this.g.lineBetween(526, bikeY - 9, 566, bikeY - 9); this.g.lineBetween(546, bikeY - 16, 546, bikeY + 20);
      }
      if (active) {
        for (const enemy of run.enemies) {
          if (enemy.y < -55 || enemy.y > 645) continue;
          this.person(enemy.x, enemy.y, false, enemy.id);
          if (enemy.type === 'B' || enemy.type === 'C') this.warning(enemy);
        }
      }
      const px = active ? run.playerX : laneX(1);
      if (this.movePulse > 0) { this.shadows.fillStyle(0x68a48f, this.movePulse * 0.08); this.shadows.fillEllipse(px, PLAYER_Y + 27, 68 + this.movePulse * 10, 23); }
      if (!reduced && this.niceAge < 0.28) {
        const progress = this.niceAge / 0.28;
        this.shadows.lineStyle(2, 0xedb849, (1 - progress) * 0.6);
        this.shadows.strokeEllipse(px, PLAYER_Y + 27, 54 + progress * 22, 17 + progress * 8);
      }
      this.person(px, PLAYER_Y, true, -1, run.snapshot().outcome === 'collision');
      if (run.snapshot().outcome === 'collision' && this.endAge < 0.7) {
        this.g.lineStyle(4, 0xe86c50, Math.max(0, 1 - this.endAge / 0.7));
        for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; this.g.lineBetween(px + Math.cos(a) * 31, PLAYER_Y - 15 + Math.sin(a) * 31, px + Math.cos(a) * 43, PLAYER_Y - 15 + Math.sin(a) * 43); }
      }
      // Left/right hints have persistent, shape-based arrows, apart from button controls.
      g.lineStyle(3, 0x779689, 0.55);
      for (const [x, direction] of [[172, -1], [428, 1]]) {
        g.lineBetween(x - direction * 12, 567, x + direction * 12, 567);
        g.lineBetween(x + direction * 12, 567, x + direction * 6, 561); g.lineBetween(x + direction * 12, 567, x + direction * 6, 573);
      }
    }
  }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: 600, height: 600,
    backgroundColor: '#fff3df', scene: StreetScene, antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 600, height: 600 },
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    fps: { target: 60, smoothStep: true }, render: { powerPreference: 'low-power' },
  });
  return {
    start: () => { if (destroyed) return; paused = false; if (scene) scene.begin(); else pending = true; },
    title: () => { if (destroyed) return; paused = false; pending = false; if (scene) scene.title(); else run.reset(); },
    move: direction => !destroyed && !paused && !!scene && run.move(direction),
    choose: choice => !destroyed && !paused && !!scene && scene.choose(choice),
    pause: value => { paused = value; }, snapshot: () => run.snapshot(), inspection: () => run.inspection(),
    destroy: () => { if (destroyed) return; destroyed = true; game.destroy(true); scene = null; },
  };
}
