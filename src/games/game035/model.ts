export const WIDTH=480,HEIGHT=760,RADIUS=18,FRICTION=150,FIXED_DT=1/120;
export const HOUSE={x:240,y:205,r:128},RELEASE={x:240,y:665};
export interface Stone {id:number;team:'you'|'other';x:number;y:number;vx:number;vy:number;out:boolean}
export interface EndScore {close:number;removal:number;guard:number;economy:number;total:number}
export interface CurlingState {end:number;shots:number;stones:Stone[];moving:boolean;seconds:number;total:number;chain:number;results:EndScore[];outcome:'playing'|'complete';practice:boolean;}
const opponentLayouts=[[{x:240,y:205},{x:230,y:325}],[{x:198,y:220},{x:290,y:290}],[{x:265,y:180},{x:240,y:345}]];
export function startEnd(end:number,practice=false):Stone[]{return practice?[]:opponentLayouts[end-1].map((p,i)=>({id:i,team:'other',...p,vx:0,vy:0,out:false}));}
export function createCurling(practice=false):CurlingState{return {end:1,shots:0,stones:startEnd(1,practice),moving:false,seconds:0,total:0,chain:0,results:[],outcome:'playing',practice};}
export function throwStone(state:CurlingState,dx:number,dy:number,power:number):boolean {
  const length=Math.hypot(dx,dy);if(!Number.isFinite(dx)||!Number.isFinite(dy)||state.moving||state.outcome!=='playing'||state.shots>=3&&!state.practice||length<.01||dy>=-.05||!Number.isFinite(power))return false;
  const p=Math.min(1,Math.max(.08,power)),speed=80+460*p;
  state.stones.push({id:10+state.shots,team:'you',x:RELEASE.x,y:RELEASE.y,vx:dx/length*speed,vy:dy/length*speed,out:false});
  state.shots++;state.moving=true;return true;
}
/** Equal masses, one collision impulse and one friction coefficient for every color. */
export function stepCurling(state:CurlingState,dt=FIXED_DT):void {
  if(!state.moving)return;
  const bounded=Math.max(0,Math.min(FIXED_DT,dt));state.seconds+=bounded;
  for(const s of state.stones){if(s.out)continue;const speed=Math.hypot(s.vx,s.vy),next=Math.max(0,speed-FRICTION*bounded),scale=speed?next/speed:0;s.x+=(s.vx+s.vx*scale)*.5*bounded;s.y+=(s.vy+s.vy*scale)*.5*bounded;s.vx*=scale;s.vy*=scale;}
  for(let a=0;a<state.stones.length;a++)for(let b=a+1;b<state.stones.length;b++){
    const p=state.stones[a],q=state.stones[b];if(p.out||q.out)continue;const dx=q.x-p.x,dy=q.y-p.y,dist=Math.hypot(dx,dy);if(dist>=RADIUS*2)continue;
    const nx=dist>1e-8?dx/dist:1,ny=dist>1e-8?dy/dist:0,overlap=(RADIUS*2-dist+.001)/2;
    p.x-=nx*overlap;p.y-=ny*overlap;q.x+=nx*overlap;q.y+=ny*overlap;
    const relative=(q.vx-p.vx)*nx+(q.vy-p.vy)*ny;if(relative<0){const impulse=-relative*.97;p.vx-=impulse*nx;p.vy-=impulse*ny;q.vx+=impulse*nx;q.vy+=impulse*ny;}
  }
  for(const s of state.stones){if(s.x < -RADIUS||s.x>WIDTH+RADIUS||s.y< -RADIUS||s.y>HEIGHT+RADIUS){s.out=true;s.vx=0;s.vy=0;}}
  state.moving=state.stones.some(s=>!s.out&&Math.hypot(s.vx,s.vy)>.01);
}
export function scoreEnd(state:CurlingState):EndScore {
  const yours=state.stones.filter(s=>s.team==='you'&&!s.out),others=state.stones.filter(s=>s.team==='other');
  const close=yours.reduce((n,s)=>n+Math.round(1000*Math.max(0,1-Math.hypot(s.x-HOUSE.x,s.y-HOUSE.y)/HOUSE.r)),0);
  const removal=others.filter(s=>s.out||Math.hypot(s.x-HOUSE.x,s.y-HOUSE.y)>HOUSE.r+RADIUS).length*150;
  const target=yours.filter(s=>Math.hypot(s.x-HOUSE.x,s.y-HOUSE.y)<HOUSE.r).sort((a,b)=>Math.hypot(a.x-HOUSE.x,a.y-HOUSE.y)-Math.hypot(b.x-HOUSE.x,b.y-HOUSE.y))[0];
  const guard=target&&yours.some(s=>s!==target&&s.y>HOUSE.y+90&&s.y<RELEASE.y-65&&Math.abs(s.x-target.x)<55)?150:0;
  const economy=close>0?(3-Math.min(3,state.shots))*100:0;
  return {close,removal,guard,economy,total:close+removal+guard+economy};
}
export function finishEnd(state:CurlingState):EndScore|null {
  if(state.moving||state.shots===0||state.outcome!=='playing'||state.practice)return null;
  const score=scoreEnd(state);state.chain=score.close>0?state.chain+1:0;score.total+=Math.max(0,state.chain-1)*200;
  state.total+=score.total;state.results.push(score);
  if(state.end===3)state.outcome='complete';else{state.end++;state.shots=0;state.stones=startEnd(state.end);}
  return score;
}
export function dragShot(dx:number,dy:number):{dx:number;dy:number;power:number}|null {const distance=Math.hypot(dx,dy);return distance<12||dy>=-5?null:{dx,dy,power:Math.min(1,distance/190)};}
