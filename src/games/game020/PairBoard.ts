/** Original aligned tile layouts. Coordinates are whole tile widths/heights. */
export interface Tile {
  id: number;
  x: number;
  y: number;
  z: number;
  face: number;
  removed: boolean;
}
export type Difficulty = 'small' | 'regular';
export type Pair = [number, number];
export type SelectionResult = 'selected' | 'deselected' | 'mismatch' | 'blocked' | 'removed';
export interface PairSnapshot { tiles: Tile[] }
const copy = (tiles: Tile[]): Tile[] => tiles.map(tile => ({ ...tile }));

function randomFor(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
function shuffled<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function createLayout(difficulty: Difficulty): Tile[] {
  const tiles: Tile[] = [];
  const layers = difficulty === 'small'
    ? [{ rows: 4, start: 0 }, { rows: 2, start: 1 }]
    : [{ rows: 6, start: 0 }, { rows: 4, start: 1 }, { rows: 2, start: 2 }];
  layers.forEach((layer, z) => {
    for (let y = layer.start; y < layer.start + layer.rows; y++) {
      for (let x = 0; x < 4; x++) tiles.push({ id: tiles.length, x, y, z, face: 0, removed: false });
    }
  });
  return tiles;
}

/** Higher tiles cover a tile if their rectangles overlap, even at more than one layer. */
export function isFree(tiles: Tile[], id: number): boolean {
  const tile = tiles.find(item => item.id === id);
  if (!tile || tile.removed) return false;
  const active = tiles.filter(item => !item.removed && item.id !== id);
  if (active.some(item => item.z > tile.z && Math.abs(item.x - tile.x) < 1 && Math.abs(item.y - tile.y) < 1)) return false;
  const sameRow = active.filter(item => item.z === tile.z && Math.abs(item.y - tile.y) < 1);
  const left = sameRow.some(item => item.x < tile.x && tile.x - item.x <= 1);
  const right = sameRow.some(item => item.x > tile.x && item.x - tile.x <= 1);
  return !left || !right;
}

export function availablePairs(tiles: Tile[]): Pair[] {
  const free = tiles.filter(tile => isFree(tiles, tile.id));
  const pairs: Pair[] = [];
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (free[i]!.face === free[j]!.face) pairs.push([free[i]!.id, free[j]!.id]);
    }
  }
  return pairs;
}

/** Geometry-only legal peeling. null means this random route cannot pair all remaining tiles. */
function peel(tiles: Tile[], random: () => number): Pair[] | null {
  const work = copy(tiles);
  const result: Pair[] = [];
  while (work.some(tile => !tile.removed)) {
    const free = shuffled(work.filter(tile => isFree(work, tile.id)), random);
    if (free.length < 2) return null;
    const a = free[0]!;
    const b = free[1]!;
    result.push([a.id, b.id]);
    a.removed = b.removed = true;
  }
  return result;
}

/** Remove two ends of one exposed row at a time. Original rows remain even at every step. */
function peelRows(tiles: Tile[], random: () => number): Pair[] | null {
  const work = copy(tiles);
  const result: Pair[] = [];
  while (work.some(tile => !tile.removed)) {
    const rows = new Map<string, Tile[]>();
    work.filter(tile => isFree(work, tile.id)).forEach(tile => {
      const key = `${tile.z}:${tile.y}`;
      rows.set(key, [...(rows.get(key) ?? []), tile]);
    });
    const candidates = shuffled([...rows.values()].filter(row => row.length >= 2), random);
    if (!candidates.length) return null;
    const [a, b] = shuffled(candidates[0]!, random);
    result.push([a!.id, b!.id]);
    a!.removed = b!.removed = true;
  }
  return result;
}

function assignFaces(tiles: Tile[], route: Pair[], faces: number[], random: () => number): void {
  const order = shuffled(faces, random);
  const byId = new Map(tiles.map(tile => [tile.id, tile]));
  route.forEach(([a, b], index) => {
    byId.get(a)!.face = byId.get(b)!.face = order[index]!;
  });
}

export function generateBoard(difficulty: Difficulty, seed: number): { tiles: Tile[]; solution: Pair[] } {
  const tiles = createLayout(difficulty);
  const random = randomFor(seed);
  let solution: Pair[] | null = null;
  // Random free-pair routes diversify dependencies; reject stranded attempts before assigning any faces.
  for (let attempt = 0; attempt < 32 && !solution; attempt++) solution = peel(tiles, random);
  // Every original layer row has four tiles; paired row ends give a deterministic safe fallback.
  if (!solution) solution = peelRows(tiles, random);
  if (!solution) throw new Error('Original layout has no paired removal route');
  // Two pairs per icon: repeated faces give actual matching choices, not a unique forced route.
  const faces = Array.from({ length: tiles.length / 2 }, (_, index) => Math.floor(index / 2));
  assignFaces(tiles, solution, faces, random);
  return { tiles, solution };
}

/** Bounded exact search: null is unsolved or the search budget was exhausted, never a false proof. */
export function solve(tiles: Tile[]): Pair[] | null {
  const active = tiles.filter(tile => !tile.removed);
  if (!active.length) return [];
  if (active.length % 2 || active.length > 64) return null;
  const faceCounts = new Map<number, number>();
  active.forEach(tile => faceCounts.set(tile.face, (faceCounts.get(tile.face) ?? 0) + 1));
  if ([...faceCounts.values()].some(count => count % 2)) return null;
  const bits = active.map((_, i) => 1n << BigInt(i));
  const blockers = active.map(tile => {
    let top = 0n, left = 0n, right = 0n;
    active.forEach((other, i) => {
      if (other.id === tile.id) return;
      if (other.z > tile.z && Math.abs(other.x - tile.x) < 1 && Math.abs(other.y - tile.y) < 1) top |= bits[i]!;
      if (other.z === tile.z && Math.abs(other.y - tile.y) < 1) {
        if (other.x < tile.x && tile.x - other.x <= 1) left |= bits[i]!;
        if (other.x > tile.x && other.x - tile.x <= 1) right |= bits[i]!;
      }
    });
    return { top, left, right };
  });
  const failed = new Set<bigint>();
  let nodes = 0;
  const search = (mask: bigint): Pair[] | null => {
    if (!mask) return [];
    if (++nodes > 30000 || failed.has(mask)) return null;
    const free: number[] = [];
    blockers.forEach((blocker, i) => {
      if ((mask & bits[i]!) && !(mask & blocker.top) && (!(mask & blocker.left) || !(mask & blocker.right))) free.push(i);
    });
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        const a = free[i]!, b = free[j]!;
        if (active[a]!.face !== active[b]!.face) continue;
        const tail = search(mask ^ bits[a]! ^ bits[b]!);
        if (tail) return [[active[a]!.id, active[b]!.id], ...tail];
        if (nodes > 30000) return null;
      }
    }
    failed.add(mask);
    return null;
  };
  return search((1n << BigInt(active.length)) - 1n);
}

export class PairBoard {
  tiles: Tile[];
  selected: number | null = null;
  feedback = '同じ柄の、動かせる牌を2枚選びます。';
  history: PairSnapshot[] = [];
  lastPair: Pair | null = null;
  solution: Pair[];
  /** True if bounded geometry search could not prove a paired route and used the flat recovery tray. */
  reshuffleRecovered = false;
  private initial: Tile[];
  private initialSolution: Pair[];
  constructor(public readonly difficulty: Difficulty = 'small', seed = Date.now()) {
    const board = generateBoard(difficulty, seed);
    this.tiles = board.tiles;
    this.solution = board.solution;
    this.initial = copy(board.tiles);
    this.initialSolution = board.solution.map(pair => [...pair] as Pair);
  }
  get remaining(): number { return this.tiles.filter(tile => !tile.removed).length; }
  get cleared(): boolean { return this.remaining === 0; }
  get stuck(): boolean { return !this.cleared && availablePairs(this.tiles).length === 0; }
  select(id: number): SelectionResult {
    this.lastPair = null;
    if (!isFree(this.tiles, id)) { this.feedback = '上が空き、左右どちらかが空いた牌を選べます。'; return 'blocked'; }
    if (this.selected === id) { this.selected = null; this.feedback = '選択を解除しました。'; return 'deselected'; }
    const tile = this.tiles.find(item => item.id === id)!;
    if (this.selected === null) { this.selected = id; this.feedback = '同じ柄の牌をもう1枚。'; return 'selected'; }
    const first = this.tiles.find(item => item.id === this.selected);
    if (!first || !isFree(this.tiles, first.id) || first.face !== tile.face) {
      this.selected = id; this.feedback = 'この牌を選択しました。同じ柄を探しましょう。'; return 'mismatch';
    }
    this.history.push({ tiles: copy(this.tiles) });
    first.removed = tile.removed = true;
    this.lastPair = [first.id, tile.id];
    this.selected = null;
    this.solution = this.solution.filter(pair => !pair.some(pairId => pairId === first.id || pairId === tile.id));
    this.feedback = this.cleared ? 'すっきり！ すべての牌を片付けました。' : this.stuck ? '今は組がありません。戻す・並べ替えで続けられます。' : '2枚片付きました。';
    return 'removed';
  }
  undo(): boolean {
    const previous = this.history.pop();
    if (!previous) { this.feedback = 'まだ戻せる手がありません。'; return false; }
    this.tiles = copy(previous.tiles);
    this.selected = null; this.lastPair = null;
    this.feedback = '1手戻しました。';
    this.solution = []; // A later hint uses the actual restored board, not a stale route.
    return true;
  }
  hint(): Pair | null {
    // Only use a stored witness when the complete remaining route still validates.
    const work = copy(this.tiles);
    let valid = this.solution.length * 2 === this.remaining;
    for (const [a, b] of this.solution) {
      const first = work.find(tile => tile.id === a), second = work.find(tile => tile.id === b);
      if (!first || !second || first.face !== second.face || !isFree(work, a) || !isFree(work, b)) { valid = false; break; }
      first.removed = second.removed = true;
    }
    const route = valid ? this.solution : solve(this.tiles);
    if (route?.length) { this.solution = route; this.feedback = '光る2枚が、片付ける道のヒントです。'; return [...route[0]!] as Pair; }
    const pair = availablePairs(this.tiles)[0] ?? null;
    this.feedback = pair ? '光る2枚を選べます。必要なら並べ替えもできます。' : this.cleared ? 'すべて片付いています。' : '今は組がありません。戻す・並べ替えで続けられます。';
    return pair;
  }
  reshuffle(seed = Date.now()): boolean {
    if (this.cleared) return false;
    const active = this.tiles.filter(tile => !tile.removed);
    const counts = new Map<number, number>();
    active.forEach(tile => counts.set(tile.face, (counts.get(tile.face) ?? 0) + 1));
    if ([...counts.values()].some(count => count % 2)) return false;
    const faces = [...counts].flatMap(([face, count]) => Array.from({ length: count / 2 }, () => face));
    const random = randomFor(seed);
    let route: Pair[] | null = peelRows(this.tiles, random);
    for (let attempt = 0; attempt < 32 && !route; attempt++) route = peel(this.tiles, random);
    if (!route) route = solve(this.tiles.map(tile => ({ ...tile, face: 0 })));
    this.reshuffleRecovered = !route;
    if (!route) {
      // A vertical two-tile tower cannot expose a pair; repack into our own flat four-column tray.
      active.forEach((tile, index) => { tile.x = index % 4; tile.y = Math.floor(index / 4); tile.z = 0; });
      route = peel(this.tiles, random);
    }
    if (!route) return false;
    assignFaces(this.tiles, route, faces, random);
    this.solution = route;
    this.selected = null; this.lastPair = null; this.history = [];
    this.feedback = this.reshuffleRecovered ? '残牌を平らな盤面に並べ直しました。戻す履歴はリセットされます。' : '解ける並びにしました。戻す履歴はリセットされます。';
    return true;
  }
  restart(): void {
    this.tiles = copy(this.initial);
    this.solution = this.initialSolution.map(pair => [...pair] as Pair);
    this.selected = null; this.lastPair = null; this.history = []; this.reshuffleRecovered = false;
    this.feedback = '最初の並びに戻しました。';
  }
}
