import { FrogRun } from './FrogRun';
import type { Direction, FrogEvent, JumpSize } from './types';

export const PRACTICE_LESSONS = [
  { title: '小：足元をちょい調整', text: '←か→を選んで「小」。着地まで見よう。小はほぼ高さを上げず、位置を直すジャンプ。', size: 'small' },
  { title: '中：となりの足場へ', text: '←を選んで「中」。少し高い足場へ。空中では方向を変えられないので、跳ぶ前に選ぼう。', size: 'medium' },
  { title: '大：高い足場を狙う', text: '→を選んで「大」。高く跳べるぶん、着地点を見てから跳ぼう。', size: 'large' },
  { title: '風：流され方を見る', text: '風の矢印を見て、←か→と「中」を選ぼう。風はジャンプ中の移動と高さに影響する。', size: 'medium' },
] as const;

/** An isolated physics run. Completing a lesson requires the actual matching jump and landing. */
export class FrogPractice {
  readonly run: FrogRun;
  stage = 0;
  complete = false;
  passed = false;
  private attempted = false;
  private launchX = 0;
  private launchY = 0;
  constructor(private readonly onPass: (stage: number) => void = () => {}) {
    this.run = new FrogRun(event => this.observe(event));
    this.start();
  }
  start(): void { this.stage = 0; this.complete = this.passed = this.attempted = false; this.run.startPractice(0); }
  get lesson() { return PRACTICE_LESSONS[Math.min(this.stage, PRACTICE_LESSONS.length - 1)]; }
  jump(size: JumpSize, direction: Direction): boolean {
    if (this.complete || this.passed) return false;
    const p = this.run.snapshot().player;
    this.launchX = p.x; this.launchY = p.y;
    const started = this.run.jump(size, direction);
    this.attempted = started && size === this.lesson.size && (this.stage === 0 || this.stage === 3 ? direction !== 0 : true);
    return started;
  }
  update(dt: number): void { if (!this.complete) this.run.update(dt); }
  private observe(event: FrogEvent): void {
    if (event.type !== 'land' || !this.attempted || this.passed) return;
    const p = this.run.snapshot().player;
    const valid = this.stage === 0 ? Math.abs(p.x - this.launchX) >= 8 : this.stage === 1 ? p.y > this.launchY + 8 : this.stage === 2 ? p.y > this.launchY + 45 : true;
    if (!valid) { this.attempted = false; return; }
    this.passed = true; this.onPass(this.stage);
  }
  next(): boolean {
    if (!this.passed || this.complete) return false;
    if (this.stage === PRACTICE_LESSONS.length - 1) { this.complete = true; return true; }
    this.stage++; this.passed = this.attempted = false; this.run.startPractice(this.stage); return true;
  }
}
