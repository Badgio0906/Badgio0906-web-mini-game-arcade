import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

// Exact presentation replay of the retained earned4300 terminal. Model stays idle.
// This is geometry evidence only; actual ten/eleven parks are a separate portable proof.
const source = await readFile('src/games/game006/main.ts', 'utf8');
const proof = JSON.parse(await readFile('docs/ten-game/QA/GAME006_ACTUAL_FORBIDDEN_AWARD_PROOF.json', 'utf8'));
const template = source.match(/overlay\.innerHTML = `(<article class="ticket result-ticket">[\s\S]*?)`;/)[1];
const titleButton = source.match(/const titleButton = '(.*?)';/)[1];
const primary = (id, text) => `<button id="${id}" type="button" class="primary">${text}<span aria-hidden="true">→</span></button>`;
const result = { ...proof.terminal, reason: '枠の手前で止まりました。強さと角度を確認してください。' };
const html = new Function('result', 'best', 'newBest', 'credits', 'primary', 'titleButton', 'parkingTitle', `return \`${template}\`;`)(
  result, 4300, true, { credits: 2 }, primary, titleButton, () => '駐車場の住人');
assert.equal(result.score, 4300); assert.equal(result.parked, 11);
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const records = [];
try {
  await mkdir('docs/ten-game/screenshots/game006', { recursive: true });
  for (const [width, height] of [[1920,1080],[1440,900],[1280,720],[1024,768],[390,844],[320,568],[844,390],[568,320]]) {
    const context = await browser.newContext({ viewport: { width, height } }); const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    try {
      await page.goto('http://127.0.0.1:5176/game006.html'); await page.locator('#play-button').waitFor(); await page.evaluate(() => document.fonts.ready);
      const initial = await page.evaluate(() => ({ model: window.__arcadeDebug.snapshot(), events: window.__arcadeDebug.telemetry() }));
      await page.evaluate(html => {
        const app = document.querySelector('#app'); app.dataset.state = 'result'; app.dataset.scoreDigits = '4';
        // The idle HUD continues drawing0. Preserve only the fixture's earned presentation attribute,
        // without altering the model or intercepting its clock / callbacks.
        const observer = new MutationObserver(() => { if (app.dataset.scoreDigits !== '4') app.dataset.scoreDigits = '4'; });
        observer.observe(app, { attributes: true, attributeFilter: ['data-score-digits'] });
        document.querySelector('#overlay').innerHTML = html; document.querySelector('#overlay').hidden = false;
      }, html);
      const bounds = await page.evaluate(() => ['.result-ticket','.result-reason','.new-best','#result-score','.result-score>span','.result-score','.result-details','#result-best','.driver-title','#retry-button','#title-button','.result-ticket>small'].map(selector => {
        const element = document.querySelector(selector), box = element.getBoundingClientRect(), style = getComputedStyle(element);
        return { selector, x: box.x, y: box.y, width: box.width, height: box.height, text: element.textContent,
          visible: style.display !== 'none' && !['hidden','collapse'].includes(style.visibility) };
      }));
      for (const box of bounds) {
        assert.ok(box.visible && box.width > 0 && box.height > 0, box.selector);
        assert.ok(box.x >= -1 && box.y >= -1 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1, JSON.stringify(box));
        if (box.selector.endsWith('-button')) assert.ok(box.width >= 44 && box.height >= 44);
      }
      assert.equal(bounds.find(box => box.selector === '#result-score').text, '4300'); assert.equal(bounds.find(box => box.selector === '#result-best').text, '4300');
      const scoreTypography = await page.evaluate(() => {
        const element = document.querySelector('#result-score'), range = document.createRange(); range.selectNodeContents(element);
        const box = element.getBoundingClientRect(); const fragments = [...range.getClientRects()].map(rect => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height }));
        return { digits: document.querySelector('#app').dataset.scoreDigits, fontSize: getComputedStyle(element).fontSize,
          box: { x: box.x, y: box.y, width: box.width, height: box.height }, fragments };
      });
      assert.equal(scoreTypography.digits, '4');
      assert.equal(new Set(scoreTypography.fragments.map(fragment => Math.round(fragment.y))).size, 1, 'Primary4300 score must read on one line');
      assert.ok(scoreTypography.fragments.every(fragment => fragment.x + fragment.width <= scoreTypography.box.x + scoreTypography.box.width + 1), 'Digits fit the allocated score column');
      const scoreColumn = bounds.find(box => box.selector === '.result-score'); const caption = bounds.find(box => box.selector === '.result-score>span'); const metrics = bounds.find(box => box.selector === '.result-details');
      assert.ok(caption.x >= scoreColumn.x - 1 && caption.y >= scoreColumn.y - 1 && caption.x + caption.width <= scoreColumn.x + scoreColumn.width + 1 && caption.y + caption.height <= scoreColumn.y + scoreColumn.height + 1, 'SCORE caption remains inside its column');
      assert.ok(scoreColumn.x + scoreColumn.width <= metrics.x + 1 || metrics.x + metrics.width <= scoreColumn.x + 1 || scoreColumn.y + scoreColumn.height <= metrics.y + 1 || metrics.y + metrics.height <= scoreColumn.y + 1, 'Score and result metrics must not overlap');
      assert.ok(bounds.find(box => box.selector === '.driver-title').text.includes('禁断駐車'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(await page.evaluate(() => ({ model: window.__arcadeDebug.snapshot(), events: window.__arcadeDebug.telemetry() })), initial);
      assert.deepEqual(errors, []);
      if (height <= 390) await page.screenshot({ path: `docs/ten-game/screenshots/game006/qa-render-only-earned4300-${width}x${height}-result.png` });
      records.push({ kind: 'Render-only exact earned4300 / forbidden / NEW BEST / CREDIT2 fixture; model idle unchanged; no new score or credit proof', width, height, result, bounds, scoreTypography, errors });
    } finally { await context.close(); }
  }
  await writeFile('docs/ten-game/QA/GAME006_REPAIRED_HIGH_RESULT_LAYOUTS.json', `${JSON.stringify(records, null, 2)}\n`);
  console.log(`PASS ${records.length} exact earned-result geometry fixtures; model and events unchanged`);
} finally { await browser.close(); }
