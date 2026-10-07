import { describe, expect, it } from 'vitest';
import { PairBoard, availablePairs, createLayout, generateBoard, isFree, solve, type Difficulty, type Pair, type Tile } from '../../src/games/game020/PairBoard';
const tile = (id: number, x: number, y = 0, z = 0, face = 0): Tile => ({ id, x, y, z, face, removed: false });
function applyWitness(tiles: Tile[], route: Pair[]): void {
  for (const [a, b] of route) {
    expect(isFree(tiles, a)).toBe(true);
    expect(isFree(tiles, b)).toBe(true);
    const first = tiles.find(item => item.id === a)!;
    const second = tiles.find(item => item.id === b)!;
    expect(first.face).toBe(second.face);
    first.removed = second.removed = true;
  }
  expect(tiles.every(item => item.removed)).toBe(true);
}

describe('Game020 classic tile availability', () => {
  it('requires upper space and either left or right space, not both', () => {
    const tiles = [tile(0, 0), tile(1, 1), tile(2, 2)];
    expect(isFree(tiles, 0)).toBe(true); expect(isFree(tiles, 1)).toBe(false); expect(isFree(tiles, 2)).toBe(true);
    tiles[0]!.removed = true;
    expect(isFree(tiles, 1)).toBe(true);
    tiles.push(tile(3, 1, 0, 2));
    expect(isFree(tiles, 1)).toBe(false);
    tiles[3]!.removed = true;
    expect(isFree(tiles, 1)).toBe(true);
    expect(isFree(tiles, 999)).toBe(false); expect(isFree(tiles, 0)).toBe(false);
  });
  it('detects covering rectangles and side contact without blocking different rows/layers', () => {
    expect(isFree([tile(0, 1, 1), tile(1, 1.5, 1.5, 1)], 0)).toBe(false);
    expect(isFree([tile(0, 1, 1), tile(1, 0, 2), tile(2, 2, 2)], 0)).toBe(true);
    expect(isFree([tile(0, 1, 1, 1), tile(1, 0, 1), tile(2, 2, 1)], 0)).toBe(true);
  });
  it('only pairs distinct, matching, available tiles', () => {
    const tiles = [tile(0, 0, 0, 0, 0), tile(1, 1, 0, 0, 1), tile(2, 2, 0, 0, 0), tile(3, 0, 1, 0, 1)];
    expect(availablePairs(tiles)).toEqual([[0, 2]]);
  });
});

describe('original guaranteed-solvable layouts', () => {
  for (const difficulty of ['small', 'regular'] as Difficulty[]) {
    it(`${difficulty} has original geometry, repeated icon choices, and a legal complete witness for 200 seeds`, () => {
      expect(createLayout(difficulty)).toHaveLength(difficulty === 'small' ? 24 : 48);
      for (let seed = 0; seed < 200; seed++) {
        const board = generateBoard(difficulty, seed);
        expect(Math.max(...board.tiles.map(item => item.x))).toBe(3);
        expect(new Set(board.tiles.map(item => `${item.x},${item.y},${item.z}`)).size).toBe(board.tiles.length);
        const counts = new Map<number, number>();
        board.tiles.forEach(item => counts.set(item.face, (counts.get(item.face) ?? 0) + 1));
        expect([...counts.values()].every(count => count === 4)).toBe(true);
        expect(board).toEqual(generateBoard(difficulty, seed));
        applyWitness(board.tiles, board.solution);
      }
    });
  }
  it('solver provides only fully valid witnesses and rejects a true stalled board', () => {
    for (let seed = 0; seed < 12; seed++) {
      const { tiles } = generateBoard('small', seed);
      const route = solve(tiles);
      expect(route).not.toBeNull(); applyWitness(tiles, route!);
    }
    const blocked = [tile(0, 0, 0, 0, 0), tile(1, 0, 0, 1, 1), tile(2, 2, 0, 0, 1), tile(3, 2, 0, 1, 0)];
    expect(availablePairs(blocked)).toEqual([]); expect(solve(blocked)).toBeNull();
  });
});

describe('PairBoard calm continuation', () => {
  it('invalid/mismatched clicks change no tiles or history; selection can be cancelled', () => {
    const board = new PairBoard('small', 21);
    const snapshot = structuredClone(board.tiles);
    expect(board.select(999)).toBe('blocked'); expect(board.history).toHaveLength(0);
    const free = board.tiles.filter(item => isFree(board.tiles, item.id));
    const a = free[0]!, b = free.find(item => item.face !== a.face)!;
    expect(board.select(a.id)).toBe('selected'); expect(board.select(a.id)).toBe('deselected');
    expect(board.select(a.id)).toBe('selected'); expect(board.select(b.id)).toBe('mismatch');
    expect(board.selected).toBe(b.id); expect(board.tiles).toEqual(snapshot); expect(board.remaining).toBe(24);
  });
  it('undo restores exact faces, positions, and removal flags, then restart restores the original run', () => {
    const board = new PairBoard('small', 7);
    const original = structuredClone(board.tiles);
    const [a, b] = board.hint()!;
    board.select(a); expect(board.select(b)).toBe('removed'); expect(board.lastPair).toEqual([a, b]);
    expect(board.remaining).toBe(22); expect(board.undo()).toBe(true); expect(board.tiles).toEqual(original);
    expect(board.selected).toBeNull(); expect(board.undo()).toBe(false);
    board.select(a); board.select(b); board.reshuffle(8); board.restart();
    expect(board.tiles).toEqual(original); expect(board.history).toEqual([]); expect(board.remaining).toBe(24);
  });
  it('hints can clear the entire board and undo still works after clearing', () => {
    const board = new PairBoard('regular', 96);
    let removals = 0;
    while (!board.cleared) {
      const [a, b] = board.hint()!;
      board.select(a); expect(board.select(b)).toBe('removed'); removals++;
    }
    expect(removals).toBe(24); expect(board.stuck).toBe(false); expect(board.hint()).toBeNull();
    expect(board.reshuffle(1)).toBe(false); expect(board.undo()).toBe(true); expect(board.remaining).toBe(2);
  });
  it('a different legal matching choice can stall an initially solved board, then undo or reshuffle continues', () => {
    const board = new PairBoard('small', 0);
    const route: Pair[] = [[3, 15], [20, 23], [8, 14], [0, 13], [1, 19], [11, 21], [7, 9]];
    for (const [a, b] of route) { board.select(a); expect(board.select(b)).toBe('removed'); }
    expect(board.remaining).toBe(10); expect(board.stuck).toBe(true);
    expect(board.undo()).toBe(true); expect(board.remaining).toBe(12); expect(board.stuck).toBe(false);
    board.select(7); board.select(9); expect(board.stuck).toBe(true);
    const faces = board.tiles.filter(item => !item.removed).map(item => item.face).sort();
    expect(board.reshuffle(77)).toBe(true); expect(board.stuck).toBe(false);
    expect(board.tiles.filter(item => !item.removed).map(item => item.face).sort()).toEqual(faces);
    applyWitness(board.tiles, board.solution);
  });
  it('stalled faces reshuffle into a legal route preserving the remaining face multiset', () => {
    const board = new PairBoard();
    board.tiles = [tile(0, 0, 0, 0, 0), tile(1, 0, 0, 1, 1), tile(2, 2, 0, 0, 1), tile(3, 2, 0, 1, 0)];
    expect(board.stuck).toBe(true); expect(board.hint()).toBeNull();
    expect(board.reshuffle(123)).toBe(true); expect(board.stuck).toBe(false);
    expect(board.tiles.map(item => item.face).sort()).toEqual([0, 0, 1, 1]);
    applyWitness(board.tiles, board.solution);
  });
  it('a stranded vertical pair is safely repacked; history and selection are explicitly reset', () => {
    const board = new PairBoard();
    board.tiles = [tile(0, 0), tile(1, 0, 0, 1)];
    board.selected = 1; board.history = [{ tiles: structuredClone(board.tiles) }];
    expect(board.stuck).toBe(true); expect(board.reshuffle(1)).toBe(true); expect(board.reshuffleRecovered).toBe(true);
    expect(board.tiles.every(item => item.z === 0)).toBe(true); expect(board.selected).toBeNull(); expect(board.history).toEqual([]);
    applyWitness(board.tiles, board.solution);
  });
  it('reshuffle after removals keeps removed tile identities and guarantees the remaining route for 40 seeds', () => {
    for (let seed = 0; seed < 40; seed++) {
      const board = new PairBoard('regular', seed);
      for (let step = 0; step < 3; step++) { const [a, b] = board.hint()!; board.select(a); board.select(b); }
      const removed = board.tiles.filter(item => item.removed).map(item => item.id);
      const faces = board.tiles.filter(item => !item.removed).map(item => item.face).sort((a, b) => a - b);
      expect(board.reshuffle(seed + 9)).toBe(true);
      expect(board.tiles.filter(item => item.removed).map(item => item.id)).toEqual(removed);
      expect(board.tiles.filter(item => !item.removed).map(item => item.face).sort((a, b) => a - b)).toEqual(faces);
      applyWitness(board.tiles, board.solution);
    }
  });
});
