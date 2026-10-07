import { rank, red, suit, type Card } from './Klondike';
export const suitSymbols = ['♣', '♦', '♥', '♠'];
const names = { clubs: 'クラブ', diamonds: 'ダイヤ', hearts: 'ハート', spades: 'スペード' };
export const rankLabel = (card: Card): string => ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' } as Record<number,string>)[rank(card)] ?? String(rank(card));
export const cardLabel = (card: Card): string => `${names[suit(card)]} ${rankLabel(card)}・${red(card) ? '赤' : '黒'}`;
export const cardFace = (card: Card): string => { const symbol = suitSymbols[Math.floor(card / 13)]; return `<span class="corner">${rankLabel(card)}<span class="suit">${symbol}</span></span><span class="center-suit" aria-hidden="true">${symbol}</span><span class="bottom" aria-hidden="true">${rankLabel(card)}${symbol}</span>`; };
/** Original plant-back vector authored here; no external card artwork. */
export const plantBack = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 90" aria-hidden="true"><rect width="60" height="90" fill="#dce5d0"/><rect x="4" y="4" width="52" height="82" rx="4" fill="none" stroke="#839a77"/><path d="M30 72V18M30 58Q9 57 13 39Q31 39 30 58M30 48Q48 46 47 28Q30 30 30 48M30 35Q17 31 20 19Q31 22 30 35" fill="none" stroke="#537b62" stroke-width="2.2" stroke-linecap="round"/><path d="M22 76h16M26 79h8" stroke="#8ba176" stroke-width="2"/><circle cx="11" cy="14" r="1.4" fill="#b59953"/><circle cx="49" cy="76" r="1.4" fill="#b59953"/></svg>`;
