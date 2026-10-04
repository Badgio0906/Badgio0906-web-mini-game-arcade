import { expect, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

/** Preserve the existing DOM-game300k script-body budget, including reload responses. Images / font measured separately. */
export function inspectNativeScripts(page: Page) {
  const pending: Array<Promise<{ url: string; status: number; bytes: number; inspected: boolean; engine: boolean; error?: string }>> = [];
  page.on('response', response => {
    if (response.request().resourceType() !== 'script') return;
    pending.push((async () => {
      if (response.status() >= 300 && response.status() < 400) return { url: response.url(), status: response.status(), bytes: 0, inspected: false, engine: false };
      const body = await response.text();
      return { url: response.url(), status: response.status(), bytes: Buffer.byteLength(body), inspected: true, engine: /WebGLRenderer|__PHASER__|Phaser v|Phaser\.Game/.test(body) };
    })().catch(error => ({ url: response.url(), status: response.status(), bytes: 0, inspected: false, engine: false, error: String(error) })));
  });
  return async (path: string) => {
    const loaded = await Promise.all(pending);
    expect(loaded.length).toBeGreaterThan(0); expect(loaded.every(script => !script.error), JSON.stringify(loaded)).toBe(true);
    const inspected = new Set(loaded.filter(script => script.inspected).map(script => script.url)); expect(inspected.size).toBeGreaterThan(0);
    for (const script of loaded) if (script.status === 304) expect(inspected.has(script.url)).toBe(true);
    expect(loaded.some(script => script.engine || /phaser/i.test(script.url)), JSON.stringify(loaded)).toBe(false);
    expect(loaded.reduce((sum, script) => sum + script.bytes, 0)).toBeLessThan(300_000);
    await writeFile(path, JSON.stringify(loaded, null, 2)); return loaded;
  };
}
