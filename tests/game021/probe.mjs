/** Compiled native-input collector. It never mutates game state or reads DEV diagnostics. */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const base = process.env.GAME021_BASE_URL ?? 'http://127.0.0.1:4173/';
const output = resolve(process.env.GAME021_REPORT_DIR ?? `docs/game021/QA/browser-${Date.now()}`);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const results = [];
try {
  for (const viewport of [{width:1365,height:900},{width:390,height:844},{width:320,height:740},{width:844,height:390}]) {
    const touch = viewport.width < 900;
    const context = await browser.newContext({viewport,hasTouch:touch,isMobile:touch});
    await context.addInitScript(() => localStorage.setItem('game100garage:analytics-consent:v1','denied'));
    await context.route(/analytics\.game100garage\.com|google-analytics\.com|googletagmanager\.com/, route => route.fulfill({status:200,body:''}));
    await context.route(/pagead2\.googlesyndication\.com/, route => route.fulfill({status:200,body:''}));
    const page = await context.newPage(), errors=[];
    const use = async selector => { const locator=page.locator(selector); if(touch) await locator.tap(); else await locator.click(); };
    page.on('pageerror', error=>errors.push(error.message));
    await page.goto(new URL('game021.html',base).href);
    const consent = page.getByRole('button',{name:'拒否',exact:true}); if (await consent.isVisible()) await consent.click();
    await use('#practice-button');
    await page.waitForTimeout(250); await use('[data-column="3"]');
    await page.locator('#training-title').waitFor();
    await page.screenshot({path:resolve(output,`${viewport.width}-practice.png`)});
    await use('#training-title');
    await page.locator('#mode-select').selectOption('two');
    await use('#start-button');
    await page.waitForTimeout(250);
    await page.screenshot({path:resolve(output,`${viewport.width}-playing.png`)});
    // Both players' moves use real column button activations, not fixture state injection.
    for (const column of [0,6,1,6,2,5,3]) { await use(`[data-column="${column}"]`); await page.waitForTimeout(250); }
    await page.locator('#retry-button').waitFor();
    await page.screenshot({path:resolve(output,`${viewport.width}-result.png`)});
    await use('#retry-button'); await page.waitForTimeout(250);
    await page.locator('[data-column="3"]').focus();
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
    await use('#pause-button');
    await page.screenshot({path:resolve(output,`${viewport.width}-pause.png`)});
    await page.reload(); await page.locator('#continue-button').waitFor();
    const pausedUntilResume = await page.locator('#app').getAttribute('data-state');
    await use('#continue-button');
    await page.waitForTimeout(250); await use('#mute-button');
    const audioLabel=await page.locator('#mute-button').textContent();
    await page.reload(); await page.locator('#continue-button').waitFor();
    const audioPersisted=await page.locator('#mute-button').textContent()===audioLabel;
    const noDebugHook=await page.evaluate(()=> !('__game021' in window));
    const horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    await use('#continue-button'); await use('#portal-link');
    await page.waitForURL(/index\.html/);
    results.push({viewport,errors,pausedUntilResume,audioPersisted,noDebugHook,horizontalOverflow,portalReturned:true});
    await context.close();
  }
} finally { await browser.close(); await writeFile(resolve(output,'report.json'),JSON.stringify({provenance:'compiled-native-input-automated-QA; not author/physical-device play',base,results},null,2)+'\n'); }
if (results.some(result=>result.errors.length || result.pausedUntilResume!=='title' || !result.audioPersisted || !result.noDebugHook || result.horizontalOverflow)) process.exitCode=1;
