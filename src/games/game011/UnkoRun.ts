import type { QuizAnswer, QuizImage, QuizPhase, QuizQuestion, QuizSide, QuizText, UnkoEvent, UnkoInspection, UnkoResult, UnkoSnapshot } from './contracts';

export const IMAGE_FIRST_SECONDS = 5;
export const IMAGE_SECONDS = 1;
export const TEXT_SECONDS = 0.8;
export const FINAL_SECONDS = 0.5;
export const IMAGE_POOL: readonly QuizImage[] = Object.freeze((['unko', 'ukon'] as const).flatMap(answer => Array.from({ length: 10 }, (_, i) => Object.freeze({
  id: `${answer}-${String(i + 1).padStart(2, '0')}`, answer, asset: `assets/game011/icons/${answer}-${String(i + 1).padStart(2, '0')}.webp`,
}))));
const textLines = [
  'トイレで出会う可能性が高いのはどっち？',
  'カレーの香辛料として使われるのはどっち？',
  '犬の散歩中、袋に入れて持ち帰るのはどっち？',
  '健康食品売り場で見かける可能性が高いのはどっち？',
  '道で踏んだらかなり嫌なのはどっち？',
  '黄色っぽい植物の根茎なのはどっち？',
  '「ちゃんと流した？」と言われそうなのはどっち？',
  '粉末になって料理に使われることがあるのはどっち？',
  'トイレットペーパーとの関係が深いのはどっち？',
  'ショウガの仲間なのはどっち？',
  '検便で提出するものなのはどっち？',
  'サプリメントの商品名で見かけそうなのはどっち？',
  '公園でうっかり踏みたくないのはどっち？',
  '畑で育てて収穫できるのはどっち？',
  '水洗トイレのレバーを押す理由になりやすいのはどっち？',
  '飲み会前のドリンク商品で見かける言葉はどっち？',
  '便器の中にあっても特に不思議ではないのはどっち？',
  '料理を黄色っぽくする香辛料として使われるのはどっち？',
  '人間のお腹から出てくるのはどっち？',
  '食材・香辛料として利用されるのはどっち？',
] as const;
export const TEXT_POOL: readonly QuizText[] = Object.freeze(textLines.map((text, i) => Object.freeze({ id: `Q${String(i + 1).padStart(2, '0')}`, text, answer: i % 2 === 0 ? 'unko' as const : 'ukon' as const })));
export const answerLabel = (answer: QuizAnswer): string => answer === 'unko' ? 'ウンコ' : 'ウコン';
const isTimed = (phase: QuizPhase): boolean => phase === 'image_answer' || phase === 'text_answer' || phase === 'final_answer';

/** Pure constant-time quiz clock: elapsed real time is consumed fully, not capped like a physics integrator. */
export class UnkoRun {
  private alive = false;
  private phase: QuizPhase = 'image_answer';
  private roundId = 0;
  private time = 0;
  private score = 0;
  private imageCorrect = 0;
  private textCorrect = 0;
  private finalMode: QuizAnswer | null = null;
  private finalStreak = 0;
  private question: QuizQuestion | null = null;
  private choices: [QuizAnswer, QuizAnswer] | null = null;
  private answerElapsed = 0;
  private deadline: number | null = null;
  private images: QuizImage[] = [];
  private texts: QuizText[] = [];
  private ending: UnkoResult | null = null;
  constructor(private readonly emit: (event: UnkoEvent) => void = () => {}, private readonly random: () => number = Math.random) {}
  reset(): void {
    this.alive = false; this.phase = 'image_answer'; this.roundId = this.time = this.score = this.imageCorrect = this.textCorrect = this.finalStreak = this.answerElapsed = 0;
    this.finalMode = null; this.question = null; this.choices = null; this.deadline = null; this.images = []; this.texts = []; this.ending = null;
  }
  start(): void {
    this.reset(); this.images = this.shuffle(IMAGE_POOL).slice(0, 10).map(i => ({ ...i })); this.texts = this.shuffle(TEXT_POOL).slice(0, 10).map(t => ({ ...t }));
    this.alive = true; this.imageQuestion();
  }
  input(side: QuizSide, expectedRoundId = this.roundId): boolean {
    if (!this.alive || !isTimed(this.phase) || !this.choices || expectedRoundId !== this.roundId || (side !== 'left' && side !== 'right')) return false;
    const actual = this.choices[side === 'left' ? 0 : 1];
    if (actual !== this.question!.answer) { this.finish('wrong', actual); return true; }
    const kind = this.question!.kind; const points = kind === 'image' ? 100 : kind === 'text' ? 150 : 250;
    this.score += points;
    if (kind === 'image') this.imageCorrect++; else if (kind === 'text') this.textCorrect++; else this.finalStreak++;
    this.emit({ type: 'correct', kind, points, score: this.score });
    if (kind === 'image') {
      if (this.imageCorrect === 1) this.untimed('speed_warning');
      else if (this.imageCorrect === 10) this.untimed('text_intro');
      else this.imageQuestion();
    } else if (kind === 'text') {
      if (this.textCorrect === 10) { this.question = null; this.untimed('final_choice'); }
      else this.textQuestion();
    } else this.finalQuestion();
    return true;
  }
  advance(): boolean {
    if (!this.alive) return false;
    if (this.phase === 'speed_warning') { this.imageQuestion(); return true; }
    if (this.phase === 'text_intro') { this.textQuestion(); return true; }
    return false;
  }
  ready(): boolean {
    if (!this.alive || this.phase !== 'text_read') return false;
    this.timed('text_answer', TEXT_SECONDS); this.emit({ type: 'ready', roundId: this.roundId }); return true;
  }
  chooseFinal(mode: QuizAnswer): boolean {
    if (!this.alive || this.phase !== 'final_choice' || (mode !== 'unko' && mode !== 'ukon')) return false;
    this.finalMode = mode; this.finalQuestion(); this.emit({ type: 'final_mode', mode }); return true;
  }
  step(seconds: number): void {
    if (!this.alive || !Number.isFinite(seconds) || seconds <= 0) return;
    if (!isTimed(this.phase) || this.deadline === null) { this.time += seconds; return; }
    const elapsed = Math.min(seconds, Math.max(0, this.deadline - this.answerElapsed));
    this.time += elapsed; this.answerElapsed += elapsed;
    if (this.answerElapsed >= this.deadline) this.finish('timeout', null);
  }
  private shuffle<T>(pool: readonly T[]): T[] {
    const result = [...pool];
    for (let i = result.length - 1; i > 0; i--) { const j = Math.min(i, Math.max(0, Math.floor(this.random() * (i + 1)))); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  }
  private positions(): [QuizAnswer, QuizAnswer] { return this.random() < 0.5 ? ['unko', 'ukon'] : ['ukon', 'unko']; }
  private timed(phase: QuizPhase, seconds: number): void {
    this.phase = phase; this.deadline = seconds; this.answerElapsed = 0; this.choices = this.positions(); this.roundId++; this.emit({ type: 'phase', phase });
  }
  private untimed(phase: QuizPhase): void {
    this.phase = phase; this.deadline = null; this.answerElapsed = 0; this.choices = null; this.roundId++; this.emit({ type: 'phase', phase });
  }
  private imageQuestion(): void {
    const image = this.images[this.imageCorrect]; this.question = { id: image.id, kind: 'image', answer: image.answer, image: image.asset, text: 'ウンコ？ ウコン？' };
    this.timed('image_answer', this.imageCorrect === 0 ? IMAGE_FIRST_SECONDS : IMAGE_SECONDS);
  }
  private textQuestion(): void {
    const text = this.texts[this.textCorrect]; this.question = { id: text.id, kind: 'text', answer: text.answer, image: null, text: text.text };
    this.untimed('text_read');
  }
  private finalQuestion(): void {
    this.question = { id: `final-${this.finalStreak + 1}`, kind: 'final', answer: this.finalMode!, image: null, text: `いつも ${answerLabel(this.finalMode!)} を押す！` };
    this.timed('final_answer', FINAL_SECONDS);
  }
  private finish(outcome: UnkoResult['outcome'], actual: QuizAnswer | null): void {
    if (!this.alive || !this.question) return;
    this.alive = false; this.phase = 'ended';
    this.ending = { score: this.score, time: this.time, imageCorrect: this.imageCorrect, textCorrect: this.textCorrect, finalMode: this.finalMode, finalStreak: this.finalStreak,
      outcome, reason: outcome === 'timeout' ? '時間切れ！' : 'あっ、そっちではありません。', question: { ...this.question }, expected: this.question.answer, actual };
    this.emit(outcome === 'wrong' ? { type: 'wrong', expected: this.question.answer, actual: actual! } : { type: 'timeout', expected: this.question.answer });
  }
  snapshot(): UnkoSnapshot {
    return { alive: this.alive, phase: this.phase, roundId: this.roundId, time: this.time, score: this.score, imageCorrect: this.imageCorrect, textCorrect: this.textCorrect,
      finalMode: this.finalMode, finalStreak: this.finalStreak, question: this.question ? { ...this.question } : null, choices: this.choices ? [...this.choices] : null,
      deadline: this.deadline, remaining: isTimed(this.phase) && this.deadline !== null ? Math.max(0, this.deadline - this.answerElapsed) : null, answerElapsed: this.answerElapsed };
  }
  inspection(): UnkoInspection {
    return { ...this.snapshot(), answerSide: this.choices && this.question ? this.choices[0] === this.question.answer ? 'left' : 'right' : null,
      imageSelection: this.images.map(i => ({ ...i })), textSelection: this.texts.map(t => ({ ...t })) };
  }
  result(): UnkoResult | null { return this.ending ? { ...this.ending, question: { ...this.ending.question } } : null; }
}
