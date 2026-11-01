/** Seed4301: authored telegraphed six-phase competition patterns, no runtime random spawn. */
export interface Spawn {id:number;t:number;x:number;y:number;vx:number;vy:number;phase:number}
export const SEED=4301;export const spawns:Spawn[]=[];
function emit(t:number,x:number,y:number,vx:number,vy:number,phase:number){spawns.push({id:spawns.length+1,t,x,y,vx,vy,phase});}
for(let k=0;k<72;k++){const t=1+k*.8;if(t>=60)break;const phase=Math.floor(t/10),a=k*.71;
 if(phase===0||phase===2){const x=phase===0?(k%2?125:355):240;for(let j=-2;j<=2;j++){const angle=(phase===2?Math.sin(a)*.55:0)+j*.29;emit(t,x,20,Math.sin(angle)*160,Math.cos(angle)*160,phase);}}
 else if(phase===1||phase===4){const gap=80+(((phase===4?Math.floor(k/2):k)*83)%320);for(let x=30;x<=450;x+=60)if(Math.abs(x-gap)>46)emit(t,x,20,phase===4?Math.sin(a)*28:0,180,phase);}
 else{for(let j=0;j<3;j++){const y=65+j*75;emit(t,20,y,165,65+30*Math.sin(a+j),phase);emit(t,460,y,-165,65+30*Math.cos(a+j),phase);}}
}
// Final edge sweeps make a static corner no universal safe strategy.
for(const t of[50.75,52,53.25,54.5])for(const x of[12,468])emit(t,x,10,0,220,5);
// Late diagonal duets and rotating fans; same .75s visual warning.
for(let k=0;k<12;k++){const t=40.4+k*.8;if(k%2===0){emit(t,20,80,130,150,4);emit(t,460,100,-130,150,4);}}
for(let k=0;k<10;k++){const t=50.4+k*.8;for(let j=-1;j<=1;j++){const angle=Math.sin(k*.55)*.65+j*.23;emit(t,240,20,Math.sin(angle)*145,Math.cos(angle)*145,5);}}
spawns.sort((a,b)=>a.t-b.t||a.id-b.id);
