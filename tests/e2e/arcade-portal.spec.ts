import { expect, test } from '@playwright/test';
import { gameCatalog } from '../../src/data/gameCatalog';
import { errorsOn, nativeButton } from './helpers/eleven-arcade';

test('portal exposes eleven real illustrated cards, PC/mobile columns and complete titles without fabricated rankings',async({page,isMobile},info)=>{
  test.skip(info.project.name==='mobile-landscape');const errors=errorsOn(page);await page.goto('./');
  await expect(page.locator('#game-count')).toHaveText('11');await expect(page.locator('.game-card')).toHaveCount(11);
  const cards=[];
  for(const game of gameCatalog){
    const card=page.locator(`.game-card[data-game-id="${game.id}"]`);await card.scrollIntoViewIfNeeded();
    await expect(card.locator('h2')).toHaveText(game.titleJa);await expect(card.locator('.game-english')).toHaveText(game.titleEn);
    await expect(card.locator('p')).toHaveText(game.tagline);await expect(card.locator('.game-play')).toContainText('PLAY');
    await expect(card).toHaveAttribute('href',game.route);await expect(card.locator('img')).toHaveAttribute('alt',`${game.titleJa}のゲーム画面`);
    await expect.poll(()=>card.locator('img').evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
    cards.push(await card.evaluate(e=>{const r=e.getBoundingClientRect();return{id:(e as HTMLElement).dataset.gameId,x:r.x,width:r.width,height:r.height,top:r.top+scrollY};}));
  }
  expect(new Set(cards.map(c=>c.id)).size).toBe(11);
  const firstTop=cards[0].top;const columns=cards.filter(c=>Math.abs(c.top-firstTop)<2).length;
  expect(columns).toBeGreaterThanOrEqual(isMobile?1:3);expect(columns).toBeLessThanOrEqual(isMobile?2:4);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width+1);
  for(const card of cards){expect(card.width).toBeGreaterThan(44);expect(card.height).toBeGreaterThan(44);expect(card.x).toBeGreaterThanOrEqual(-1);expect(card.x+card.width).toBeLessThanOrEqual(page.viewportSize()!.width+1);}
  await expect(page.locator('.game-card[data-game-id="game001"] h2')).toHaveText('軌道をズラせ！');
  await expect(page.locator('body')).not.toContainText(/週間ランキング|プレイ回数\s*\d|\d+\s*人がプレイ/);
  expect(errors).toEqual([]);await info.attach('actual-catalog-cards',{body:JSON.stringify({cards,columns,errors}),contentType:'application/json'});
});

test('each whole card launches its direct route; refresh and native return link keep the portal and base prefix intact',async({page,isMobile},info)=>{
  test.skip(info.project.name==='mobile-landscape');test.setTimeout(120_000);const errors=errorsOn(page),routes=[];
  await page.goto('./');const portal=new URL(page.url());
  for(const game of gameCatalog){
    const card=page.locator(`.game-card[data-game-id="${game.id}"]`);
    // Click the thumbnail region rather than only the PLAY text: the complete card is a launch target.
    await nativeButton(page,`.game-card[data-game-id="${game.id}"] .game-image`,isMobile);
    await expect(page).toHaveURL(new RegExp(`/${game.id}\\.html$`));await expect(page.locator('#play-button')).toBeVisible();
    expect(new URL(page.url()).pathname.startsWith(portal.pathname.replace(/index\.html$/,''))).toBe(true);
    await page.reload();await expect(page.locator('#play-button')).toBeVisible();
    const back=page.locator('.arcade-portal-back');await expect(back).toBeVisible();
    const box=await back.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(43.5);expect(box!.height).toBeGreaterThanOrEqual(43.5);
    const href=await back.getAttribute('href'),base=portal.pathname.replace(/index\.html$/,'');
    expect([base,`${base}index.html`]).toContain(new URL(href!,page.url()).pathname);
    await nativeButton(page,'.arcade-portal-back',isMobile);await expect(page.locator('.game-card')).toHaveCount(11);
    routes.push({id:game.id,back:href});await card.waitFor({state:'visible'});
  }
  expect(errors).toEqual([]);await info.attach('actual-direct-route-refresh-return',{body:JSON.stringify({base:portal.href,routes,errors}),contentType:'application/json'});
});
