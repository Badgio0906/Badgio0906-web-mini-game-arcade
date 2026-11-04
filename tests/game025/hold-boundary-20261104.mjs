import {chromium} from '@playwright/test';
const base=process.env.MOBILE_REVIEW_BASE??'http://localhost:4182';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844}});
await page.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
await page.clock.install();await page.goto(`${base}/game025.html`);await page.locator('#play').click();
const cell=page.locator('[data-cell="0"]');
const unchanged=async label=>{const s=await page.evaluate(()=>({flags:window.__game025.flags.some(Boolean),opened:window.__game025.opened.some(Boolean)}));if(s.flags||s.opened)throw Error(`${label}: ${JSON.stringify(s)}`);};
// Physical mouse exits in one movement, then releases beyond the grid.
await cell.hover();await page.mouse.down();await page.mouse.move(3,180,{steps:1});await page.mouse.up();await page.clock.fastForward(700);await unchanged('outside release');
// Exercise window cleanup when a release reaches window without a grid leave/up.
await cell.hover();await page.mouse.down();
await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointerup',{pointerId:1})));await page.clock.fastForward(700);await unchanged('window release');await page.mouse.up();
// Pointer cancellation must also clear its pending timeout.
await cell.hover();await page.mouse.down();await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1})));await page.clock.fastForward(700);await unchanged('window cancellation');await page.mouse.up();
// An ordinary long hold still flags once; its release never opens the cell.
await cell.hover();await page.mouse.down();await page.clock.fastForward(550);await page.mouse.up();
const held=await page.evaluate(()=>({flag:window.__game025.flags[0],opened:window.__game025.opened[0]}));if(!held.flag||held.opened)throw Error(`held: ${JSON.stringify(held)}`);
console.log(JSON.stringify({outsideRelease:'cancelled',windowRelease:'cancelled',windowCancel:'cancelled',held}));await browser.close();
