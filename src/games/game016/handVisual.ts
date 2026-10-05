import type { Hand } from './types';
export const handLabel = (hand: Hand): string => ({ rock: 'グー', scissors: 'チョキ', paper: 'パー' })[hand];
export const handHiragana = (hand: Hand): string => ({ rock: 'ぐー', scissors: 'ちょき', paper: 'ぱー' })[hand];
const shape: Record<Hand, string> = {
  rock: '<path d="M16 44V28c0-5 6-7 9-3 1-6 8-7 11-2 3-4 10-2 11 3 7-1 10 4 8 10l-3 14H22z"/><path d="M22 30v9m9-12v11m10-10v10m9-8v9M16 37c5-3 11 0 11 6"/>',
  scissors: '<path d="M23 47 12 13c-2-7 7-9 10-2l10 24 8-27c2-7 12-4 10 3L40 44c5-4 12-1 10 5l-6 7H27z"/><path d="m24 38 9 3 9-4"/>',
  paper: '<path d="M18 48 7 35c-4-6 3-11 8-6l5 5V12c0-8 10-8 10 0V7c0-8 10-8 10 0v6c0-8 10-8 10 0v8c0-7 9-7 9 0v25l-7 10H25z"/>',
};
export function handMarkup(hand: Hand, textOnly = false): string {
  if (textOnly) return `<span class="hand-word">${handHiragana(hand)}</span>`;
  return `<span class="hand-visual" data-hand="${hand}"><svg class="hand-fallback" viewBox="0 0 64 64" aria-hidden="true" fill="#f1bb91" stroke="#243349" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${shape[hand]}<path d="M20 50h33v12H20z" fill="#243349"/></svg><img class="hand-image" src="${import.meta.env.BASE_URL}assets/game016/hand-${hand}.webp" alt="${handLabel(hand)}" draggable="false" /></span>`;
}
export function hydrateHands(parent: HTMLElement): void {
  parent.querySelectorAll<HTMLImageElement>('.hand-image').forEach(img => {
    const ready = (): void => { if (img.naturalWidth) img.parentElement!.dataset.loaded = 'true'; };
    if (img.complete) ready(); else img.addEventListener('load', ready, { once: true });
  });
}
export function showHand(element: HTMLElement, hand: Hand, textOnly = false): void {
  const signature = `${hand}/${textOnly}`; if (element.dataset.visual === signature) return;
  element.dataset.visual = signature; element.innerHTML = handMarkup(hand, textOnly); hydrateHands(element);
}
export async function preloadHands(): Promise<boolean> {
  const results = await Promise.all((['rock', 'scissors', 'paper'] as const).map(hand => new Promise<boolean>(resolve => {
    const img = new Image(); img.onload = () => { void img.decode().then(() => resolve(true), () => resolve(img.naturalWidth > 0)); }; img.onerror = () => resolve(false);
    img.src = `${import.meta.env.BASE_URL}assets/game016/hand-${hand}.webp`;
  })));
  return results.every(Boolean);
}
