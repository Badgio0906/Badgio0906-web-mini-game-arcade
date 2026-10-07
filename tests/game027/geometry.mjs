const nearSegment=(p,a,b)=>{const vx=b.x-a.x,vy=b.y-a.y,length=vx*vx+vy*vy,t=Math.max(0,Math.min(1,((p.x-a.x)*vx+(p.y-a.y)*vy)/length));return Math.hypot(p.x-a.x-vx*t,p.y-a.y-vy*t);};
const pockets=[{x:0,y:0},{x:450,y:0},{x:900,y:0},{x:0,y:450},{x:450,y:450},{x:900,y:450}];
const group=id=>id>=1&&id<=7?'solid':id>=9?'stripe':null;
export function choices(snapshot,hand){const w=snapshot.world,m=snapshot.match,cue=w.balls.find(b=>b.id===0),own=w.balls.filter(b=>!b.pocketed&&group(b.id)===m.groups[m.turn]&&b.id!==0&&b.id!==8);const legal=m.break?w.balls.filter(b=>!b.pocketed&&b.id!==0):m.groups[m.turn]?(own.length?own:w.balls.filter(b=>b.id===8&&!b.pocketed)):w.balls.filter(b=>!b.pocketed&&group(b.id)!==null);
 return legal.flatMap(b=>pockets.flatMap(p=>{const distance=Math.hypot(p.x-b.x,p.y-b.y),u={x:(p.x-b.x)/distance,y:(p.y-b.y)/distance},ghost={x:b.x-u.x*24.1,y:b.y-u.y*24.1};const blocks=w.balls.filter(o=>!o.pocketed&&o.id!==0&&o.id!==b.id&&nearSegment(o,b,p)<25).length;
  const starts=hand?[45,65,90,120].map(d=>({x:b.x-u.x*d,y:b.y-u.y*d})): [cue];return starts.filter(a=>a.x>=12&&a.x<=888&&a.y>=12&&a.y<=438&&!pockets.some(p=>Math.hypot(a.x-p.x,a.y-p.y)<35)&&w.balls.every(o=>o.id===0||o.pocketed||Math.hypot(a.x-o.x,a.y-o.y)>=24.1)).map(a=>{const length=Math.hypot(ghost.x-a.x,ghost.y-a.y),ux=(ghost.x-a.x)/length,uy=(ghost.y-a.y)/length,alignment=ux*u.x+uy*u.y;
    const blocked=w.balls.filter(o=>!o.pocketed&&o.id!==0&&o.id!==b.id&&nearSegment(o,a,ghost)<25).length;const speed=Math.sqrt(270*(distance+length+40))/Math.max(.25,alignment);return {ball:b.id,start:{x:a.x,y:a.y},angle:Math.atan2(ghost.y-a.y,ghost.x-a.x),power:Math.max(6,Math.min(85,Math.ceil((speed-70)/10.3)+3)),alignment,score:blocks*2000+blocked*2000+distance+length+(1-alignment)*400,blocks,blocked};});})).filter(c=>c.alignment>.35).sort((a,b)=>a.score-b.score);
}
export function planShot(snapshot,hand=false){
 const clear=choices(snapshot,hand).find(c=>!c.blocks&&!c.blocked);
 if(clear)return {...clear,strategy:'clear-pocket'};
 const w=snapshot.world,m=snapshot.match,cue=w.balls.find(b=>b.id===0),live=w.balls.filter(b=>!b.pocketed&&b.id!==0);
 const own=live.filter(b=>group(b.id)===m.groups[m.turn]&&b.id!==8);
 const legal=m.break?live:!m.groups[m.turn]?live.filter(b=>group(b.id)!==null):own.length?own:live.filter(b=>b.id===8);
 const valid=a=>a.x>=12&&a.x<=888&&a.y>=12&&a.y<=438&&!pockets.some(p=>Math.hypot(a.x-p.x,a.y-p.y)<35)&&live.every(b=>Math.hypot(a.x-b.x,a.y-b.y)>=24.1);
 const contacts=legal.flatMap(b=>{
  const starts=hand?Array.from({length:24},(_,i)=>[45,65,90,120].map(d=>({x:b.x-Math.cos(i*Math.PI/12)*d,y:b.y-Math.sin(i*Math.PI/12)*d}))).flat().filter(valid):[cue];
  return starts.filter(a=>live.every(o=>o.id===b.id||nearSegment(o,a,b)>=24.2)).map(a=>({ball:b.id,start:{x:a.x,y:a.y},angle:Math.atan2(b.y-a.y,b.x-a.x),power:62,score:Math.hypot(b.x-a.x,b.y-a.y),strategy:'legal-cluster-contact'}));
 }).sort((a,b)=>a.score-b.score||a.ball-b.ball);
 if(contacts.length)return contacts[0];
 // An unavailable legal direct line is explicitly a bounded planner limitation; one foul may grant hand placement.
 const a=[0,Math.PI/2,Math.PI,-Math.PI/2].map(angle=>({angle,power:0,ball:null,start:{x:cue.x,y:cue.y},strategy:'no-accessible-line',distance:Math.min(...live.map(b=>nearSegment(b,cue,{x:cue.x+Math.cos(angle)*35,y:cue.y+Math.sin(angle)*35})))})).sort((a,b)=>b.distance-a.distance)[0];
 return a;
}
