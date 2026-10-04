import { expect, type Page } from '@playwright/test';

export const arcadeGames = Array.from({ length: 11 }, (_, i) => `game${String(i + 1).padStart(3, '0')}`);
export const arcadeSizes = [[1920,1080],[1440,900],[1280,720],[1024,768],[390,844],[320,568],[844,390],[568,320]] as const;
export const storagePrefix = (id: string) => id === 'game001' ? 'orbit-shift:v1:' : `web-mini-arcade:v1:${id}:`;
export type DebugRecord = Record<string, any>;

/** DEV diagnostics are read only. All progression below uses native user inputs. */
export async function runtime(page: Page): Promise<{ snapshot: DebugRecord; inspection: DebugRecord; state: string; events: Array<{name:string;data:DebugRecord}> }> {
  return page.evaluate(() => {
    const w = window as unknown as { __arcadeDebug?: any; __orbitDebug?: any };
    const d = w.__arcadeDebug ?? w.__orbitDebug;
    return { snapshot: d.snapshot(), inspection: d.inspection?.() ?? d.snapshot(), state: d.state(), events: d.telemetry() };
  });
}
export const training = (page: Page): Promise<DebugRecord> => page.evaluate(() => (window as any).__tutorialDebug.snapshot());
export async function seedStoredZero(page: Page, id: string, completed = false): Promise<void> {
  const prefix = storagePrefix(id);
  await page.addInitScript(({prefix,completed}) => {
    if (localStorage.getItem(`${prefix}credits`) === null) localStorage.setItem(`${prefix}credits`, '0');
    if (completed && localStorage.getItem(`${prefix}tutorialCompleted`) === null) localStorage.setItem(`${prefix}tutorialCompleted`, 'true');
  }, {prefix,completed});
}
export async function wallet(page: Page, id: string): Promise<Record<string,string|null>> {
  return page.evaluate(prefix => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith(prefix)).map(k => [k,localStorage.getItem(k)])), storagePrefix(id));
}
export function errorsOn(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  return errors;
}
export async function nativeButton(page: Page, selector: string, touch = false): Promise<void> {
  if (touch) await page.locator(selector).tap(); else await page.locator(selector).click();
}
export async function practiceInput(page: Page, action: string, touch: boolean): Promise<void> {
  // Five deliberately wrong desk objects share the action; pick one concrete wrong stamp.
  const selector=action==='stamp-other'?'[data-practice-action="stamp-other"][aria-label="青い角印鑑"]':`[data-practice-action="${action}"]`;
  await nativeButton(page, selector, touch);
}
export async function finishPractice(page: Page, id: string, touch = false): Promise<void> {
  await expect(page.locator('#arcade-training')).toHaveAttribute('data-phase','practice');
  const s = () => training(page);
  switch (id) {
    case 'game001': await practiceInput(page,'action',touch); break;
    case 'game002':
      await practiceInput(page,'right',touch);
      await expect.poll(async()=>(await s()).practice.step).toBe(1);
      await practiceInput(page,'left',touch); break;
    case 'game003':
      await expect.poll(async()=>{const x=(await s()).practice.x;return x>=180&&x<=420;},{intervals:[25]}).toBe(true);
      await practiceInput(page,'action',touch); break;
    case 'game004':
      await expect.poll(async()=>(await s()).practice.phase).toBe('recall');
      await practiceInput(page,'cell-0',touch);await practiceInput(page,'cell-4',touch);break;
    case 'game005': await practiceInput(page,'left',touch);await practiceInput(page,'right',touch);break;
    case 'game006': await practiceInput(page,'action',touch);await practiceInput(page,'action',touch);break;
    case 'game007':
      if (touch) await practiceInput(page,'board',true); else await page.keyboard.press('ArrowRight');
      await expect(page.locator('#practice-prompt')).toContainText('260');
      await expect.poll(async()=>(await s()).practice.phase).toBe('practice');
      if (touch) await practiceInput(page,'reject',true); else await page.keyboard.press('ArrowLeft'); break;
    case 'game008':
      if (touch) {
        const right=page.locator('[data-practice-action="right"]');
        const bounds=await right.boundingBox();
        expect(bounds,'native held-touch target').not.toBeNull();
        // Observe the real primary touch event; this listener never advances practice or its clock.
        await right.evaluate(element=>{
          const observe=(event:PointerEvent)=>{(element as any).__qaHeldTouch={type:event.pointerType,primary:event.isPrimary};};
          element.addEventListener('pointerdown',observe as EventListener,{once:true});
        });
        const cdp=await page.context().newCDPSession(page);
        try {
          await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bounds!.x+bounds!.width/2,y:bounds!.y+bounds!.height/2,id:1}]});
          expect(await right.evaluate(element=>(element as any).__qaHeldTouch)).toEqual({type:'touch',primary:true});
          await expect(page.locator('#arcade-training')).toHaveAttribute('data-phase','success');
        } finally {
          await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
          await cdp.detach();
        }
      } else {
        await page.keyboard.down('ArrowRight');
        try { await expect(page.locator('#arcade-training')).toHaveAttribute('data-phase','success'); }
        finally { await page.keyboard.up('ArrowRight'); }
      }
      break;
    case 'game009': await practiceInput(page,'stamp-red',touch);break;
    case 'game010':
      await practiceInput(page,'action',touch);await expect.poll(async()=>(await s()).practice.practicePoints).toBeGreaterThan(18);
      await practiceInput(page,'action',touch);break;
    case 'game011': await practiceInput(page,'unko',touch);break;
    default: throw Error(`No native training policy for ${id}`);
  }
  await expect(page.locator('#arcade-training')).toHaveAttribute('data-phase','success');
}
/** One readonly DOM sample preserves visibility, containment, labels and 44px targets together. */
export async function geometry(page: Page, selectors: string[], actions: string[] = []): Promise<DebugRecord> {
  await page.evaluate(() => document.fonts.ready);
  // ResizeObserver may repack the native desk on the next frame; measure the settled responsive UI.
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  const result = await page.evaluate(selectors => ({width:innerWidth,height:innerHeight,docWidth:document.documentElement.scrollWidth,docHeight:document.documentElement.scrollHeight,modalOpen:!!document.querySelector('dialog[open]'),
    entries:selectors.map(selector=>{const e=document.querySelector<HTMLElement>(selector);if(!e)return{selector,missing:true};const r=e.getBoundingClientRect(),s=getComputedStyle(e),clips=[];
      for(let parent=e.parentElement;parent;parent=parent.parentElement){
        const style=getComputedStyle(parent),x=['hidden','clip','auto','scroll'].includes(style.overflowX),y=['hidden','clip','auto','scroll'].includes(style.overflowY);
        if(!x&&!y)continue;
        const box=parent.getBoundingClientRect(),sx=parent.offsetWidth?box.width/parent.offsetWidth:1,sy=parent.offsetHeight?box.height/parent.offsetHeight:1;
        const left=box.left+parent.clientLeft*sx,top=box.top+parent.clientTop*sy;
        clips.push({ancestor:parent.id?`#${parent.id}`:`${parent.tagName.toLowerCase()}.${parent.className}`,x,y,left,top,right:left+parent.clientWidth*sx,bottom:top+parent.clientHeight*sy});
      }
      return{selector,missing:false,visible:s.display!=='none'&&s.visibility!=='hidden'&&s.visibility!=='collapse',text:e.textContent,x:r.x,y:r.y,width:r.width,height:r.height,clips};})}),selectors);
  expect(result.docWidth,'document width').toBeLessThanOrEqual(result.width+1);
  // A native modal makes the title underlay inert. Its own controls must fit; active-page height is checked separately.
  if(!result.modalOpen)expect(result.docHeight,'active document height').toBeLessThanOrEqual(result.height+1);
  for(const r of result.entries){
    expect(r.missing,r.selector).toBe(false);expect(r.visible,r.selector).toBe(true);
    expect(r.width!,r.selector).toBeGreaterThan(0);expect(r.height!,r.selector).toBeGreaterThan(0);
    expect(r.x!,r.selector).toBeGreaterThanOrEqual(-1);expect(r.y!,r.selector).toBeGreaterThanOrEqual(-1);
    expect(r.x!+r.width!,r.selector).toBeLessThanOrEqual(result.width+1);expect(r.y!+r.height!,r.selector).toBeLessThanOrEqual(result.height+1);
    if(actions.includes(r.selector)){
      expect(r.width!,r.selector).toBeGreaterThanOrEqual(43.5);expect(r.height!,r.selector).toBeGreaterThanOrEqual(43.5);
      for(const clip of r.clips??[]){
        const label=`${r.selector} clipped by ${clip.ancestor}`;
        if(clip.x){expect(r.x!,label).toBeGreaterThanOrEqual(clip.left-1);expect(r.x!+r.width!,label).toBeLessThanOrEqual(clip.right+1);}
        if(clip.y){expect(r.y!,label).toBeGreaterThanOrEqual(clip.top-1);expect(r.y!+r.height!,label).toBeLessThanOrEqual(clip.bottom+1);}
      }
    }
  }
  return result;
}
export const forbiddenWalletEvents = ['credit_used','credit_zero','reward_offer_shown','reward_requested','reward_granted'];
export function assertNoWalletEvents(events: Array<{name:string}>): void { expect(events.filter(e=>forbiddenWalletEvents.includes(e.name))).toEqual([]); }
