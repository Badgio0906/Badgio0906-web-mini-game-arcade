/** Authored parent-bone angles. Canvas +x faces right, +y down; one bend branch only. */
export const THIGH_LENGTH = 74;
export const SHIN_LENGTH = 68;
export const KICK_KEYS = [
  {t:0,a:.62,b:.75,label:'立ち姿'}, {t:.17,a:-.35,b:.9,label:'後ろへ引く'},
  {t:.32,a:-.15,b:.8,label:'振り戻す'}, {t:.43,a:.35,b:.8,label:'身体の下'},
  {t:.55,a:.95,b:.32,label:'前へ蹴る'}, {t:.63,a:1.45,b:.12,label:'靴が離れる'},
  {t:.78,a:1.6,b:.18,label:'振り抜く'}, {t:1,a:.62,b:.75,label:'戻る'},
] as const;
const ease=(t:number)=>t*t*(3-2*t);
const point=(x:number,y:number,a:number,length:number)=>({x:x+Math.sin(a)*length,y:y+Math.cos(a)*length});
export function kickPose(progress:number,swing=0,standing=false){
  const t=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));
  let a=.62,b=.75;
  if(t===0&&!standing){a=Math.max(.42,Math.min(1.2,.62+swing*.3));b=.75;}
  else if(!standing){let i=1;while(i<KICK_KEYS.length-1&&t>KICK_KEYS[i].t)i++;const l=KICK_KEYS[i-1],r=KICK_KEYS[i];const p=ease((t-l.t)/(r.t-l.t));const startA=i===1?Math.max(.42,Math.min(1.2,.62+swing*.3)):l.a;a=startA+(r.a-startA)*p;b=l.b+(r.b-l.b)*p;}
  const hip={x:15,y:-2},knee=point(hip.x,hip.y,a,THIGH_LENGTH),ankle=point(knee.x,knee.y,a-b,SHIN_LENGTH);
  return {hip,knee,ankle,a,b,released:!standing&&t>=.63,releaseProgress:Math.max(0,(t-.63)/.37),footAngle:-.12-Math.max(0,Math.min(1,(a-.5)/1.1))*.35};
}
/** Same fixed lengths, anterior knee; grounded support ankle never follows spin. */
export function supportPose(){
  const hip={x:-22,y:-4},ankle={x:-40,y:124},dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.hypot(dx,dy);
  const along=(THIGH_LENGTH**2-SHIN_LENGTH**2+d*d)/(2*d),side=Math.sqrt(THIGH_LENGTH**2-along*along);
  const knee={x:hip.x+dx/d*along+dy/d*side,y:hip.y+dy/d*along-dx/d*side};
  return{hip,knee,ankle};
}
