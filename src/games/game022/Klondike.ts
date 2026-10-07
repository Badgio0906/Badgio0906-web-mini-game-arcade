export const RULES_VERSION = 'klondike-v1';
export const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'] as const;
export type Suit = typeof SUITS[number];
export type Card = number;
export type Draw = 1 | 3;
export type DealMode = 'random' | 'daily';
export interface TableauCard { card: Card; faceUp: boolean }
export interface Position { tableau: TableauCard[][]; stock: Card[]; waste: Card[]; foundations: Card[][]; moves: number }
export type Source = { pile: 'tableau'; column: number; index: number } | { pile: 'waste' } | { pile: 'foundation'; column: number };
export type Destination = { pile: 'tableau' | 'foundation'; column: number };
export interface Move { source: Source; destination: Destination }
export interface Snapshot {
  game_id: 'game022'; rules_version: typeof RULES_VERSION; seed: string; mode: DealMode; draw: Draw; daily_id: string;
  position: Position; history: Position[]; elapsed_ms: number; reported: boolean; analytics_run_id: string | null;
  hints: number; undos: number; assists: number;
}
export const rank = (card: Card): number => card % 13 + 1;
export const suit = (card: Card): Suit => SUITS[Math.floor(card / 13)];
export const red = (card: Card): boolean => suit(card) === 'diamonds' || suit(card) === 'hearts';
export const clonePosition = (p: Position): Position => ({ tableau: p.tableau.map(col => col.map(c => ({ ...c }))), stock: [...p.stock], waste: [...p.waste], foundations: p.foundations.map(col => [...col]), moves: p.moves });
export const cardsIn = (p: Position): Card[] => [...p.tableau.flat().map(c => c.card), ...p.stock, ...p.waste, ...p.foundations.flat()];
export const jstDate = (now = new Date()): string => new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10);
export const dailySeed = (date: string, draw: Draw): string => `${date}|${RULES_VERSION}|draw${draw}`;
export function seededRandom(seed: string): () => number {
  let value = 2166136261;
  for (const c of seed) { value ^= c.charCodeAt(0); value = Math.imul(value, 16777619); }
  return () => { value += 0x6d2b79f5; let n = Math.imul(value ^ value >>> 15, 1 | value); n ^= n + Math.imul(n ^ n >>> 7, 61 | n); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}
export function shuffledDeck(seed: string, rng = seededRandom(seed)): Card[] {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return deck;
}
export function deal(deck: readonly Card[]): Position {
  let index = 0;
  const tableau = Array.from({ length: 7 }, (_, col) => Array.from({ length: col + 1 }, (_, row) => ({ card: deck[index++], faceUp: row === col })));
  return { tableau, stock: deck.slice(28).reverse(), waste: [], foundations: [[], [], [], []], moves: 0 };
}
/** Authored independently: each column hides a reversed contiguous segment of rank-major cards.
 * Always taking the lowest visible foundation-legal card exposes the next rank-major card.
 * Stock follows rank-major order. This is a QA fixture, never a promise about random deals. */
export function originalSolvableDeck(): Card[] {
  const ordered = Array.from({ length: 52 }, (_, i) => Math.floor(i / 4) + i % 4 * 13);
  let offset = 0;
  const deck: Card[] = [];
  for (let col = 1; col <= 7; col++) { deck.push(...ordered.slice(offset, offset + col).reverse()); offset += col; }
  return [...deck, ...ordered.slice(28)];
}
function integer(value: unknown, max = 1e9): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max; }
function cardArray(value: unknown): value is Card[] { return Array.isArray(value) && value.length <= 52 && value.every(c => integer(c, 51)); }
export function validPosition(value: unknown, full = true): value is Position {
  if (!value || typeof value !== 'object') return false;
  const p = value as Position;
  if (!integer(p.moves) || !Array.isArray(p.tableau) || p.tableau.length !== 7 || !cardArray(p.stock) || !cardArray(p.waste) || !Array.isArray(p.foundations) || p.foundations.length !== 4) return false;
  for (const col of p.tableau) {
    if (!Array.isArray(col) || col.length > 52) return false;
    let visible = false;
    for (let i = 0; i < col.length; i++) {
      const c = col[i];
      if (!c || !integer(c.card, 51) || typeof c.faceUp !== 'boolean') return false;
      if (visible && !c.faceUp) return false;
      if (c.faceUp && visible && !descending(col[i - 1].card, c.card)) return false;
      visible ||= c.faceUp;
    }
    if (col.length && !visible) return false;
  }
  for (let i = 0; i < 4; i++) {
    const col = p.foundations[i];
    if (!cardArray(col) || col.length > 13 || col.some((c, j) => suit(c) !== SUITS[i] || rank(c) !== j + 1)) return false;
  }
  const cards = cardsIn(p);
  return (full ? cards.length === 52 : cards.length > 0 && cards.length <= 52) && new Set(cards).size === cards.length;
}
export function validateSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== 'object') return false;
  const s = value as Snapshot;
  if (s.game_id !== 'game022' || s.rules_version !== RULES_VERSION || !['random','daily'].includes(s.mode) || ![1,3].includes(s.draw) || typeof s.seed !== 'string' || !s.seed.length || s.seed.length > 120 || typeof s.daily_id !== 'string') return false;
  if (s.mode === 'daily' ? !/^\d{4}-\d{2}-\d{2}$/.test(s.daily_id) || s.seed !== dailySeed(s.daily_id, s.draw) : s.daily_id !== '') return false;
  if (!integer(s.elapsed_ms, 31536000000) || typeof s.reported !== 'boolean' || !(s.analytics_run_id === null || typeof s.analytics_run_id === 'string' && s.analytics_run_id.length > 0 && s.analytics_run_id.length <= 120)) return false;
  if (![s.hints,s.undos,s.assists].every(n => integer(n)) || !validPosition(s.position) || !Array.isArray(s.history) || s.history.length > 1000 || !s.history.every(p => validPosition(p))) return false;
  return !s.reported || s.position.foundations.every(f => f.length === 13);
}
export const descending = (bottom: Card, top: Card): boolean => red(bottom) !== red(top) && rank(bottom) === rank(top) + 1;
export class Klondike {
  position: Position;
  history: Position[] = [];
  elapsedMs = 0;
  reported = false;
  analyticsRunId: string | null = null;
  hints = 0; undos = 0; assists = 0;
  constructor(readonly seed: string, readonly draw: Draw = 1, readonly mode: DealMode = 'random', readonly dailyId = '', deck = shuffledDeck(seed)) { this.position = deal(deck); }
  static restore(value: unknown): Klondike | null {
    if (!validateSnapshot(value)) return null;
    const s = value;
    const game = new Klondike(s.seed, s.draw, s.mode, s.daily_id);
    game.position = clonePosition(s.position); game.history = s.history.map(clonePosition); game.elapsedMs = s.elapsed_ms; game.reported = s.reported; game.analyticsRunId = s.analytics_run_id; game.hints = s.hints; game.undos = s.undos; game.assists = s.assists;
    return game;
  }
  snapshot(): Snapshot { return { game_id: 'game022', rules_version: RULES_VERSION, seed: this.seed, draw: this.draw, mode: this.mode, daily_id: this.dailyId, position: clonePosition(this.position), history: this.history.map(clonePosition), elapsed_ms: Math.floor(this.elapsedMs), reported: this.reported, analytics_run_id: this.analyticsRunId, hints: this.hints, undos: this.undos, assists: this.assists }; }
  get cleared(): boolean { return this.position.foundations.every(col => col.length === 13); }
  get foundationCount(): number { return this.position.foundations.flat().length; }
  stack(source: Source): Card[] {
    const p = this.position;
    if (source.pile === 'waste') return p.waste.length ? [p.waste.at(-1)!] : [];
    if (source.pile === 'foundation') return p.foundations[source.column]?.length ? [p.foundations[source.column].at(-1)!] : [];
    const col = p.tableau[source.column];
    if (!col || !integer(source.index, 51) || !col[source.index]?.faceUp) return [];
    const cards = col.slice(source.index);
    return cards.every((c, i) => c.faceUp && (!i || descending(cards[i - 1].card, c.card))) ? cards.map(c => c.card) : [];
  }
  legal(source: Source, destination: Destination): boolean {
    if (this.cleared || !integer(destination.column, destination.pile === 'tableau' ? 6 : 3)) return false;
    if (source.pile === destination.pile && source.column === destination.column) return false;
    const cards = this.stack(source);
    if (!cards.length) return false;
    if (destination.pile === 'foundation') {
      const target = this.position.foundations[destination.column];
      return cards.length === 1 && suit(cards[0]) === SUITS[destination.column] && rank(cards[0]) === target.length + 1;
    }
    const target = this.position.tableau[destination.column];
    return !target.length ? rank(cards[0]) === 13 : target.at(-1)!.faceUp && descending(target.at(-1)!.card, cards[0]);
  }
  private remember(): void { this.history.push(clonePosition(this.position)); if (this.history.length > 1000) this.history.shift(); }
  move(source: Source, destination: Destination): boolean {
    if (!this.legal(source, destination)) return false;
    this.remember(); const cards = this.stack(source), p = this.position;
    if (source.pile === 'waste') p.waste.pop();
    else if (source.pile === 'foundation') p.foundations[source.column].pop();
    else { const col = p.tableau[source.column]; col.splice(source.index); if (col.length) col.at(-1)!.faceUp = true; }
    if (destination.pile === 'foundation') p.foundations[destination.column].push(cards[0]);
    else p.tableau[destination.column].push(...cards.map(card => ({ card, faceUp: true })));
    p.moves++; return true;
  }
  drawStock(): 'draw' | 'recycle' | null {
    if (this.cleared) return null;
    const p = this.position;
    if (p.stock.length) { this.remember(); for (let i = 0, count = Math.min(this.draw, p.stock.length); i < count; i++) p.waste.push(p.stock.pop()!); p.moves++; return 'draw'; }
    if (!p.waste.length) return null;
    this.remember(); p.stock = p.waste.splice(0).reverse(); p.moves++; return 'recycle';
  }
  undo(): boolean { if (!this.history.length || this.reported) return false; this.position = this.history.pop()!; this.undos++; return true; }
  /** Lists only exposed cards and legal destinations; does not inspect hidden card values or stock. */
  visibleMoves(): Move[] {
    const sources: Source[] = [{ pile: 'waste' }, ...this.position.foundations.map((_, column): Source => ({ pile: 'foundation', column }))];
    this.position.tableau.forEach((col, column) => col.forEach((c, index) => { if (c.faceUp) sources.push({ pile: 'tableau', column, index }); }));
    const destinations: Destination[] = [...Array.from({ length: 4 }, (_, column): Destination => ({ pile: 'foundation', column })), ...Array.from({ length: 7 }, (_, column): Destination => ({ pile: 'tableau', column }))];
    return sources.flatMap(source => destinations.filter(destination => this.legal(source, destination)).map(destination => ({ source, destination })));
  }
  hint(): Move | null { this.hints++; return this.visibleMoves().find(m => m.source.pile !== 'foundation') ?? null; }
  assistFoundation(): boolean { const move = this.visibleMoves().find(m => m.destination.pile === 'foundation'); if (!move) return false; this.assists++; return this.move(move.source, move.destination); }
  /** With no stock/waste/hidden cards and ordered tableaus, a minimum-rank top card is
   * always foundation-legal. Dry-run that proof to completion before enabling finish. */
  finishPlan(): Move[] | null {
    if (this.cleared || this.position.stock.length || this.position.waste.length || this.position.tableau.some(col => col.some(c => !c.faceUp))) return null;
    const copy = new Klondike(this.seed); copy.position = clonePosition(this.position);
    const plan: Move[] = [];
    for (let i = 0; i < 52; i++) {
      if (copy.cleared) return plan;
      const move = copy.visibleMoves().find(m => m.source.pile === 'tableau' && m.destination.pile === 'foundation');
      if (!move || !copy.move(move.source, move.destination)) return null;
      plan.push(move);
    }
    return copy.cleared ? plan : null;
  }
  finishVisible(): boolean { const plan = this.finishPlan(); if (!plan) return false; this.assists++; for (const move of plan) this.move(move.source, move.destination); return this.cleared; }
}
/** Six actual cards for learning, intentionally excluded from saves and production records. */
export function practiceGame(): Klondike {
  const game = new Klondike('practice');
  game.position = { tableau: [[{ card: 5, faceUp: true }], [{ card: 17, faceUp: true }], [{ card: 12, faceUp: true }], [], [{ card: 0, faceUp: true }], [{ card: 13, faceUp: true }], []], stock: [26], waste: [], foundations: [[], [], [], []], moves: 0 };
  return game;
}
