import { AIR_ACCELERATION, AIR_DRAG, GRAVITY, MAX_HORIZONTAL_SPEED, PIXELS_PER_METER, PLAYER_WIDTH, PLAYER_WALL_MARGIN, TERMINAL_VELOCITY, WORLD_WIDTH } from '../games/game015/types';
export const PRACTICE_START_Y = 112;
/** Small isolated lesson physics. No production run, storage, score or telemetry access. */
export interface FallPracticeSnapshot {
  x: number; y: number; vx: number; vy: number; grounded: boolean; fallDistance: number;
  target: { x: number; y: number; width: number }; ghost: boolean;
  phase: 'grounded' | 'falling' | 'landed' | 'ghost' | 'splat';
  step: number; complete: boolean; feedback: string;
}
export class FallPractice {
  private s: FallPracticeSnapshot = this.setup(0);
  private input = 0;
  private clock = 0;
  private setup(step: number): FallPracticeSnapshot {
    const target = step === 1 ? { x: 140, y: 197, width: 96 } : step === 2 ? { x: 60, y: 195.2, width: 136 } : step === 3 ? { x: 42, y: 302, width: 172 } : { x: 48, y: 192, width: 160 };
    return { x: step === 1 ? 92 : 128, y: PRACTICE_START_Y, vx: 0, vy: 0, grounded: step !== 3, fallDistance: 0, target, ghost: step === 3, phase: step === 3 ? 'ghost' : 'grounded', step, complete: false,
      feedback: ['1 / 4 · DROPで、下の大きな足場へ。', '2 / 4 · DROPして、右→を押して移動。離すと少し流れます。', '3 / 4 · FALLメーターを見ながら、安全に着地。', '4 / 4 · ゴーストの長い落下を見てみよう。'][step] };
  }
  snapshot(): FallPracticeSnapshot { return { ...this.s, target: { ...this.s.target } }; }
  setInput(input: number): void { if (input === -1 || input === 0 || input === 1) this.input = input; }
  drop(): void { if (this.s.phase !== 'grounded') return; this.s.grounded = false; this.s.phase = 'falling'; this.s.vy = 0; this.clock = 0; }
  update(dt: number): void {
    const s = this.s; if (s.complete || !Number.isFinite(dt) || dt <= 0) return; dt = Math.min(dt, .05);
    this.clock += dt;
    if (s.phase === 'landed') {
      if (this.clock >= .85) { this.s = this.setup(s.step + 1); this.input = 0; this.clock = 0; }
      return;
    }
    if (s.phase === 'splat') { if (this.clock >= 1.2) { s.complete = true; s.step = 4; s.feedback = '操作はOK！ トゲ・壁の予兆・鳥を見て、DROPのタイミングを選ぼう。'; } return; }
    if (s.phase === 'grounded') return;
    s.vx = s.ghost ? 0 : Math.max(-MAX_HORIZONTAL_SPEED, Math.min(MAX_HORIZONTAL_SPEED, s.vx + (this.input * AIR_ACCELERATION - AIR_DRAG * s.vx) * dt));
    s.x = Math.max(PLAYER_WALL_MARGIN, Math.min(WORLD_WIDTH - PLAYER_WALL_MARGIN, s.x + s.vx * dt));
    const oldY = s.y; s.vy = Math.min(TERMINAL_VELOCITY, s.vy + GRAVITY * dt); s.y += s.vy * dt; s.fallDistance = (s.y - PRACTICE_START_Y) / PIXELS_PER_METER;
    const t = s.target;
    if (oldY <= t.y && s.y >= t.y && s.x + PLAYER_WIDTH / 2 > t.x && s.x - PLAYER_WIDTH / 2 < t.x + t.width) {
      s.y = t.y; s.fallDistance = (t.y - PRACTICE_START_Y) / PIXELS_PER_METER; s.vx = s.vy = 0; s.grounded = true; this.clock = 0; this.input = 0;
      if (s.ghost) { s.phase = 'splat'; s.feedback = '落ちすぎると、着地衝撃に耐えられません。'; }
      else { s.phase = 'landed'; s.feedback = s.step === 2 ? 'FALL 5.2 m · SAFE！ 安全に着地できました。' : '着地できました！ 次の練習へ。'; }
    }
    if (s.y > 420) { this.s = this.setup(s.step); this.s.feedback = '足場を通り過ぎました。DROPして、右へ移動してみよう。'; this.input = 0; this.clock = 0; }
  }
}
