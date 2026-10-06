import { chromium } from '@playwright/test';
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const page = await browser.newPage();
await page.goto('http://localhost:5173/prototype-stick.html');
console.log(await page.evaluate(async()=>{
 const {createState,step,CONFIG}=await import('/src/prototypes/stick-balance/model.ts');
 const results=[];
 for(const k of [.3,.5,.8,1,1.4]) {
  const s=createState();let direction=0;
  for(let i=0;i<120*65&&!s.over;i++) {
   if(i%12===0){const target=5*s.angle+3*s.omega;direction=Math.abs(target-s.v)<k?0:Math.sign(target-s.v);}
   step(s,direction);
  }
  results.push({k,time:s.time,angle:s.angle,x:s.x});
 }
 const passive=CONFIG.stages.map(({length})=>{let a=.036,w=.008,t=0;while(Math.abs(a)<CONFIG.fallAngle){w+=(1.5/length*CONFIG.gravity*Math.sin(a)-CONFIG.damping*w)*CONFIG.step;a+=w*CONFIG.step;t+=CONFIG.step;}return {length,passiveFallSeconds:t};});
 return {results,passive};
}));
await browser.close();
