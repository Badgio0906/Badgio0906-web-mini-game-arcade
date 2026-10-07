import { describe, expect, it } from 'vitest';
import { FourBoard, COLS, ROWS, winningCells, seededRandom, TurnGate, undoCount, type Cell, type Difficulty, type Settings } from '../../src/games/game021/model';
import { chooseMove } from '../../src/games/game021/ai';
import { freshArchive, parseArchive, finalize, statKey, GameStore, SAVE_KEY, outcomeFor, type SavedRun } from '../../src/games/game021/persistence';
const cpu: Settings = { mode: 'cpu', difficulty: 'normal', first: true };
const two: Settings = { ...cpu, mode: 'two' };
const run = (moves: number[], settings = cpu): SavedRun => ({ moves, settings, runId: null, seed: 21, hints: 0, undos: 0, reported: false, outcome: null });
const cells = (indices: number[]): Cell[] => { const value = Array<Cell>(42).fill(0); indices.forEach(index => { value[index] = 1; }); return value; };

describe('Game021 standard 7×6 gravity rules', () => {
  it('places at the lowest empty location and alternates only on a legal move', () => {
    const board = new FourBoard();
    expect(board.landing(2)).toBe(37); expect(board.drop(2)).toBe(true);
    expect(board.cells[37]).toBe(1); expect(board.landing(2)).toBe(30); expect(board.turn).toBe(2);
    expect(board.drop(2)).toBe(true); expect(board.cells[30]).toBe(2);
    for (const col of [-1,7,1.5,NaN]) { expect(board.drop(col)).toBe(false); expect(board.turn).toBe(1); }
  });
  it('does not advance a turn or history when a column is full', () => {
    const board = FourBoard.fromMoves([0,0,0,0,0,0])!;
    expect(board.drop(0)).toBe(false); expect(board.turn).toBe(1); expect(board.moves.length).toBe(6);
    expect(board.legalColumns()).toEqual([1,2,3,4,5,6]);
  });
  it.each([
    ['horizontal', [35,36,37,38]], ['vertical', [7,14,21,28]],
    ['diagonal down right', [0,8,16,24]], ['diagonal down left', [6,12,18,24]],
    ['five', [35,36,37,38,39]], ['six', [0,1,2,3,4,5]],
  ])('recognizes %s and highlights every disc in a line', (_label, indices) => {
    expect(winningCells(cells(indices as number[]), 1).sort((a,b) => a-b)).toEqual((indices as number[]).slice().sort((a,b) => a-b));
    expect(winningCells(cells(indices as number[]), 2)).toEqual([]);
  });
  it('never wraps across board edges', () => {
    expect(winningCells(cells([5,6,7,8]), 1)).toEqual([]);
    expect(winningCells(cells([6,14,22,30]), 1)).toEqual([]);
    expect(winningCells(cells([0,6,12,18]), 1)).toEqual([]);
  });
  it('ends a legal vertical win and rejects every further move', () => {
    const board = FourBoard.fromMoves([0,1,0,1,0,1,0])!;
    expect(board.result).toBe('green'); expect(board.wins.length).toBe(4);
    expect(board.legalColumns()).toEqual([]); expect(board.drop(5)).toBe(false); expect(board.moves.length).toBe(7);
  });
  it.each([
    [5,4,4,2,6,3,5,3,2,2,4,6,6,3,3],
    [3,6,2,2,5,0,0,2,3,4,1,1,0,4,1,0,4,5,1,2,2,3,1,3],
  ])('detects both diagonal wins from actual alternating gravity moves', (...history) => {
    const board = FourBoard.fromMoves(history)!;
    expect(board.result).not.toBe('playing'); expect(board.result).not.toBe('draw');
    expect(board.wins.length).toBeGreaterThanOrEqual(4);
  });
  it('accepts a legal five-disc horizontal connection', () => {
    const board = FourBoard.fromMoves([6,6,0,6,1,5,3,5,4,5,2])!;
    expect(board.result).toBe('green'); expect(board.wins.length).toBe(5);
  });
  it('declares a full non-winning board a draw exactly at move 42', () => {
    const history = [4,4,0,3,4,3,5,3,1,0,4,1,0,2,1,5,2,0,2,1,1,5,6,4,4,0,2,1,6,6,3,2,6,6,2,0,6,3,3,5,5,5];
    const board = FourBoard.fromMoves(history.slice(0,-1))!;
    expect(board.result).toBe('playing'); expect(board.drop(history.at(-1)!)).toBe(true);
    expect(board.result).toBe('draw'); expect(board.cells.every(Boolean)).toBe(true);
    expect(winningCells(board.cells,1)).toEqual([]); expect(winningCells(board.cells,2)).toEqual([]); expect(board.drop(0)).toBe(false);
  });
  it('rejects malformed replay histories, overflow, and post-result moves', () => {
    for (const value of [null, {}, [8], [1.3], ['1'], Array(7).fill(0), [0,1,0,1,0,1,0,2], Array(43).fill(2)]) expect(FourBoard.fromMoves(value)).toBeNull();
  });
  it('restores the exact turn, gravity layout and winning highlights from move history', () => {
    const original = FourBoard.fromMoves([3,2,3,4,5,2,3])!;
    const restored = FourBoard.fromMoves(JSON.parse(JSON.stringify(original.moves)))!;
    expect(restored.cells).toEqual(original.cells); expect(restored.turn).toBe(original.turn); expect(restored.result).toBe(original.result);
    for (let col=0;col<COLS;col++) { let emptyAbove = true; for(let row=0;row<ROWS;row++) { const value=restored.cells[row*COLS+col]; if(value) emptyAbove=false; else expect(emptyAbove).toBe(true); } }
  });
});

describe('Game021 bounded tactical CPU', () => {
  it.each(['easy','normal','strong'] as Difficulty[])('%s takes an immediate win', difficulty => {
    const board = FourBoard.fromMoves([0,1,0,1,0,2])!;
    expect(chooseMove(board, difficulty, { random: seededRandom(4) })).toBe(0);
    expect(board.moves.length).toBe(6);
  });
  it.each(['easy','normal','strong'] as Difficulty[])('%s blocks an immediate loss', difficulty => {
    const board = FourBoard.fromMoves([0,1,0,1,0])!;
    expect(chooseMove(board, difficulty, { random: seededRandom(4) })).toBe(0);
  });
  it.each(['easy','normal','strong'] as Difficulty[])('%s always returns a legal column or null when terminal', difficulty => {
    const board = FourBoard.fromMoves([3,3,3,3,3,3,0,1,0,1])!;
    expect(board.legalColumns()).toContain(chooseMove(board, difficulty, { random: seededRandom(21) }));
    expect(chooseMove(FourBoard.fromMoves([0,1,0,1,0,1,0])!, difficulty)).toBeNull();
  });
  it('uses reproducible easy randomness and distinct bounded exploration', () => {
    const board = new FourBoard();
    expect(chooseMove(board, 'easy', { random: seededRandom(1) })).toBe(chooseMove(board, 'easy', { random: seededRandom(1) }));
    const selected = chooseMove(board, 'strong', { now: () => 0, milliseconds: 1, nodeLimit: 0 });
    expect(board.legalColumns()).toContain(selected);
    expect(chooseMove(board, 'normal', { now: () => 0, nodeLimit: 3000 })).toBe(3);
    let clock=0;
    expect(board.legalColumns()).toContain(chooseMove(board, 'strong', { now: () => clock++, milliseconds: 2 }));
    expect(clock).toBeLessThan(8);
  });
});

describe('Game021 undo, cancellation and single-operation barriers', () => {
  it('undoes two moves after CPU response and one human move while pending', () => {
    const board = FourBoard.fromMoves([3,2])!;
    expect(undoCount(board,cpu)).toBe(2); board.undo(2); expect(board.moves).toEqual([]); expect(board.turn).toBe(1);
    board.drop(4); expect(undoCount(board,cpu)).toBe(1); board.undo(1); expect(board.moves).toEqual([]);
  });
  it('undoes one in two-player mode; second-player cannot undo the initial CPU move alone', () => {
    const board=FourBoard.fromMoves([3])!;
    expect(undoCount(board,two)).toBe(1);
    expect(undoCount(board,{...cpu,first:false})).toBe(0);
  });
  it('rejects an old CPU response after undo, including identical move-count ABA', () => {
    let clock=1000; const gate=new TurnGate(()=>clock), board=new FourBoard();
    expect(gate.humanDrop(board,3,cpu)).toBe(true); const old=gate.ticket(board);
    gate.invalidate(); board.undo(); clock+=300; gate.humanDrop(board,2,cpu);
    expect(gate.cpuDrop(old,board,4,cpu)).toBe(false); expect(board.moves).toEqual([2]);
    const current=gate.ticket(board); expect(gate.cpuDrop(current,board,4,cpu)).toBe(true);
    expect(gate.cpuDrop(current,board,5,cpu)).toBe(false); expect(board.moves).toEqual([2,4]);
  });
  it('rejects CPU response after pause/new/title invalidation', () => {
    const board=FourBoard.fromMoves([3])!, gate=new TurnGate(()=>1000), ticket=gate.ticket(board);
    gate.invalidate(); expect(gate.cpuDrop(ticket,board,2,cpu)).toBe(false); expect(board.moves).toEqual([3]);
  });
  it('rapid activation cannot add two moves; CPU hand cannot accept human input', () => {
    let clock=1000; const gate=new TurnGate(()=>clock), board=new FourBoard();
    expect(gate.humanDrop(board,3,two)).toBe(true); expect(gate.humanDrop(board,4,two)).toBe(false);
    clock+=220; expect(gate.humanDrop(board,4,two)).toBe(true);
    const cpuBoard=new FourBoard(),cpuGate=new TurnGate(()=>1000);
    expect(cpuGate.humanDrop(cpuBoard,3,cpu)).toBe(true); expect(cpuGate.humanDrop(cpuBoard,2,cpu)).toBe(false);
  });
});

describe('Game021 defensive atomic save and outcome records', () => {
  it('round trips complete active snapshot including difficulty, first/second and assist counts', () => {
    const archive=freshArchive(); archive.saved=run([3,2,3],{...cpu,first:false,difficulty:'strong'}); archive.saved.hints=2;
    expect(parseArchive(JSON.parse(JSON.stringify(archive)))).toEqual(archive);
    expect(FourBoard.fromMoves(parseArchive(archive)!.saved!.moves)!.turn).toBe(2);
  });
  it('rejects cross-game/rules/corrupt histories/counts/settings and mismatched terminal outcomes', () => {
    const archive=freshArchive(); archive.saved=run([0,1,0,1,0,1,0]);
    expect(parseArchive({...archive,game_id:'game020'})).toBeNull(); expect(parseArchive({...archive,rules_version:'2'})).toBeNull();
    expect(parseArchive({...archive,saved:{...archive.saved,moves:[9]}})).toBeNull();
    expect(parseArchive({...archive,saved:{...archive.saved,undos:-1}})).toBeNull();
    expect(parseArchive({...archive,saved:{...archive.saved,outcome:'loss'}})).toBeNull();
    expect(parseArchive({...archive,saved:{...archive.saved,reported:true}})).toBeNull();
    expect(parseArchive({...archive,settings:{...cpu,difficulty:'impossible'}})).toBeNull();
  });
  it('atomically records one outcome and never recounts a restored result', () => {
    const archive=freshArchive(); archive.saved=run([0,1,0,1,0,1,0]); archive.saved.hints=1;
    expect(outcomeFor(FourBoard.fromMoves(archive.saved.moves)!,cpu)).toBe('win');
    expect(finalize(archive,'win')).toBe(true); const key=statKey(archive.saved); expect(key).toBe('cpu:normal:first:assisted');
    const restored=parseArchive(JSON.parse(JSON.stringify(archive)))!;
    expect(restored.saved!.reported).toBe(true); expect(finalize(restored,'win')).toBe(false); expect(restored.stats[key].wins).toBe(1);
  });
  it('keeps difficulty, first/second and unassisted outcomes separate; quits and resets do not count as losses', () => {
    const archive=freshArchive(); archive.saved=run([], {...cpu,first:false,difficulty:'easy'}); finalize(archive,'quit'); expect(archive.stats).toEqual({});
    archive.saved=run([]); finalize(archive,'reset'); expect(archive.stats).toEqual({});
    archive.saved=run([], {...cpu,first:false,difficulty:'strong'}); finalize(archive,'loss');
    expect(archive.stats['cpu:strong:second:unassisted']).toEqual({wins:0,losses:1,draws:0});
  });
  it('storage corruption/denied reads and writes preserve playable in-memory state', () => {
    const denied=new GameStore({getItem:()=>{throw new Error('denied')},setItem:()=>{throw new Error('denied')}});
    const archive=denied.load(); archive.saved=run([2]); denied.save(archive); expect(denied.load().saved!.moves).toEqual([2]);
    const corrupt=new GameStore({getItem:()=>'{bad',setItem:()=>{}}); expect(corrupt.load()).toEqual(freshArchive());
    let key='',raw='';const working=new GameStore({getItem:()=>null,setItem:(k,v)=>{key=k;raw=v}});
    working.save(archive); expect(key).toBe(SAVE_KEY); expect(parseArchive(JSON.parse(raw))!.saved!.moves).toEqual([2]);
  });
});
