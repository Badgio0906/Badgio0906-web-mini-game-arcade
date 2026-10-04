import { expect, type Page } from '@playwright/test';
export const tenSizes = [[1920,1080],[1440,900],[1280,720],[1024,768],[390,844],[320,568],[844,390],[568,320]] as const;
export function runtimeErrors(page: Page) { const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});return errors; }
export async function insideViewport(page: Page, selectors: string[], actions:string[]=[]){
  const v=page.viewportSize()!;const records=[];
  for(const selector of selectors){const el=page.locator(selector);await expect(el).toBeVisible();const b=(await el.boundingBox())!;
    expect(b.x,selector).toBeGreaterThanOrEqual(-1);expect(b.y,selector).toBeGreaterThanOrEqual(-1);expect(b.x+b.width,selector).toBeLessThanOrEqual(v.width+1);expect(b.y+b.height,selector).toBeLessThanOrEqual(v.height+1);
    if(actions.includes(selector)){expect(b.width,selector).toBeGreaterThanOrEqual(43.5);expect(b.height,selector).toBeGreaterThanOrEqual(43.5);}records.push({selector,...b});}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);return records;
}
/** Stub resolves after900ms: collect all pending DOM bounds in one readonly turn, before asserting in Node. */
export async function immediatePendingBounds(page:Page,selectors:string[]){
  const captured=await page.evaluate(selectors=>({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,entries:selectors.map(selector=>{const el=document.querySelector<HTMLElement>(selector);if(!el)return{selector,missing:true};const r=el.getBoundingClientRect(),style=getComputedStyle(el);return{selector,missing:false,visible:style.display!=='none'&&style.visibility!=='hidden'&&style.visibility!=='collapse',x:r.x,y:r.y,width:r.width,height:r.height,disabled:el instanceof HTMLButtonElement?el.disabled:undefined};})}),selectors);
  expect(captured.overflow).toBe(false);
  for(const r of captured.entries){expect(r.missing,r.selector).toBe(false);expect(r.visible,r.selector).toBe(true);expect(r.width!,r.selector).toBeGreaterThan(0);expect(r.height!,r.selector).toBeGreaterThan(0);expect(r.x!,r.selector).toBeGreaterThanOrEqual(-1);expect(r.y!,r.selector).toBeGreaterThanOrEqual(-1);expect(r.x!+r.width!,r.selector).toBeLessThanOrEqual(captured.width+1);expect(r.y!+r.height!,r.selector).toBeLessThanOrEqual(captured.height+1);if(r.selector.endsWith('button')){expect(r.disabled,r.selector).toBe(true);expect(r.width!,r.selector).toBeGreaterThanOrEqual(43.5);expect(r.height!,r.selector).toBeGreaterThanOrEqual(43.5);}}
  return captured;
}
