import { simulate } from './physics';
import type { ShoeType, Trajectory } from './types';

/** World rotation is mathematical (+ counterclockwise), Canvas y points down. */
export function canvasSpinAngle(rotation: number): number { return -rotation; }
export function spinDirection(spin: number): string {
  return Math.abs(spin) < .04 ? 'ひねりなし' : spin > 0 ? '← 左回転・反時計回り' : '→ 右回転・時計回り';
}
export function spinExplanation(spin: number): string {
  return spinDirection(spin) + '。強さ ' + Math.round(Math.abs(spin) * 100) + '%。同じ強さなら左右の飛距離は同じ。強さで安定・貫通が変わる。';
}
const previews = new Map<string, Trajectory>();
/** Preview uses the production integrator, not an invented illustrative parabola. */
export function spinPreview(shoeType: ShoeType, spin: number, angle = 45): Trajectory {
  const roundedSpin = Math.round(spin * 10) / 10, roundedAngle = Math.round(angle / 5) * 5;
  const key = shoeType + ':' + roundedSpin + ':' + roundedAngle;
  let value = previews.get(key);
  if (!value) {
    value = simulate({ shoeType, spin: roundedSpin, angle: roundedAngle, power: 80 }, true);
    if (previews.size >= 64) previews.delete(previews.keys().next().value!);
    previews.set(key, value);
  }
  return value;
}
