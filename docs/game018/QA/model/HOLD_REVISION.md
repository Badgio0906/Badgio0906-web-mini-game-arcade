# Genuine sky encounter viewing holds

Independent native Feel observations reported that AIRPLANE BREAK / UFO INCIDENT appeared in state but their world coordinates had already left the tracked view by the screenshots; the shoe was also obscured by a large caption. Root owns the caption/layer fix; this model revision preserves each encounter's genuine physical position long enough to see it.

The original fixed-step physical samples remain unchanged. At most three550ms replay holds are inserted at AIRPLANE BREAK, UFO INCIDENT and ORBITAL SHOE physical timestamps. The replay mapping freezes physical time at that encounter during its hold, then continues on the same interpolated physical trajectory. Effects and obstacle notification times are retimed consistently; total duration and result duration include every inserted hold. Distance, maximum height, break count and every score component are unchanged. The native model exposes only the current `activeHold` copy (name, remaining seconds, position), without future holds or future metrics.

Pure before/after comparison:1,890 input combinations, identical physical samples / distance / height / break count / score. Maximum flight duration24.13979015556104s; no more than1.65s additional viewing time. Near-zero-power throws remain brief. This is model timing and consistency evidence, not human fun approval.

Captured validation records:

- `HOLD_BEFORE_ISOLATED_UNIT.json`:25/25 historical isolated model tests.
- `HOLD_AFTER_ISOLATED_UNIT.json`:27/29 historical isolated candidate tests; the same exact endpoint roundoff assertions failed.
- `HOLD_PHYSICS_PRESERVATION.json`:1,890 original/candidate comparisons.
- `HOLD_INTEGRATED_UNIT.json`:27/29, exact replay endpoint y≈7.68e-12 instead of zero.
- `HOLD_INTEGRATED_RETEST_UNIT.json`:29/29 after returning exact physical duration at the total replay endpoint.

The endpoint correction preserves exact landing coordinates rather than weakening the test assertion. Strict TypeScript/no-unused validation for the four model source files passed after that correction. Root owns full build, frozen browser reruns, screenshots and Jev interpretation.
