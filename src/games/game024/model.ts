export type Direction = 'up' | 'right' | 'down' | 'left';
export type Speed = 4 | 6 | 8;
export interface Cell { x: number; y: number }
export interface SnakeState {
  size: number; seed: number; body: Cell[]; food: Cell | null; direction: Direction;
  queue: Direction[]; foods: number; ticks: number; outcome: 'playing' | 'wall' | 'self' | 'clear';
  walls: Cell[]; untilChange: number; changes: number; transitionMs: number; transitionExit:Direction|null;
}
export const TRANSITION_MS = 650;
export const DIRECTIONS: Direction[] = ['up','right','down','left'];
const delta: Record<Direction, Cell> = { up:{x:0,y:-1}, right:{x:1,y:0}, down:{x:0,y:1}, left:{x:-1,y:0} };
export const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
export const opposite = (a: Direction, b: Direction) => (DIRECTIONS.indexOf(a) + 2) % 4 === DIRECTIONS.indexOf(b);
const random = (seed:number) => (Math.imul(seed,1664525)+1013904223)>>>0;
const key = (p:Cell,size:number) => p.y*size+p.x;
const inside = (p:Cell,size:number) => p.x>=0 && p.y>=0 && p.x<size && p.y<size;
/** Bounded selection over free cells, including the final free cell. */
export function placeFood(body: Cell[], size: number, seed: number, walls:Cell[]=[]): { food: Cell | null; seed: number } {
  const occupied = new Set([...body,...walls].map(p => key(p,size)));
  const free: Cell[] = [];
  for (let y=0; y<size; y++) for (let x=0; x<size; x++) if (!occupied.has(y*size+x)) free.push({x,y});
  seed = random(seed);
  return { food: free.length ? free[seed % free.length] : null, seed };
}
/** Flood fill treats the current body as solid; no hypothetical teleport through it. */
export function reachableCells(body:Cell[],size:number,walls:Cell[]):Cell[] {
  const blocked=new Set([...body.slice(1),...walls].map(p=>key(p,size))), seen=new Set<number>([key(body[0],size)]), todo=[body[0]];
  for(let i=0;i<todo.length;i++)for(const d of DIRECTIONS){const p={x:todo[i].x+delta[d].x,y:todo[i].y+delta[d].y}, k=key(p,size);if(inside(p,size)&&!blocked.has(k)&&!seen.has(k)){seen.add(k);todo.push(p);}}
  return todo.slice(1);
}
export function createSnake(seed: number, size = 20): SnakeState {
  const y = Math.floor(size/2), x = Math.floor(size/2);
  const body = [{x,y},{x:x-1,y},{x:x-2,y}];
  const food = placeFood(body,size,seed >>> 0), nextSeed=random(food.seed);
  return {size,...food,seed:nextSeed,body,direction:'right',queue:[],foods:0,ticks:0,outcome:'playing',walls:[],untilChange:3+nextSeed%5,changes:0,transitionMs:0,transitionExit:null};
}
export function enqueue(state: SnakeState, direction: Direction): SnakeState {
  const last = state.queue.at(-1) ?? state.direction;
  if (state.outcome !== 'playing' || state.transitionMs>0 || state.queue.length >= 2 || direction === last || opposite(last,direction)) return state;
  return {...state, queue:[...state.queue,direction]};
}
/** Reserve the complete straight-ahead corridor and each legal adjacent turn. */
export function regenerateBoard(state:SnakeState):SnakeState {
  let seed=state.seed;
  const protectedCells=new Set(state.body.map(p=>key(p,state.size)));
  if(state.food)protectedCells.add(key(state.food,state.size));
  for(const d of DIRECTIONS){if(opposite(d,state.direction))continue;const p={...state.body[0]};for(let i=0;i<(d===state.direction?3:1);i++){p.x+=delta[d].x;p.y+=delta[d].y;if(inside(p,state.size))protectedCells.add(key(p,state.size));}}
  // Long snakes recover the whole board; a permanent obstacle cannot block 400-cell clear.
  const target=state.body.length>=160 ? 0 : Math.min(28,4+state.changes*3,Math.floor((state.size*state.size-state.body.length)/10));
  let walls:Cell[]=[];
  for(let attempt=0;attempt<96 && walls.length<target;attempt++){
    seed=random(seed);const x=1+seed%(state.size-2);seed=random(seed);const y=1+seed%(state.size-2);seed=random(seed);const horizontal=(seed&1)===0, length=1+seed%4;
    const segment=Array.from({length},(_,i)=>({x:x+(horizontal?i:0),y:y+(horizontal?0:i)})).filter(p=>inside(p,state.size)&&!protectedCells.has(key(p,state.size))&&!walls.some(w=>same(w,p)));
    const candidate=[...walls,...segment].slice(0,target), reachable=reachableCells(state.body,state.size,candidate);
    if(reachable.length && (!state.food||reachable.some(p=>same(p,state.food!))))walls=candidate;
  }
  // If a nearly identical layout was sampled, the safe empty-board fallback still removes old walls.
  if(walls.length===state.walls.length && walls.every(p=>state.walls.some(w=>same(w,p))))walls=[];
  seed=random(seed);
  return {...state,seed,walls,queue:[],untilChange:3+seed%5,changes:state.changes+1,transitionMs:TRANSITION_MS,transitionExit:null};
}
/** UI animation time is separate from movement time and survives pause/reload. */
export function advanceTransition(state:SnakeState,ms:number):SnakeState {
  if(state.transitionMs<=0)return state;
  const transitionMs=Math.max(0,state.transitionMs-Math.max(0,ms));
  if(transitionMs>0)return {...state,transitionMs};
  const legal=(d:Direction)=>{const p={x:state.body[0].x+delta[d].x,y:state.body[0].y+delta[d].y};return !opposite(d,state.direction)&&inside(p,state.size)&&!state.walls.some(w=>same(w,p))&&!state.body.slice(0,-1).some(b=>same(b,p));};
  const exit=[state.direction,...DIRECTIONS].find(legal);
  // A fresh default turn replaces discarded input at an edge; direction still matches the body until the actual tick.
  return {...state,transitionMs:0,queue:[],transitionExit:exit&&exit!==state.direction?exit:null};
}
export function step(state: SnakeState): SnakeState {
  if (state.outcome !== 'playing' || state.transitionMs>0) return state;
  const direction = state.queue[0] ?? state.transitionExit ?? state.direction, queue = state.queue.slice(1);
  const head = {x:state.body[0].x+delta[direction].x,y:state.body[0].y+delta[direction].y};
  const next = {...state,direction,queue,transitionExit:null,ticks:state.ticks+1};
  if (!inside(head,state.size) || state.walls.some(p=>same(p,head))) return {...next,outcome:'wall'};
  const grows = state.food !== null && same(head,state.food);
  const solid = grows ? state.body : state.body.slice(0,-1);
  if (solid.some(p=>same(p,head))) return {...next,outcome:'self'};
  const body = [head,...state.body];
  if (!grows) body.pop();
  if (!grows) return {...next,body};
  const foods=state.foods+1;
  if(body.length===state.size*state.size)return {...next,body,foods,food:null,walls:[],transitionMs:0,outcome:'clear'};
  const changing=state.untilChange===1;
  // Remove walls before long bodies or a new layout; choose food only in currently accessible space.
  const walls=changing||body.length>=160?[]:state.walls;
  let seed=random(state.seed);
  const reachable=reachableCells(body,state.size,walls);
  const food=reachable.length ? reachable[seed%reachable.length] : placeFood(body,state.size,seed,walls).food;
  const grown={...next,body,foods,food,seed,walls,untilChange:state.untilChange-1};
  return changing ? regenerateBoard({...grown,walls:state.walls}) : grown;
}
