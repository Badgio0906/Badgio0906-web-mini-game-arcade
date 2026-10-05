import assert from 'node:assert/strict';
export const read = page => page.evaluate(() => ({ state: window.__arcadeDebug.state(), snapshot: window.__arcadeDebug.snapshot(), projection: window.__arcadeDebug.projection(), events: window.__arcadeDebug.telemetry() }));
export async function until(page, predicate, label, timeout = 32000) {
  const end = Date.now() + timeout; let last;
  while (Date.now() < end) { last = await read(page); if (predicate(last)) return last; await page.waitForTimeout(18); }
  throw Error(label + ': ' + JSON.stringify(last));
}
export async function input(page, touch, selector = '#control-button') { if(process.env.GAME018_TRACE) console.log('input',selector,await page.locator('#app').getAttribute('data-state'));  if (touch) await page.locator(selector).tap(); else await page.locator(selector).click(); if(process.env.GAME018_TRACE) console.log('completed',selector,page.url()); }
export async function settlePaint(page) { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
export async function geometry(page) {
  await settlePaint(page);
  const g = await page.evaluate(() => {
    const targets = [...document.querySelectorAll('button,a')].filter(e => e.getClientRects().length && !e.closest('[hidden]') && getComputedStyle(e).visibility !== 'hidden').map(e => {
      const b = e.getBoundingClientRect(), clips = []; let p = e.parentElement;
      while (p) { const s = getComputedStyle(p); if (/(hidden|clip|auto|scroll)/.test(s.overflowX + s.overflowY)) { const r = p.getBoundingClientRect(); clips.push({ x:r.x,y:r.y,w:r.width,h:r.height }); } p=p.parentElement; }
      return { id: e.id || e.dataset.shoe || e.textContent, x:b.x,y:b.y,w:b.width,h:b.height,clips };
    });
    return { w:innerWidth,h:innerHeight,dw:document.documentElement.scrollWidth,dh:document.documentElement.scrollHeight,targets };
  });
  assert.ok(g.dw <= g.w + 1, 'horizontal overflow'); assert.ok(g.dh <= g.h + 1, 'vertical overflow');
  for (const e of g.targets) { assert.ok(e.w >= 43.5 && e.h >= 43.5, '44px ' + e.id); assert.ok(e.x>=-1 && e.y>=-1 && e.x+e.w<=g.w+1 && e.y+e.h<=g.h+1, 'viewport ' + e.id); for(const c of e.clips) assert.ok(e.x>=c.x-2 && e.y>=c.y-2 && e.x+e.w<=c.x+c.w+2 && e.y+e.h<=c.y+c.h+2,'ancestor clip '+e.id); }
  return g;
}
export async function stopAt(page,touch,phase,low,high) {
  await until(page,r=>r.snapshot.phase===phase,phase);
  await page.waitForFunction(({phase,low,high}) => { const s=window.__arcadeDebug.snapshot(); const n=phase==='spin'?Math.abs(s.spin):s[phase]; return s.phase===phase && n>=low && n<=high; },{phase,low,high},{polling:'raf',timeout:7000});
  await input(page,touch); return read(page);
}
export async function sequence(page,touch,{angle=[40,50],spin=[.70,.90],power=[99.5,100]}={}) {
  await stopAt(page,touch,'angle',...angle); await stopAt(page,touch,'spin',...spin); const locked=await stopAt(page,touch,'power',...power);
  if(power[0]>=99.5) assert.ok(locked.snapshot.justMax,'native JUST MAX reached');
  return locked;
}
export async function tutorial(page,touch,capture=async()=>{},check=async()=>{}) {
  await input(page,touch,'#play-button');await capture('explanation');await check('explanation');await input(page,touch,'#tutorial-practice-button');
  for (let stage=0;stage<3;stage++) { const phase=['angle','spin','power'][stage]; await until(page,r=>r.snapshot.phase===phase,'practice '+phase);await capture('practice-'+phase);await input(page,touch);await until(page,r=>r.state==='practice-step-complete','stepcomplete');await check('practice-'+stage+'-complete'); if(stage===0){ await input(page,touch,'#practice-repeat-button');await input(page,touch);await until(page,r=>r.state==='practice-step-complete','repeat'); } await input(page,touch,'#practice-next-button'); }
  await sequence(page,touch,{power:[75,90]});await until(page,r=>r.state==='practice-complete','combinedpractice');await capture('practice-complete');await check('practice-complete');
  const result=await read(page);assert.equal(result.snapshot.result.practice,true);assert.equal(result.snapshot.result.score.total,0);assert.ok(!result.events.some(e=>['run_start','run_end','score','credit_used'].includes(e.name)),'practice isolation');
  await input(page,touch,'#tutorial-start-button');return result;
}
