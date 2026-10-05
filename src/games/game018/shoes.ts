import type { Shoe, ShoeType } from './types';
export const SHOES: readonly Readonly<Shoe>[] = Object.freeze([
  { id: 'paper', name: 'PAPER SHOE', nameJa: '紙の靴', tagline: '軽ければ軽いほど、空は近い。', color: '#fff1be', weight: .3, aerodynamics: .6, spinEfficiency: .65, launchSpeed: 1020, gravity: 70, drag: .000045, penetration: .32, optimalSpin: .65 },
  { id: 'zori', name: 'ZORI', nameJa: '草履', tagline: '回れ。草履。', color: '#f7ba6b', weight: .8, aerodynamics: 1.1, spinEfficiency: 1.6, launchSpeed: 760, gravity: 95, drag: .000014, penetration: .75, optimalSpin: .9 },
  { id: 'sneaker', name: 'SNEAKER', nameJa: 'スニーカー', tagline: '迷ったらこれ。', color: '#f85d72', weight: 1, aerodynamics: 1.3, spinEfficiency: 1, launchSpeed: 960, gravity: 105, drag: .00001, penetration: 1, optimalSpin: .45 },
  { id: 'leather', name: 'LEATHER SHOE', nameJa: '革靴', tagline: '社会人の重み。', color: '#895945', weight: 1.8, aerodynamics: .95, spinEfficiency: .9, launchSpeed: 800, gravity: 120, drag: .000009, penetration: 2.2, optimalSpin: .65 },
  { id: 'iron-geta', name: 'IRON GETA', nameJa: '鉄下駄', tagline: '飛ばない。普通は。', color: '#88a5b9', weight: 4, aerodynamics: .65, spinEfficiency: .75, launchSpeed: 420, gravity: 145, drag: .000006, penetration: 4.5, optimalSpin: .8 },
].map(shoe => Object.freeze(shoe as Shoe)));
export function shoeFor(id: ShoeType): Readonly<Shoe> { return SHOES.find(shoe => shoe.id === id) ?? SHOES[2]; }
