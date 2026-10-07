export const COLS = 7, ROWS = 6;
export const GAME_ID = 'game021', RULES_VERSION = '1';
export type Player = 1 | 2;
export type Cell = 0 | Player;
export type Result = 'playing' | 'draw' | 'green' | 'amber';
export type Difficulty = 'easy' | 'normal' | 'strong';
export interface Settings { mode: 'cpu' | 'two'; difficulty: Difficulty; first: boolean }
export const defaultSettings: Settings = { mode: 'cpu', difficulty: 'normal', first: true };
export const other = (player: Player): Player => player === 1 ? 2 : 1;
export const humanPlayer = (settings: Settings): Player => settings.first ? 1 : 2;

/** Four directions are checked by coordinates, never by flattened-index wrapping. */
export function winningCells(cells: readonly Cell[], player: Player): number[] {
  const found = new Set<number>();
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
    if (cells[row * COLS + col] !== player) continue;
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
      const beforeX = col - dx, beforeY = row - dy;
      if (beforeX >= 0 && beforeX < COLS && beforeY >= 0 && beforeY < ROWS && cells[beforeY * COLS + beforeX] === player) continue;
      const line: number[] = [];
      for (let x = col, y = row; x >= 0 && x < COLS && y >= 0 && y < ROWS && cells[y * COLS + x] === player; x += dx, y += dy) line.push(y * COLS + x);
      if (line.length >= 4) line.forEach(index => found.add(index));
    }
  }
  return [...found];
}

/** Pure game state. Replay history is the authoritative serialization. */
export class FourBoard {
  readonly cells: Cell[] = Array<Cell>(COLS * ROWS).fill(0);
  readonly moves: number[] = [];
  turn: Player = 1;
  result: Result = 'playing';
  wins: number[] = [];
  landing(column: number): number | null {
    if (!Number.isInteger(column) || column < 0 || column >= COLS) return null;
    for (let row = ROWS - 1; row >= 0; row--) if (this.cells[row * COLS + column] === 0) return row * COLS + column;
    return null;
  }
  legalColumns(): number[] { return this.result === 'playing' ? Array.from({ length: COLS }, (_, col) => col).filter(col => this.landing(col) !== null) : []; }
  drop(column: number): boolean {
    if (this.result !== 'playing') return false;
    const index = this.landing(column);
    if (index === null) return false;
    this.cells[index] = this.turn;
    this.moves.push(column);
    this.wins = winningCells(this.cells, this.turn);
    if (this.wins.length) this.result = this.turn === 1 ? 'green' : 'amber';
    else if (this.moves.length === COLS * ROWS) this.result = 'draw';
    this.turn = other(this.turn);
    return true;
  }
  undo(count = 1): boolean {
    if (!Number.isInteger(count) || count < 1 || !this.moves.length) return false;
    const history = this.moves.slice(0, Math.max(0, this.moves.length - count));
    this.cells.fill(0); this.moves.length = 0; this.turn = 1; this.result = 'playing'; this.wins = [];
    history.forEach(col => this.drop(col));
    return true;
  }
  clone(): FourBoard { return FourBoard.fromMoves(this.moves)!; }
  static fromMoves(value: unknown): FourBoard | null {
    if (!Array.isArray(value) || value.length > COLS * ROWS) return null;
    const board = new FourBoard();
    for (const col of value) if (typeof col !== 'number' || !board.drop(col)) return null;
    return board;
  }
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => { state += 0x6d2b79f5; let t = Math.imul(state ^ state >>> 15, 1 | state); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/** Guards worker generations AND the move revision. Invalidated replies cannot enter a run. */
export class TurnGate {
  private generation = 0;
  private acceptedAt = -Infinity;
  constructor(private readonly now: () => number = () => performance.now()) {}
  invalidate(): void { this.generation++; }
  ticket(board: FourBoard): { generation: number; revision: number } { return { generation: this.generation, revision: board.moves.length }; }
  valid(ticket: { generation: number; revision: number }, board: FourBoard): boolean { return ticket.generation === this.generation && ticket.revision === board.moves.length && board.result === 'playing'; }
  humanDrop(board: FourBoard, column: number, settings: Settings): boolean {
    if (this.now() - this.acceptedAt < 220 || settings.mode === 'cpu' && board.turn !== humanPlayer(settings)) return false;
    if (!board.drop(column)) return false;
    this.acceptedAt = this.now(); this.invalidate(); return true;
  }
  cpuDrop(ticket: { generation: number; revision: number }, board: FourBoard, column: number, settings: Settings): boolean {
    if (settings.mode !== 'cpu' || board.turn === humanPlayer(settings) || !this.valid(ticket, board) || !board.drop(column)) return false;
    this.acceptedAt = this.now(); this.invalidate(); return true;
  }
  resetInput(): void { this.acceptedAt = this.now(); }
}

export function undoCount(board: FourBoard, settings: Settings): number {
  if (!board.moves.length) return 0;
  if (settings.mode === 'two') return 1;
  // Pending CPU response: undo the human move. After its response: undo the pair.
  if (board.turn !== humanPlayer(settings)) return 1;
  return board.moves.length >= 2 ? 2 : 0;
}
