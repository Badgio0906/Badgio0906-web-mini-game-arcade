import { ChargeRun } from './ChargeRun.ts';
import { ledge, type ChargeEvent, type Direction, type Level } from './chargeTypes.ts';

export const CHARGE_LESSONS = [
  { title: '短押しで、ちょい跳び', text: 'JUMPを短く押して離す。ほぼ上がらない、小さな跳び方。練習だけゲージが出ます。' },
  { title: 'ほどほどに溜めて登る', text: '方向なしで、身体が縮むくらい溜めて離す。中くらいの跳躍で上の棚へ。' },
  { title: 'いっぱい溜めて高く', text: '方向なしで、脚に力が入るまで長押し。離して高い棚へ。最大でも離すまで跳びません。' },
  { title: '左を押しながら跳ぶ', text: '←を押したままJUMPをほどほどに溜めて離す。左の棚に着地しよう。' },
  { title: '右を押しながら跳ぶ', text: '→を押したままJUMPをほどほどに溜めて離す。右の棚に着地しよう。' },
  { title: '飛んだら、もう変えられない', text: '左へ中くらいで跳ぶ。飛んだ後に右を押してみよう。軌道は変わらず、左の棚へ。' },
  { title: 'ちょい調整から、本命へ', text: 'まず右へ短押しで位置を整える。次に左へ長く溜め、遠くの高い棚を狙おう。' },
] as const;
export function createPracticeLevel(stage: number): Level {
  const target = stage === 1 ? ledge('target', 180, 3.6, 140) : stage === 2 ? ledge('target', 180, 7.6, 140) : stage === 3 || stage === 5 ? ledge('target', 70, 3.6, 90) : stage === 4 ? ledge('target', 290, 3.6, 90) : stage === 6 ? ledge('target', 72, 6.1, 52) : null;
  return { id: `practice-${stage}`, goal: 50, seaHeight: null, startX: stage === 6 ? 200 : 180, startY: 0, ledges: [ledge('base', 180, 0, 312, 'stone', 'practice', 'base'), ...(target ? [target] : [])], blocks: [], winds: [], sections: [{ id: 'practice', from: 0, to: 50, name: '練習', motif: 'water', purpose: CHARGE_LESSONS[stage].title }] };
}
/** Seven isolated actual charge/flight/landing lessons. No production counters or storage. */
export class ChargePractice {
  run: ChargeRun;
  stage = 0; passed = false; complete = false;
  private onPass: (stage: number) => void;
  private jump: ChargeEvent['data'] | null = null;
  private prepared = false;
  private airAttempt = false;
  constructor(onPass: (stage: number) => void = () => {}) { this.onPass = onPass; this.run = this.makeRun(); }
  private makeRun(): ChargeRun { return new ChargeRun(createPracticeLevel(this.stage), e => this.observe(e)); }
  get lesson() { return CHARGE_LESSONS[this.stage]; }
  direction(d: Direction): void { if (!this.run.player.grounded && this.stage === 5 && d === 1) this.airAttempt = true; this.run.setDirection(d); }
  update(dt: number): void { if (!this.passed && !this.complete) this.run.update(dt); }
  private observe(e: ChargeEvent): void {
    if (e.type === 'jump') { this.jump = e.data; this.airAttempt = false; }
    if (e.type !== 'land' || !this.jump || this.passed) return;
    const band = this.jump.jump_band, dir = this.jump.jump_direction;
    if (this.stage === 6 && band === 'short' && dir === 1 && e.data.ledge_id === 'base' && this.run.player.x >= 220) this.prepared = true;
    const valid = this.stage === 0 ? band === 'short' : this.stage === 1 ? band === 'medium' && dir === 0 : this.stage === 2 ? band === 'long' && dir === 0 : this.stage === 3 ? band === 'medium' && dir === -1 : this.stage === 4 ? band === 'medium' && dir === 1 : this.stage === 5 ? band === 'medium' && dir === -1 && this.airAttempt : this.prepared && band === 'long' && dir === -1;
    if (valid && (this.stage === 0 || e.data.ledge_id === 'target') && e.data.success === true) { this.passed = true; this.onPass(this.stage); }
    this.jump = null;
  }
  next(): boolean {
    if (!this.passed || this.complete) return false;
    if (this.stage === 6) { this.complete = true; return true; }
    this.stage++; this.passed = this.prepared = this.airAttempt = false; this.jump = null; this.run = this.makeRun(); return true;
  }
}
