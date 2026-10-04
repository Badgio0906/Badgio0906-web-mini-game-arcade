import { describe, expect, it } from 'vitest';
import { attributeText, ruleText, sideText } from '../../src/games/game005/localization';
import { expectedSide, ruleAt } from '../../src/games/game005/SortRun';
import type { SortParcel } from '../../src/games/game005/contracts';

describe('Sort instructions preserve the actual rule in both languages', () => {
  it('Japanese primary instructions state ordinary shape/light/size/symbol mappings and announce reversals', () => {
    const instructions = [ruleText(ruleAt(0), 'ja'), ruleText(ruleAt(8), 'ja'), ruleText(ruleAt(16), 'ja'), ruleText(ruleAt(24), 'ja')];
    expect(instructions.map(rule => [rule.left, rule.right])).toEqual([['丸い','角ばっている'],['明るい','暗い'],['小さい','大きい'],['○','×']]);
    for (const sorted of [32,40,48,56]) {
      const normal = ruleText(ruleAt(sorted - 32), 'ja'); const reversed = ruleText(ruleAt(sorted), 'ja');
      expect(reversed.dimension).toContain('左右反転');
      expect(reversed.left).toBe(normal.right); expect(reversed.right).toBe(normal.left);
    }
  });
  it('all16 parcel combinations match the translated correct side across all8 rules without mutating model data', () => {
    for (const shape of ['round','angular'] as const) for (const brightness of ['light','dark'] as const)
      for (const size of ['small','large'] as const) for (const symbol of ['circle','cross'] as const) {
        const parcel: SortParcel = { id: 1, shape, brightness, size, symbol }; const original = { ...parcel };
        for (let sorted = 0; sorted < 64; sorted += 8) {
          const rule = ruleAt(sorted); const originalRule = { ...rule }; const side = expectedSide(parcel, rule);
          for (const language of ['ja','en'] as const) {
            const instructions = ruleText(rule, language);
            expect(instructions[side]).toBe(attributeText(parcel, rule.dimension, language));
            expect(instructions.left).not.toBe(instructions.right);
          }
          const english = ruleText(rule, 'en');
          expect(english.left).toBe(rule.leftLabel); expect(english.right).toBe(rule.rightLabel);
          expect(rule).toEqual(originalRule);
        }
        expect(parcel).toEqual(original);
      }
  });
  it('both localized directions retain distinct arrow direction and English left/right semantics', () => {
    expect(sideText('left','ja')).toBe('← 左'); expect(sideText('right','ja')).toBe('右 →');
    expect(sideText('left','en')).toBe('← LEFT'); expect(sideText('right','en')).toBe('RIGHT →');
  });
});
