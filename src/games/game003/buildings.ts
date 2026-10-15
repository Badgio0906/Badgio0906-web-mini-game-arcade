import Matter from 'matter-js';
export interface BuildingPart { x: number; y: number; w: number; h: number; density?: number }
export interface BuildingShape { id: string; name: string; color: string; parts: BuildingPart[] }
/** Non-overlapping solid rectangles in top-left coordinates. Their union is both art mask and collider. */
export const BUILDINGS: readonly BuildingShape[] = [
 {id:'long',name:'横長の商店',color:'#d6a36e',parts:[{x:0,y:0,w:142,h:46}]},
 {id:'slender',name:'細身の時計ビル',color:'#91b5c2',parts:[{x:0,y:0,w:58,h:102}]},
 {id:'crown',name:'王冠オフィス',color:'#d9be73',parts:[{x:0,y:0,w:132,h:38},{x:36,y:38,w:60,h:42}]},
 {id:'cantilever',name:'張り出す美術館',color:'#c88b78',parts:[{x:0,y:0,w:130,h:36},{x:0,y:36,w:48,h:56}]},
 {id:'ell',name:'L字のアパート',color:'#9caf8c',parts:[{x:0,y:0,w:44,h:54},{x:0,y:54,w:126,h:36}]},
 {id:'step',name:'階段ホテル',color:'#a2b8bf',parts:[{x:0,y:0,w:42,h:30},{x:0,y:30,w:84,h:30},{x:0,y:60,w:126,h:30}]},
 {id:'rooftop',name:'給水塔のあるビル',color:'#c7a281',parts:[{x:0,y:30,w:120,h:48},{x:72,y:0,w:32,h:30}]},
 {id:'factory',name:'重いボイラー工場',color:'#bd9276',parts:[{x:0,y:36,w:140,h:42},{x:12,y:0,w:30,h:36},{x:94,y:10,w:46,h:26,density:0.0024}]},
 {id:'asymmetric',name:'ずれた研究所',color:'#95b7ad',parts:[{x:0,y:0,w:90,h:36},{x:36,y:36,w:90,h:38},{x:64,y:74,w:62,h:26}]},
 {id:'mushroom',name:'頭でっかち本社',color:'#ac9db9',parts:[{x:0,y:0,w:138,h:54},{x:54,y:54,w:30,h:44}]},
];
export function shapeMetrics(shape: BuildingShape) {
 let mass=0,x=0,y=0; const width=Math.max(...shape.parts.map(p=>p.x+p.w)),height=Math.max(...shape.parts.map(p=>p.y+p.h));
 for(const p of shape.parts){const m=p.w*p.h*(p.density??.0012);mass+=m;x+=(p.x+p.w/2)*m;y+=(p.y+p.h/2)*m;}
 return {width,height,mass,cx:x/mass,cy:y/mass};
}
export function createBuilding(shape: BuildingShape, x: number, y: number, angle=0): Matter.Body {
 const m=shapeMetrics(shape);
 const parts=shape.parts.map(p=>Matter.Bodies.rectangle(x+p.x+p.w/2-m.cx,y+p.y+p.h/2-m.cy,p.w,p.h,{density:p.density??.0012,friction:.85,frictionStatic:1.5,restitution:0,slop:.015}));
 const body=Matter.Body.create({parts,friction:.85,frictionStatic:1.5,frictionAir:.012,restitution:0,sleepThreshold:90,label:shape.id});
 Matter.Body.setAngle(body,angle); return body;
}
export const buildingById=(id?:string)=>BUILDINGS.find(s=>s.id===id)??BUILDINGS[0];
