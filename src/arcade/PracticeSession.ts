import { FallPractice, type FallPracticeSnapshot } from './FallPractice';
export type PracticeAction = 'left' | 'right' | 'action' | 'board' | 'reject' | 'stamp-red' | 'stamp-other' | 'unko' | 'ukon' | `cell-${number}`;
export interface PracticeSnapshot {
  gameId: string; step: number; elapsed: number; complete: boolean; feedback: string;
  lane: number; enemyLane: number; angle: number; x: number; moving: boolean; light: number; phase: string;
  tilt: number; input: number; mode: string; practicePoints: number; power: number; choiceLeft: 'unko' | 'ukon'; fall?: FallPracticeSnapshot;
}
/** Independent, forgiving training simulations: no production run, score, credit or BEST access. */
export class PracticeSession {
  private s: PracticeSnapshot;
  private phaseTime = 0;
  private fall?: FallPractice;
  constructor(gameId: string, random = Math.random) {
    this.s = { gameId, step: 0, elapsed: 0, complete: false, feedback: '', lane: 1, enemyLane: 1,
      angle: -Math.PI / 2, x: 150, moving: false, light: -1, phase: 'practice', tilt: .35,
      input: 0, mode: 'listen', practicePoints: 0, power: .75, choiceLeft: random() < .5 ? 'unko' : 'ukon' };
    if (gameId === 'game004') this.s.phase = 'watch';
    if (gameId === 'game006') this.s.angle = 0;
    if (gameId === 'game015') { this.fall = new FallPractice(); this.syncFall(); }
  }
  snapshot(): PracticeSnapshot { return { ...this.s, ...(this.fall ? { fall: this.fall.snapshot() } : {}) }; }
  setInput(input: -1 | 0 | 1): void { this.s.input = input; this.fall?.setInput(input); }
  private syncFall(): void { if (!this.fall) return; const f = this.fall.snapshot(); this.s.fall = f; this.s.step = f.step; this.s.phase = f.phase; this.s.complete = f.complete; this.s.feedback = f.feedback; }
  private done(): void { this.s.complete = true; this.s.phase = 'success'; this.s.feedback = 'できました！ この操作で、本番も遊べます。'; }
  private next(message: string): void { this.s.step++; this.phaseTime = 0; this.s.feedback = message; }
  action(action: PracticeAction): void {
    const s = this.s;
    if (s.complete) return;
    if (this.fall) { if (action === 'action') this.fall.drop(); this.syncFall(); return; }
    s.feedback = '';
    switch (s.gameId) {
      case 'game001': if (action === 'action') s.lane = s.lane === 1 ? 0 : 1; break;
      case 'game002':
        if (action === 'left') s.lane = Math.max(0, s.lane - 1);
        if (action === 'right') s.lane = Math.min(2, s.lane + 1);
        break;
      case 'game003':
        if (action !== 'action' || s.moving) break;
        if (s.x < 160 || s.x > 440) { s.feedback = '土台の上でDROP。もう一度どうぞ！'; break; }
        s.moving = true; this.phaseTime = 0; break;
      case 'game004':
        if (s.phase !== 'recall' || !action.startsWith('cell-')) break;
        if (action === `cell-${s.step === 0 ? 0 : 4}`) {
          this.next(s.step === 0 ? '正解！ 次に光った場所を押そう。' : '順番どおり！');
          if (s.step === 2) this.done();
        } else { s.step = 0; s.feedback = '左上 → 真ん中。まちがえても、もう一度。'; }
        break;
      case 'game005':
        if (action !== 'left' && action !== 'right') break;
        if (action === (s.step === 0 ? 'left' : 'right')) { this.next('正解！ 次は角ばった荷物を右へ。'); if (s.step === 2) this.done(); }
        else s.feedback = '今のルールは、丸いものが左・角ばったものが右です。';
        break;
      case 'game006':
        if (action !== 'action' || s.moving) break;
        this.next(s.step === 0 ? '角度OK！ 次は強さを決めて。' : '車が動きます。');
        if (s.step === 2) s.moving = true;
        break;
      case 'game007':
        if (s.phase === 'boarding') break;
        if (action !== 'board' && action !== 'reject') break;
        if (action === (s.step === 0 ? 'board' : 'reject')) { this.next(s.step === 0 ? '乗せました！ 200 + 60 = 260 kg。' : '見送り成功！ 40 kgの超過を防ぎました。'); if (s.step === 1) s.phase = 'boarding'; if (s.step === 2) this.done(); }
        else s.feedback = s.step === 0 ? 'あと250 kg空き。60 kgの人は乗せられます。' : '410 + 80 = 490 kg。40 kg超過するので見送ろう。';
        break;
      case 'game009': if (action === 'stamp-red') { this.next('赤い印鑑、見つけました！'); this.done(); } else s.feedback = '探しているのは赤い印鑑。時間制限なしでもう一度！'; break;
      case 'game010':
        if (action !== 'action') break;
        s.mode = s.mode === 'listen' ? 'work' : 'listen';
        if (s.step === 0 && s.mode === 'work') this.next('内職できています。「ところで…」が聞こえたら戻ろう。');
        else if (s.step === 1 && s.mode === 'listen') {
          if (this.phaseTime >= 1.7) { this.next('聞く姿勢に戻れました。質問も安心！'); this.done(); }
          else { s.feedback = 'まだ大丈夫。内職して、上司の予兆を待とう。'; }
        }
        break;
      case 'game011':
        if (action !== 'unko' && action !== 'ukon') break;
        if (action === 'unko') { this.next('正解！ 画像を見て、文字の方を選ぼう。'); this.done(); }
        else s.feedback = 'これはウンコです。ボタンの文字を見て、もう一度！';
        break;
    }
  }
  update(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds <= 0 || this.s.complete) return;
    const dt = Math.min(seconds, .1), s = this.s;
    s.elapsed += dt; this.phaseTime += dt;
    if (this.fall) { this.fall.update(dt); this.syncFall(); return; }
    switch (s.gameId) {
      case 'game001':
        s.angle += dt * .8;
        if (s.angle >= .65) {
          if (s.lane === 0) { this.next('赤い障害をかわしました！'); this.done(); }
          else { s.angle = -Math.PI / 2; s.feedback = '赤い障害は内側。外側へ切り替えてかわそう！'; }
        } break;
      case 'game002':
        if (this.phaseTime > 2.2) {
          const blocked = s.enemyLane;
          if (s.lane !== blocked) { s.enemyLane = s.lane; this.next(s.step === 0 ? '1人目を回避！ 次は今いるレーンに人が来ます。' : '2人とも回避！'); if (s.step === 2) this.done(); }
          else { this.phaseTime = 0; s.feedback = '人のいないレーンへ。ぶつかっても、練習は続けられます。'; }
        } break;
      case 'game003': s.x = s.moving ? s.x : 250 + Math.sin(s.elapsed * .75) * 140; if (s.moving && this.phaseTime > .75) { this.next('ブロックを積めました！'); this.done(); } break;
      case 'game004':
        if (s.phase === 'watch') {
          s.light = s.elapsed < .3 ? -1 : s.elapsed < 1.15 ? 0 : s.elapsed < 1.5 ? -1 : s.elapsed < 2.35 ? 4 : -1;
          if (s.elapsed > 2.7) { s.phase = 'recall'; s.feedback = 'あなたの番。同じ順番で押そう。'; }
        } break;
      case 'game006':
        if (s.step === 0) s.angle = Math.sin(s.elapsed * .75) * .18;
        else if (s.step === 1) s.power = .75 + Math.sin(this.phaseTime * .8) * .15;
        else if (s.moving && this.phaseTime > 1.1) {
          const x = 360 + (s.power - .75) * 60, y = 165 + s.angle * 50;
          if (x >= 338 && x + 100 <= 493 && y >= 125 && y + 55 <= 265) this.done();
        } break;
      case 'game007': if (s.phase === 'boarding' && this.phaseTime > 1.1) { s.phase = 'practice'; s.feedback = '次の練習：410 kg ＋ NEXT 80 kg。見送ると安全！'; } break;
      case 'game008':
        // Positive slope makes the LEFT edge higher, exactly as in the real CoffeeBoard.
        s.tilt = Math.max(-.4, Math.min(.4, s.tilt - s.input * dt * .38));
        if (Math.abs(s.tilt) < .055 && s.elapsed > .7) { this.next('右へ補正して、水面が中央へ戻りました！'); this.done(); }
        break;
      case 'game010': if (s.step === 1 && s.mode === 'work') s.practicePoints += dt * 10; break;
    }
  }
  phaseSeconds(): number { return this.phaseTime; }
}
