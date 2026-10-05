import type { StorageService } from '../../core/StorageService';
const LIMIT = Number.MAX_SAFE_INTEGER;
/** StorageService's numeric boundary accepts integers: persist units, never floating meters/seconds. */
export function recordFallStats(storage: StorageService, meters: number): void {
  if (!Number.isFinite(meters) || meters < 0) return;
  const dm = Math.min(LIMIT, Math.round(meters * 10));
  const previous = storage.readNumber('lifetimeFallDm', 0, 0, LIMIT);
  storage.writeNumber('lifetimeFallDm', Math.min(LIMIT, previous + dm));
}
export function recordClearStats(storage: StorageService, seconds: number): void {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  const ms = Math.max(1, Math.min(LIMIT, Math.round(seconds * 1000)));
  const previous = storage.readNumber('bestClearMs', 0, 0, LIMIT);
  if (!previous || ms < previous) storage.writeNumber('bestClearMs', ms);
  storage.writeBoolean('spaceReached', true);
}
