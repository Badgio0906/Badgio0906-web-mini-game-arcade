import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const output=path.dirname(new URL(import.meta.url).pathname), browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const records=[];
try {
  for(const mobile of [false,true]){
    const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile});
    try{
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:5181/games/tachibana-task-heaven/index.html');
      if(mobile)await page.locator('#play-button').tap();else await page.locator('#play-button').click();
      const frame=await (await page.locator('#legacy-game-frame').elementHandle()).contentFrame();
      await frame.waitForFunction(()=>window.TaskHeavenStatus?.state==='title',null,{timeout:90000});
      const box=await frame.locator('#canvas').boundingBox(),scale=Math.min(box.width/1280,box.height/720),x=box.x+(box.width-1280*scale)/2+230*scale,y=box.y+(box.height-720*scale)/2+489*scale;
      if(mobile)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
      await frame.waitForFunction(()=>window.TaskHeavenStatus?.state==='playing'&&window.TaskHeavenStatus?.stage===1,null,{timeout:30000});
      const status=await frame.evaluate(()=>window.TaskHeavenStatus);if(status.stage!==1||status.state!=='playing')throw Error('FirstnativeSTARTdidnotskippractice');
      await frame.locator('#canvas').screenshot({path:path.join(output,`game013-first-skip-${mobile?'mobile':'desktop'}.png`)});
      records.push({mobile,status,errors});if(errors.length)throw Error(JSON.stringify(errors));
    }finally{await context.close();}
  }
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  try{
    const page=await context.newPage();await page.goto('http://127.0.0.1:5181/game019.html');await page.locator('#play-button').click();await page.waitForTimeout(200);
    await page.screenshot({path:path.join(output,'game019-play-desktop.png')});
    await page.locator('#frog-canvas').screenshot({path:path.join(output,'game019-actual-source.png')});
    records.push({game019:await page.evaluate(()=>window.__game019),image:'game019-actual-source.png',actualNativeRun:true});
  }finally{await context.close();}
  await fs.writeFile(path.join(output,'native-capture.json'),JSON.stringify(records,null,2)+'\n');console.log('Game013 genuinefirstnativeSTARTstage1desktop/mobilePASS;019actualplayingcapture saved');
}finally{await browser.close();}
