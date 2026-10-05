import { AIR_ACCELERATION, AIR_DRAG, GRAVITY, MAX_HORIZONTAL_SPEED, PIXELS_PER_METER, PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_WALL_MARGIN, SCROLL_START_SPEED, SCROLL_TOP_LIMIT, TERMINAL_VELOCITY, WORLD_WIDTH } from '../games/game015/types';
export const PRACTICE_START_Y = 112;
interface PracticePlatform { x: number; y: number; width: number; type?: 'normal' | 'soft' }
interface PracticeHazard { kind: 'spikes'; x: number; y: number; width: number; height: number }
/** Small isolated lesson physics. No production run, storage, score or telemetry access. */
export interface FallPracticeSnapshot {
  x: number; y: number; vx: number; vy: number; grounded: boolean; fallDistance: number;
  target: PracticePlatform; platforms: PracticePlatform[]; heldDrop: boolean; passedPlatforms: number; startPlatform: PracticePlatform; hazards: PracticeHazard[]; ghost: boolean;
  cameraY: number; scrollSpeed: number; topRemaining: number; cause: 'spike' | 'scroll' | 'impact' | null;
  phase: 'grounded' | 'falling' | 'landed' | 'ghost' | 'splat';
  step: number; complete: boolean; feedback: string;
}
export class FallPractice {
  private s: FallPracticeSnapshot = this.setup(0);
  private input = 0;
  private clock = 0;
  private heldDrop = false;
  private setup(step: number): FallPracticeSnapshot {
    const target = step === 3 ? { x: 48, y: 256, width: 160, type: 'soft' as const } : step === 4 ? { x: 48, y: 272, width: 160 } : step === 1 ? { x: 168, y: 204, width: 64 } : step === 2 ? { x: 24, y: 204, width: 64 } : { x: 48, y: 192, width: 160 };
    return { x: 128, y: PRACTICE_START_Y, vx: 0, vy: 0, grounded: step !== 4, fallDistance: 0,
      target, heldDrop: false, passedPlatforms: 0, platforms: step === 3 ? [{ x: 48, y: 152, width: 160 }, { x: 48, y: 192, width: 160 }] : [], startPlatform: { x: 66, y: PRACTICE_START_Y, width: 124 },
      hazards: step === 1 || step === 2 ? [{ kind: 'spikes', x: 104, y: 170, width: 48, height: 16 }] : [],
      cameraY: 0, scrollSpeed: SCROLL_START_SPEED, topRemaining: PRACTICE_START_Y - SCROLL_TOP_LIMIT, cause: null,
      ghost: step >= 4, phase: step === 5 ? 'ghost' : step === 4 ? 'falling' : 'grounded', step, complete: false,
      feedback: ['1 / 6 · DROPで、下の大きな足場へ。', '2 / 6 · 中央にトゲ！ DROPして右→の足場へ。', '3 / 6 · 今度は左←へ。中央のトゲを避けてDROP。', '4 / 6 · DROPを押し続けて2枚の床を通過。やわらかい床へ連続降下！', '5 / 6 · 欲張りすぎると危険。ゴーストが10m落ちて石の床へ。', '6 / 6 · ゴーストが待つと、足場ごと上へ流されます。'][step] };
  }
  snapshot(): FallPracticeSnapshot { return { ...this.s, platforms: this.s.platforms.map(p => ({ ...p })), target: { ...this.s.target }, startPlatform: { ...this.s.startPlatform }, hazards: this.s.hazards.map(h => ({ ...h })) }; }
  setInput(input: number): void { if (!this.s.complete && (input === -1 || input === 0 || input === 1)) this.input = input; }
  setDropHeld(held: boolean): void { if (this.s.complete || this.s.ghost) return; this.heldDrop = held; this.s.heldDrop = held; if (held) this.drop(); }
  drop(): void { if (this.s.complete || this.s.phase !== 'grounded') return; this.s.grounded = false; this.s.phase = 'falling'; this.s.vy = 0; this.clock = 0; }
  private retry(cause: 'spike' | 'scroll' | 'impact' | null, feedback: string): void {
    this.s = this.setup(this.s.step); this.s.cause = cause; this.s.feedback = feedback; this.input = 0; this.clock = 0; this.heldDrop = false;
  }
  update(dt: number): void {
    const s = this.s; if (s.complete || !Number.isFinite(dt) || dt <= 0) return; dt = Math.min(dt, .05);
    this.clock += dt;
    if (s.phase === 'splat') {
      if (this.clock >= 1.2) { if (s.step === 4) { this.s = this.setup(5); this.clock = 0; } else { s.complete = true; s.step = 6; s.feedback = '操作はOK！ 離して刻むか、押し続けて欲張るか。やわらかい床も選び、天井から逃げよう。'; } }
      return;
    }
    s.cameraY += s.scrollSpeed * dt; s.topRemaining = s.y - s.cameraY - SCROLL_TOP_LIMIT;
    if (s.phase === 'landed') {
      if (this.clock >= .85) { this.s = this.setup(s.step + 1); this.input = 0; this.clock = 0; this.heldDrop = false; }
      return;
    }
    if (s.topRemaining <= 0) {
      if (s.ghost) { s.phase = 'splat'; s.cause = 'scroll'; s.feedback = '待ちすぎると上端に追いつかれます。足場を選んで下へ急ごう！'; this.clock = 0; }
      else this.retry('scroll', '上端に追いつかれました。練習は何度でもOK！ 次の足場へDROPしよう。');
      return;
    }
    if (s.grounded) return;
    s.vx = Math.max(-MAX_HORIZONTAL_SPEED, Math.min(MAX_HORIZONTAL_SPEED, s.vx + (this.input * AIR_ACCELERATION - AIR_DRAG * s.vx) * dt));
    s.x = Math.max(PLAYER_WALL_MARGIN, Math.min(WORLD_WIDTH - PLAYER_WALL_MARGIN, s.x + s.vx * dt));
    const oldY = s.y; s.vy = Math.min(TERMINAL_VELOCITY, s.vy + GRAVITY * dt); s.y += s.vy * dt; s.fallDistance = (s.y - PRACTICE_START_Y) / PIXELS_PER_METER;
    s.topRemaining = s.y - s.cameraY - SCROLL_TOP_LIMIT;
    if (s.hazards.some(h => s.x + PLAYER_WIDTH / 2 > h.x && s.x - PLAYER_WIDTH / 2 < h.x + h.width && s.y >= h.y && s.y - PLAYER_HEIGHT <= h.y + h.height)) {
      this.retry('spike', `中央はトゲです。DROPしたら${s.step === 1 ? '右→' : '左←'}へ動こう。`); return;
    }
    for (const p of s.platforms) {
      if (oldY < p.y && s.y >= p.y) {
        if (this.heldDrop) s.passedPlatforms++;
        else { this.retry(null, '途中の床で止まりました。DROPを離さず押し続けて2枚を通過しよう！'); return; }
      }
    }
    const t = s.target;
    if (oldY <= t.y && s.y >= t.y && s.x + PLAYER_WIDTH / 2 > t.x && s.x - PLAYER_WIDTH / 2 < t.x + t.width) {
      s.y = t.y; s.fallDistance = (t.y - PRACTICE_START_Y) / PIXELS_PER_METER; s.vx = s.vy = 0; s.grounded = true; s.topRemaining = s.y - s.cameraY - SCROLL_TOP_LIMIT;
      this.clock = 0; this.input = 0; s.phase = 'landed'; if (s.step === 4) { s.phase = 'splat'; s.cause = 'impact'; s.feedback = '10mの着地衝撃！ 石の床は9m以上で失敗。やわらかい床でも12m以上は危険。'; return; } s.feedback = s.step === 3 ? 'ホールドで連続降下できました！ 途中の床では落下距離がリセットされません。' : s.step === 0 ? '着地できました！ 次は中央のトゲを避けよう。' : 'トゲを避けて安全に着地！ 次の練習へ。';
    }
    if (s.y > 420) this.retry(null, `足場を通り過ぎました。DROPして${s.step === 2 ? '左←' : '右→'}の足場へ。`);
  }
}
