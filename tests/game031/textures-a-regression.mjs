// Reuse the established normal-input Game031 test without altering its source.
import {readFile} from 'node:fs/promises';
const target=process.env.GAME031_TEXTURE_QA_URL??'http://127.0.0.1:4314';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(target))throw Error('local QA URL required');
const original=await readFile(new URL('./extended.mjs',import.meta.url),'utf8');
let source=original.replace("from '@playwright/test'",`from '${import.meta.resolve('@playwright/test')}'`)
 .replace("from'./browser-tools.mjs'",`from'${new URL('./browser-tools.mjs',import.meta.url).href}'`)
 .replace('http://127.0.0.1:4311',target)
 .replace("await page.waitForTimeout(800);const start=await read(page);", "await page.waitForFunction(()=>window.__DIG_PLACE_QA__.read().metrics.dirty===0,null,{timeout:60000});const start=await read(page);");
// Fixed-duration movement can remain on the protected return pad on a slow
// software GPU. Use ordinary held movement until the observed position is clear,
// then mine all support cells under the 0.6-wide body without teleporting it.
const from=source.indexOf("await page.keyboard.down('KeyD');await page.waitForTimeout(600)"),to=source.indexOf('const fell=await read(page);',from);
if(from<0||to<0)throw Error('established runner changed; review adaptation');
source=source.slice(0,from)+`await page.keyboard.down('KeyD');try{await page.waitForFunction(()=>{const s=window.__DIG_PLACE_QA__.read();return s.player.position.x>=s.spawn.x+3.1;},null,{timeout:12000});}finally{await page.keyboard.up('KeyD');}
let at=await read(page);const beforeFall=at.player.position.y;report.steps.push({step:'clear-return-pad-before-foot-mine',state:at});
for(let attempt=0;attempt<8;attempt++){at=await read(page);if(at.player.position.y<beforeFall-.5)break;const pos=at.player.position,support=await page.evaluate(({pos,y})=>{const q=window.__DIG_PLACE_QA__,cells=[],half=.6/2,epsilon=.000001;for(let x=Math.floor(pos.x-half+epsilon);x<=Math.floor(pos.x+half-epsilon);x++)for(let z=Math.floor(pos.z-half+epsilon);z<=Math.floor(pos.z+half-epsilon);z++){const id=q.voxel(x,y,z);if(id>0&&id<9)cells.push({x,y,z});}return cells;},{pos,y:Math.floor(beforeFall-.01)});report.steps.push({step:'foot-support-'+attempt,support,state:at});if(!support.length)break;const block=support[0];await aim(page,block.x+.5,block.y+.5,block.z+.5);const view=await read(page);if(!view.target||view.target.block===9)throw Error('foot target remains protected or unavailable');await mineOne(page);await page.waitForTimeout(350);}
await page.waitForTimeout(700);at={player:{position:{y:beforeFall}}};`+source.slice(to);
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
