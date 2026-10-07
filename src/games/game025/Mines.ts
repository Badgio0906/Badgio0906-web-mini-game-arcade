export const RULES = '1';
export const GENERATOR = 'public-subset-v1';
export type Difficulty = 'beginner' | 'intermediate';
export type Outcome = 'active' | 'won' | 'lost';
export type Action = { type: 'open' | 'flag' | 'chord'; cell: number };
export type Deduction = { cell: number; kind: 'safe' | 'mine'; reason: string };
export type Visible = { width: number; height: number; total: number; cells: (number | null)[] };
export type Proof = { generator: string; start: number; steps: Deduction[]; verified: boolean };
export const config = (d: Difficulty) => d === 'beginner' ? { width: 9, height: 9, total: 10 } : { width: 16, height: 16, total: 40 };
export function neighbors(cell: number, width: number, height: number): number[] {
  const x = cell % width, y = Math.floor(cell / width), result: number[] = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, ny = y + dy;
    if ((dx || dy) && nx >= 0 && nx < width && ny >= 0 && ny < height) result.push(ny * width + nx);
  }
  return result;
}
export function counts(mines: readonly boolean[], width: number, height: number): number[] {
  return mines.map((_, i) => neighbors(i, width, height).filter(j => mines[j]).length);
}
/** The deduction boundary accepts only public revealed numbers, dimensions and mine total.
 * User flags and answer positions are deliberately absent from this signature. */
export function deductions(view: Visible): Deduction[] {
  const knownMines = new Map<number, string>(), knownSafe = new Map<number, string>();
  type Constraint = { cells: number[]; total: number; reason: string };
  for (let round = 0; round < view.cells.length; round++) {
    const constraints: Constraint[] = [];
    for (let i = 0; i < view.cells.length; i++) if (view.cells[i] !== null) {
      const around = neighbors(i, view.width, view.height), cells = around.filter(j => view.cells[j] === null && !knownMines.has(j) && !knownSafe.has(j));
      const total = view.cells[i]! - around.filter(j => knownMines.has(j)).length;
      if (cells.length) constraints.push({ cells, total, reason: `${Math.floor(i / view.width) + 1}行${i % view.width + 1}列の「${view.cells[i]}」と確定済みの周囲` });
    }
    const unknown = view.cells.flatMap((v, i) => v === null && !knownMines.has(i) && !knownSafe.has(i) ? [i] : []);
    if (unknown.length) constraints.push({ cells: unknown, total: view.total - knownMines.size, reason: '盤面の地雷総数と確定した地雷数' });
    let changed = false;
    function conclude(c: Constraint): void {
      if (c.total !== 0 && c.total !== c.cells.length) return;
      const mine = c.total !== 0;
      for (const cell of c.cells) {
        const map = mine ? knownMines : knownSafe;
        if (!map.has(cell)) { map.set(cell, `${c.reason}から、残る${c.cells.length}マスは${mine ? 'すべて地雷' : 'すべて安全'}です。`); changed = true; }
      }
    }
    constraints.forEach(conclude);
    // Subset differences use equations, never the answer board.
    for (const a of constraints) for (const b of constraints) {
      if (a.cells.length >= b.cells.length || !a.cells.every(i => b.cells.includes(i))) continue;
      conclude({ cells: b.cells.filter(i => !a.cells.includes(i)), total: b.total - a.total, reason: `${b.reason}から、${a.reason}の共通マスを除くこと` });
    }
    if (!changed) break;
  }
  const result: Deduction[] = [...knownSafe].map(([cell, reason]) => ({ cell, kind: 'safe' as const, reason }));
  result.push(...[...knownMines].map(([cell, reason]) => ({ cell, kind: 'mine' as const, reason })));
  return result;
}
export class Mines {
  readonly width: number; readonly height: number; readonly total: number;
  mines: boolean[] = []; numbers: number[] = []; opened: boolean[]; flags: boolean[];
  outcome: Outcome = 'active'; history: Action[] = []; start: number | null = null; proof: Proof | null = null;
  readonly difficulty: Difficulty;
  constructor(difficulty: Difficulty) {
    this.difficulty = difficulty;
    const c = config(difficulty); this.width = c.width; this.height = c.height; this.total = c.total;
    this.opened = Array(c.width * c.height).fill(false); this.flags = [...this.opened];
  }
  get initialized(): boolean { return this.mines.length > 0; }
  get openedCount(): number { return this.opened.filter(Boolean).length; }
  get flagCount(): number { return this.flags.filter(Boolean).length; }
  valid(cell: number): boolean { return Number.isInteger(cell) && cell >= 0 && cell < this.opened.length; }
  initialize(mines: boolean[], start: number, proof: Proof | null = null): boolean {
    if (this.initialized || !this.valid(start) || !validMines(mines, this.width, this.height, this.total, start)) return false;
    if (proof && (proof.start !== start || !verifyProof(this.difficulty, mines, proof))) return false;
    this.mines = [...mines]; this.numbers = counts(mines, this.width, this.height); this.start = start; this.proof = proof; return true;
  }
  visible(): Visible { return { width: this.width, height: this.height, total: this.total, cells: this.opened.map((v, i) => v && !this.mines[i] ? this.numbers[i] : null) }; }
  hint(): Deduction | null { return deductions(this.visible()).find(d => d.kind === 'safe' || !this.flags[d.cell]) ?? deductions(this.visible())[0] ?? null; }
  act(type: Action['type'], cell: number): boolean {
    if (!this.valid(cell) || this.outcome !== 'active') return false;
    if (type === 'flag') { if (this.opened[cell]) return false; this.flags[cell] = !this.flags[cell]; }
    else {
      if (!this.initialized || this.flags[cell]) return false;
      if (type === 'open') { if (this.opened[cell]) return false; this.reveal(cell); }
      else {
        if (!this.opened[cell] || this.numbers[cell] === 0) return false;
        const around = neighbors(cell, this.width, this.height);
        if (around.filter(i => this.flags[i]).length !== this.numbers[cell] || !around.some(i => !this.opened[i] && !this.flags[i])) return false;
        for (const i of around) if (!this.flags[i] && !this.opened[i]) { this.reveal(i); if ((this.outcome as Outcome) === 'lost') break; }
      }
      if (this.outcome === 'active' && this.openedCount === this.opened.length - this.total) this.outcome = 'won';
    }
    this.history.push({ type, cell }); return true;
  }
  private reveal(cell: number): void {
    if (this.mines[cell]) { this.opened[cell] = true; this.outcome = 'lost'; return; }
    const queue = [cell];
    while (queue.length) {
      const i = queue.pop()!;
      if (this.opened[i] || this.flags[i] || this.mines[i]) continue;
      this.opened[i] = true;
      if (this.numbers[i] === 0) queue.push(...neighbors(i, this.width, this.height).filter(j => !this.opened[j]));
    }
  }
}
export function validMines(mines: unknown, width: number, height: number, total: number, start: number): mines is boolean[] {
  return Array.isArray(mines) && mines.length === width * height && mines.every(v => typeof v === 'boolean') && mines.filter(Boolean).length === total && !mines[start] && neighbors(start, width, height).every(i => !mines[i]);
}
export function candidate(difficulty: Difficulty, start: number, seed: number): boolean[] {
  const { width, height, total } = config(difficulty), excluded = new Set([start, ...neighbors(start, width, height)]);
  let value = seed >>> 0; const random = () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
  const available = Array.from({ length: width * height }, (_, i) => i).filter(i => !excluded.has(i));
  for (let i = available.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [available[i], available[j]] = [available[j], available[i]]; }
  const positions = new Set(available.slice(0, total)); return Array.from({ length: width * height }, (_, i) => positions.has(i));
}
/** Verification opens only start and public-state-proven safe cells. Mine answers
 * are used by reveal to supply numbers, never to choose an action. */
export function solve(difficulty: Difficulty, mines: boolean[], start: number): Proof {
  const board = new Mines(difficulty), steps: Deduction[] = [];
  if (!board.initialize(mines, start)) return { generator: GENERATOR, start, steps, verified: false };
  board.act('open', start);
  for (let round = 0; round < board.opened.length && board.outcome === 'active'; round++) {
    const safe = deductions(board.visible()).filter(d => d.kind === 'safe');
    if (!safe.length) break;
    for (const d of safe) if (!board.opened[d.cell]) { steps.push(d); board.act('open', d.cell); }
  }
  return { generator: GENERATOR, start, steps, verified: board.outcome === 'won' };
}
export function verifyProof(difficulty: Difficulty, mines: boolean[], proof: Proof): boolean {
  if (!proof || proof.generator !== GENERATOR || !proof.verified || !Array.isArray(proof.steps) || proof.steps.length > config(difficulty).width ** 2 || !Number.isInteger(proof.start)) return false;
  const fresh = solve(difficulty, mines, proof.start);
  return fresh.verified && JSON.stringify(fresh.steps) === JSON.stringify(proof.steps);
}
export function generate(difficulty: Difficulty, start: number, seed: number, attempts = 80, budgetMs = 450): { mines: boolean[]; proof: Proof } | null {
  const deadline = Date.now() + budgetMs;
  for (let n = 0; n < attempts && Date.now() < deadline; n++) {
    const mines = candidate(difficulty, start, seed + n * 7919), proof = solve(difficulty, mines, start);
    if (proof.verified) return { mines, proof };
  }
  return null;
}
