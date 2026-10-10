/** Generated-art world coordinates remain authoritative when viewports crop the river. */
export function riverProjection(width:number,height:number,imageWidth:number,imageHeight:number,playerX:number){
 const aspect=width/height;let sh=imageHeight*.8,sw=sh*aspect;if(sw>imageWidth){sw=imageWidth;sh=sw/aspect;}
 const sx=Math.max(0,Math.min(imageWidth-sw,(playerX-.5)*imageWidth*.45+(imageWidth-sw)/2));
 // Keep both verified water edges in view even in shallow landscape crops.
 const sy=Math.max(0,Math.min(imageHeight-sh,imageHeight*.86-sh*.88,imageHeight*.45-sh*.16));
 const waterFar=Math.max(height*.16,(imageHeight*.45-sy)/sh*height);
 // The foreground vegetation starts above .67 at the left bank; .58 remains water.
 const waterNear=Math.min(height*.72,(imageHeight*.58-sy)/sh*height);
 return {sx,sy,sw,sh,waterFar,waterNear,castY:(power:number)=>waterFar+(waterNear-waterFar)*(1-Math.max(0,Math.min(1,power)))};
}

/** Selected water coordinates are shared by hit-testing, preview and landing. */
type WaterProjection = Pick<ReturnType<typeof riverProjection>, 'waterFar'|'waterNear'|'castY'>;
export function targetPoint(x:number,power:number,width:number,projection:WaterProjection){return {x:width*(.08+.84*Math.max(0,Math.min(1,x))),y:projection.castY(power)};}
export function aimFromPoint(x:number,y:number,width:number,projection:WaterProjection){
 // Browser pointer coordinates lose tiny fractions through viewport translation.
 // Accept only sub-pixel rounding at the edge, then clamp to the water interval.
 const epsilon=.001;
 if(!Number.isFinite(x)||!Number.isFinite(y)||width<=0||y<projection.waterFar-epsilon||y>projection.waterNear+epsilon||x<width*.08-epsilon||x>width*.92+epsilon)return null;
 return {x:Math.max(.06,Math.min(.94,(x/width-.08)/.84)),power:Math.max(0,Math.min(1,(projection.waterNear-y)/(projection.waterNear-projection.waterFar)))};
}
