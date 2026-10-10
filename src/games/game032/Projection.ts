/** Generated-art world coordinates remain authoritative when viewports crop the river. */
export function riverProjection(width:number,height:number,imageWidth:number,imageHeight:number,playerX:number){
 const aspect=width/height;let sh=imageHeight*.8,sw=sh*aspect;if(sw>imageWidth){sw=imageWidth;sh=sw/aspect;}
 const sx=Math.max(0,Math.min(imageWidth-sw,(playerX-.5)*imageWidth*.45+(imageWidth-sw)/2));
 const sy=Math.max(0,Math.min(imageHeight-sh,imageHeight*.86-sh*.88));
 const waterFar=Math.max(height*.16,(imageHeight*.45-sy)/sh*height);
 const waterNear=Math.min(height*.72,(imageHeight*.67-sy)/sh*height);
 return {sx,sy,sw,sh,waterFar,waterNear,castY:(power:number)=>waterNear+(waterFar-waterNear)*Math.max(0,Math.min(1,power))};
}
