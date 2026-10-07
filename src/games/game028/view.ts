import{TABLE,type Side}from'./model';
export const HEIGHT_SCALE=125;
export function project(x:number,y:number,z=0):{x:number;y:number}{return{x:390+x*(520+y*65),y:370+y*282-z*HEIGHT_SCALE};}
export function racketView(x:number,side:Side):{x:number;y:number;radiusX:number;radiusY:number}{const y=side===0?TABLE.racketY:-TABLE.racketY;const p=project(x,y,.08);return{...p,radiusX:TABLE.racketRadius*(520+y*65),radiusY:29};}
export const netView={top:project(0,0,TABLE.netHeight).y,bottom:project(0,0).y};
