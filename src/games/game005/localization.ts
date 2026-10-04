import type { SortDimension, SortParcel, SortRule, SortSide } from './contracts';
export type SortLanguage = 'ja' | 'en';
const attributes = {
  ja: { shape: ['丸い', '角ばっている'], brightness: ['明るい', '暗い'], size: ['小さい', '大きい'], symbol: ['○', '×'] },
  en: { shape: ['ROUND ○', 'ANGULAR ◇'], brightness: ['LIGHT ☀', 'DARK ▧'], size: ['SMALL ·', 'LARGE ●'], symbol: ['○', '×'] },
} as const;
const dimensions = { ja: { shape: '形', brightness: '明るさ', size: '大きさ', symbol: '記号' }, en: { shape: 'SHAPE', brightness: 'LIGHT', size: 'SIZE', symbol: 'SYMBOL' } } as const;
export function ruleText(rule: SortRule, language: SortLanguage): { dimension: string; left: string; right: string } {
  const pair = attributes[language][rule.dimension];
  return { dimension: `${language === 'ja' ? '今のルール：' : 'CURRENT RULE: '}${dimensions[language][rule.dimension]}${rule.inverted ? language === 'ja' ? ' · 左右反転' : ' · REVERSE' : ''}`, left: pair[rule.inverted ? 1 : 0], right: pair[rule.inverted ? 0 : 1] };
}
export function attributeText(parcel: SortParcel, dimension: SortDimension, language: SortLanguage): string {
  const positive = dimension === 'shape' ? parcel.shape === 'round' : dimension === 'brightness' ? parcel.brightness === 'light' : dimension === 'size' ? parcel.size === 'small' : parcel.symbol === 'circle';
  return attributes[language][dimension][positive ? 0 : 1];
}
export function sideText(side: SortSide, language: SortLanguage): string { return side === 'left' ? language === 'ja' ? '← 左' : '← LEFT' : language === 'ja' ? '右 →' : 'RIGHT →'; }
