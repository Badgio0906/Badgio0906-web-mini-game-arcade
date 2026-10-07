export type Direction = 'up' | 'right' | 'down' | 'left';
export type Speed = 4 | 6 | 8;
export interface Cell { x: number; y: number }
export interface SnakeState {
  size: number; seed: number; body: Cell[]; food: Cell | null; direction: Direction;
  queue: Direction[]; foods: number; ticks: number; outcome: 'playing' | 'wall' | 'self' | 'clear';
}
export const DIRECTIONS: Direction[] = ['up','right','down','left'];
const delta: Record<Direction, Cell> = { up:{x:0,y:-1}, right:{x:1,y:0}, down:{x:0,y:1}, left:{x:-1,y:0} };
export const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
export const opposite = (a: Direction, b: Direction) => (DIRECTIONS.indexOf(a) + 2) % 4 === DIRECTIONS.indexOf(b);
/** Bounded selection over free cells, including the final free cell. */
export function placeFood(body: Cell[], size: number, seed: number): { food: Cell | null; seed: number } {
  const occupied = new Set(body.map(p => p.y * size + p.x));
  const free: Cell[] = [];
  for (let y=0; y<size; y++) for (let x=0; x<size; x++) if (!occupied.has(y*size+x)) free.push({x,y});
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return { food: free.length ? free[seed % free.length] : null, seed };
}
export function createSnake(seed: number, size = 20): SnakeState {
  const y = Math.floor(size/2), x = Math.floor(size/2);
  const body = [{x,y},{x:x-1,y},{x:x-2,y}];
  const food = placeFood(body,size,seed >>> 0);
  return {size,...food,body,direction:'right',queue:[],foods:0,ticks:0,outcome:'playing'};
}
export function enqueue(state: SnakeState, direction: Direction): SnakeState {
  const last = state.queue.at(-1) ?? state.direction;
  if (state.outcome !== 'playing' || state.queue.length >= 2 || direction === last || opposite(last,direction)) return state;
  return {...state, queue:[...state.queue,direction]};
}
export function step(state: SnakeState): SnakeState {
  if (state.outcome !== 'playing') return state;
  const direction = state.queue[0] ?? state.direction, queue = state.queue.slice(1);
  const head = {x:state.body[0].x+delta[direction].x,y:state.body[0].y+delta[direction].y};
  const next = {...state,direction,queue,ticks:state.ticks+1};
  if (head.x < 0 || head.y < 0 || head.x >= state.size || head.y >= state.size) return {...next,outcome:'wall'};
  const grows = state.food !== null && same(head,state.food);
  const solid = grows ? state.body : state.body.slice(0,-1);
  if (solid.some(p=>same(p,head))) return {...next,outcome:'self'};
  const body = [head,...state.body];
  if (!grows) body.pop();
  if (!grows) return {...next,body};
  const food = placeFood(body,state.size,state.seed);
  return {...next,body,...food,foods:state.foods+1,outcome:food.food ? 'playing' : 'clear'};
}
