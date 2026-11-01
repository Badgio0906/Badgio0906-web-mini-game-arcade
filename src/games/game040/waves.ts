/** Reproducible authored waves. Coordinates use the fixed 480x480 playfield. */
export type EnemyKind = 'dust' | 'can' | 'bag' | 'boss' | 'bomb';
export interface Spawn {
  readonly atMs: number;
  readonly kind: EnemyKind;
  readonly x: number;
  readonly y: number;
  readonly vx?: number;
  readonly vy?: number;
  readonly hp?: number;
  readonly r?: number;
}
export const DEFAULT_SEED = 0x5accb00;
function rng(seed:number):()=>number {let state=seed>>>0||1;return()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};}
export function createWaves(seed=DEFAULT_SEED,practice=false):readonly Spawn[]{
  const random=rng(seed),spawns:Spawn[]=[];
  const add=(atMs:number,kind:EnemyKind,x:number,y:number,vy=0,vx=0)=>spawns.push({atMs,kind,x,y,vy,vx});
  // Exact first-chain geometry; equal drift preserves all the inter-enemy distances.
  for(const x of[96,168,240,312,384])add(0,'can',x,156,12);
  add(0,'bag',420,220,12);
  for(let i=0;i<7;i++)add(0,'dust',220+(i%5)*10,360+Math.floor(i/5)*36,18);
  add(0,'bomb',250,330,12);
  if(practice)return Object.freeze(spawns.map(s=>Object.freeze(s)));
  for(let group=1;group<=12;group++){
    const t=group*3500,side=group%2===0?1:-1;
    const centerAngle=side*(group>=5?40:28);
    // Nine-dust arcs build charge progressively; the ninth and last pickup reaches full with no leftover ammo wall.
    // Non-suction drift is radial and leaves the screen; unused waves never accumulate without limit.
    for(let i=0;i<9;i++){
      const a=(centerAngle+(i-4)*2.5+(random()-.5)*1.2)*Math.PI/180;
      const radius=group===11?(i<2?38+i*15:140+(i-2)*15):110+i*15;
      add(t,'dust',240+Math.sin(a)*radius,462-Math.cos(a)*radius,Math.cos(a)*30,-Math.sin(a)*30);
    }
  }
  for(let group=1;group<=10;group++){
    const t=group*4000-500,side=group%2===0?1:-1;
    const center=240+side*(group<4?87:125);
    const count=group<4?4:5;
    for(let i=0;i<count;i++){
      const x=Math.max(32,Math.min(448,center+(i-(count-1)/2)*56));
      const y=105+(i%2)*27;
      add(t+i*(group>=4?95:0),'can',x,y,group>=7?29:group>=4?26:23);
    }
    add(t+180,'bag',240-side*140,185,18);
  }
  // Mid-run dense cleanup opportunity: readable can-to-can spacing also makes 12-chain ranks attainable.
  for(let row=0;row<3;row++)for(let col=0;col<4;col++)add(29500,'can',156+col*56,118+row*56,26);
  // The short central approach is intentionally answerable with the two near-nozzle dusts at38.5s.
  // Waiting for all nine is too slow; spending a small shot avoids this life loss.
  add(38000,'can',240,400,36);
  for(const t of[10500,21000,31500,42000,48500,54500])add(t,'bomb',240+(t===21000?-70:t===31500?70:0),310,16);
  add(45000,'boss',240,110,0);
  for(const t of[45000,48000,51000,54000,57000]){
    // These are inside the central suction cone; nine can be gathered before the next supply.
    for(let i=0;i<10;i++){
      const a=(-10+i*20/9)*Math.PI/180;
      const radius=i>=8?220:90+i*14;
      add(t,'dust',240+Math.sin(a)*radius,462-Math.cos(a)*radius,Math.cos(a)*35,-Math.sin(a)*35);
    }
  }
  return Object.freeze(spawns.map((s,index)=>({...s,index})).sort((a,b)=>a.atMs-b.atMs||a.index-b.index).map(({index:_,...s})=>Object.freeze(s)));
}
