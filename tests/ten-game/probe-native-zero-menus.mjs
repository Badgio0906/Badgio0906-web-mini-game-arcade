import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// Storage-driven zero fixtures; native Stub requests are real. These are not earned deaths.
const games = process.argv.slice(2).length ? process.argv.slice(2) : ['game007','game008','game009','game010'];
const sizes = [[1920,1080],[1440,900],[1280,720],[1024,768],[390,844],[320,568],[844,390],[568,320]];
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  for (const gameId of games) {
    assert.match(gameId, /^game00[7-9]$|^game010$/); const port = 5170 + Number(gameId.slice(4)); const records = [];
    const diagnosticSize=process.env.TEN_MENU_VIEWPORT?.split('x').map(Number);
    const activeSizes=diagnosticSize?[diagnosticSize]:sizes;
    for (const [width,height] of activeSizes) {
      const context = await browser.newContext({ viewport: { width,height } }); const page = await context.newPage(); const errors = [];
      await context.addInitScript(key => { if (localStorage.getItem(key) === null) localStorage.setItem(key, '0'); }, `web-mini-arcade:v1:${gameId}:credits`);
      page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      const capture = async selectors => page.evaluate(selectors => ({ overflow: document.documentElement.scrollWidth > innerWidth,
        entries: selectors.map(selector => { const element = document.querySelector(selector); if (!element) return { selector, missing: true };
          const box = element.getBoundingClientRect(), style = getComputedStyle(element);
          return { selector, x:box.x, y:box.y, width:box.width, height:box.height, text:element.textContent,
            visible:style.display !== 'none' && !['hidden','collapse'].includes(style.visibility),
            disabled:element instanceof HTMLButtonElement ? element.disabled : undefined }; }) }), selectors);
      const validate = (record, pending) => {
        assert.equal(record.overflow, false);
        for (const box of record.entries) {
          assert.ok(!box.missing && box.visible && box.width > 0 && box.height > 0, JSON.stringify(box));
          assert.ok(box.x >= -1 && box.y >= -1 && box.x+box.width <= width+1 && box.y+box.height <= height+1, JSON.stringify(box));
          if (box.selector.endsWith('-button')) {
            assert.ok(box.width >= 43.5 && box.height >= 43.5, JSON.stringify(box));
            if (pending) assert.equal(box.disabled, true, `${box.selector}: pending navigation / requests locked`);
          }
        }
      };
      let title,pending,initial;
      try {
        await page.goto(`http://127.0.0.1:${port}/${gameId}.html`); await page.locator('#reward-button').waitFor(); await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('#credit-count').textContent(), '0');
        initial = await page.evaluate(() => window.__arcadeDebug.snapshot());
        assert.equal(initial.alive, false); assert.equal(initial.time, 0); assert.equal(initial.score, 0);
        title = await capture(['.start-note','.start-note h2','#reward-button','.stub-note']); validate(title, false);
        if(width<=390||height<=390){await mkdir(`docs/ten-game/screenshots/${gameId}`,{recursive:true});await page.screenshot({path:`docs/ten-game/screenshots/${gameId}/qa-storage-zero-${width}x${height}-title.png`});}
        await page.locator('#reward-button').click();
        // One read-only turn captures everything before the900ms Stub completes.
        pending = await capture(['.reward-note','.stub-note','#reward-button','#title-button','#brand-button']); validate(pending, true);
        if(width<=390||height<=350)await page.screenshot({path:`docs/ten-game/screenshots/${gameId}/qa-storage-zero-${width}x${height}-pending.png`});
        assert.deepEqual(await page.evaluate(() => window.__arcadeDebug.snapshot()), initial);
        await page.waitForFunction(() => document.querySelector('#credit-count')?.textContent === '3');
        await page.locator('#play-button').waitFor();
        const after = await page.evaluate(() => ({ model:window.__arcadeDebug.snapshot(), events:window.__arcadeDebug.telemetry(), state:window.__arcadeDebug.state() }));
        assert.equal(after.state, 'title'); assert.equal(after.model.alive, false); assert.equal(after.model.time, 0); assert.equal(after.model.score, 0);
        for (const name of ['reward_offer_shown','reward_requested','reward_granted']) assert.equal(after.events.filter(event => event.name === name).length, 1, name);
        assert.equal(after.events.some(event => ['run_start','run_end','score','credit_used'].includes(event.name)), false);
        assert.ok(after.events.every(event => event.data.game_id === gameId)); assert.deepEqual(errors, []);
        records.push({ passed:true, kind:'Persisted-zero storage fixture / actual guarded900ms Stub; no earned depletion or forced end', gameId,width,height,title,pending,initial,after,errors });
      } catch(error) {
        const failure={kind:'Persisted-zero menu fixture failure, not earned depletion',gameId,width,height,title,pending,initial,errors,message:String(error),passedPreviousLayouts:records};
        await mkdir('docs/ten-game/QA',{recursive:true});await mkdir(`docs/ten-game/screenshots/${gameId}`,{recursive:true});
        await writeFile(`docs/ten-game/QA/${gameId.toUpperCase()}_ZERO_MENU_FAILURE.json`,`${JSON.stringify(failure,null,2)}\n`);
        await page.screenshot({path:`docs/ten-game/screenshots/${gameId}/qa-storage-zero-${width}x${height}-menu-failure.png`});
        records.push({passed:false,kind:failure.kind,gameId,width,height,title,pending,initial,errors,message:String(error)});console.error(`${gameId} ${width}x${height}: ${String(error)}`);
      } finally { await context.close(); }
    }
    await mkdir('docs/ten-game/QA', { recursive:true });
    await writeFile(`docs/ten-game/QA/${gameId.toUpperCase()}_${diagnosticSize?'ZERO_MENU_DIAGNOSTIC':'ZERO_MENU_LAYOUTS'}.json`, `${JSON.stringify(records,null,2)}\n`);
    assert.ok(records.every(record=>record.passed),`${gameId}: ${records.filter(record=>!record.passed).length} zero-menu fixture failures`);
    console.log(`${gameId}: PASS ${records.length} persisted-zero title / atomic pending layouts; no run side effects`);
  }
} finally { await browser.close(); }
