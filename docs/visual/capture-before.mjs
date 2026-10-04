import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Baseline capture uses only normal UI input; diagnostics are read-only.
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const output = new URL('./before/', import.meta.url);
await mkdir(output, { recursive: true });
const selected = process.argv.includes('--game005') ? ['game005'] : ['game002', 'game003', 'game004', 'game005'];
const records = selected.length===1 ? JSON.parse(await readFile(new URL('CAPTURE_RECORD.json',output),'utf8')).filter(record=>record.game!=='game005') : [];
const inspect = page => page.evaluate(() => window.__arcadeDebug.inspection());
const wait = (page, fn, timeout = 45000) => page.waitForFunction(fn, null, { timeout, polling: 25 });
for (const game of selected) {
  for (const [device, viewport, touch] of [['desktop', {width:1440,height:900}, false], ['mobile', {width:390,height:844}, true]]) {
    const context = await browser.newContext({viewport, hasTouch:touch, isMobile:touch, deviceScaleFactor:1});
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:5173/${game}.html`);
    await page.locator('#play-button').waitFor(); await page.waitForTimeout(150);
    const shot = async (suffix = '') => {
      const filename = `${game}-${device}${suffix}.png`;
      await page.screenshot({path:new URL(filename, output).pathname});
      records.push({game, device, viewport, state:suffix === '-title' ? 'title' : suffix === '-over' ? 'gameover' : 'gameplay', path:`docs/visual/before/${filename}`, inspection:await inspect(page)});
    };
    await shot('-title');
    await page.locator('#play-button')[touch ? 'tap' : 'click']();
    if (game === 'game002') {
      await wait(page, () => window.__arcadeDebug.inspection().time >= 6.3);
      await shot();
      await wait(page, () => !window.__arcadeDebug.inspection().alive);
    } else if (game === 'game003') {
      // Three friendly center drops establish a visible tower without modifying physics.
      for (let n=0;n<3;n++) {
        await wait(page, () => {const s=window.__arcadeDebug.inspection();return s.phase==='hanging' && Math.abs(s.cargo.x-300)<7;});
        if(touch) await page.locator('#drop-button').tap(); else await page.keyboard.press('Space');
        await page.waitForFunction(n => window.__arcadeDebug.inspection().floors >= n, n+1, {timeout:45000,polling:25});
      }
      await wait(page, () => window.__arcadeDebug.inspection().phase==='hanging');
      await shot();
      // Release a later wide-swing crate beyond the stable support; let the model end naturally.
      await wait(page, () => {const s=window.__arcadeDebug.inspection();return s.phase==='hanging' && s.cargo.x>408;});
      if(touch) await page.locator('#drop-button').tap(); else await page.keyboard.press('Space');
      await wait(page, () => !window.__arcadeDebug.inspection().alive);
    } else if (game === 'game004') {
      await wait(page, () => window.__arcadeDebug.inspection().highlightedCell!==null && window.__arcadeDebug.inspection().phase==='watch');
      await shot();
      await wait(page, () => window.__arcadeDebug.inspection().phase==='recall');
      const state=await inspect(page); const wrong=(state.expectedCell+1)%9;
      await page.locator(`#cell-${wrong}`)[touch ? 'tap' : 'click']();
    } else {
      for(let n=0;n<8;n++) {
        await wait(page, () => window.__arcadeDebug.inspection().phase==='sorting');
        const state=await inspect(page);
        await page.locator(`#${state.expectedSide}-button`)[touch ? 'tap' : 'click']();
      }
      await wait(page, () => window.__arcadeDebug.inspection().phase==='sorting');
      // Wait for the existing entrance animation so the comparison shows the full object.
      await page.waitForTimeout(300);
      await shot();
      const state=await inspect(page);
      await page.locator(`#${state.expectedSide==='left'?'right':'left'}-button`)[touch ? 'tap' : 'click']();
    }
    await page.locator('#retry-button').waitFor(); await page.waitForTimeout(80);
    await shot('-over');
    if(errors.length) throw new Error(`${game}/${device}: ${errors.join(', ')}`);
    await context.close();
    await writeFile(new URL('CAPTURE_RECORD.json', output), JSON.stringify(records,null,2)+'\n');
    console.log(`${game} ${device} title/gameplay/gameover captured`);
  }
  console.log(`READY ${game} desktop and mobile screenshots`);
}
await browser.close();
