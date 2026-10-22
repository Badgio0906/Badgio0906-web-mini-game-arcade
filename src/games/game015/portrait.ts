// Viewport/input heuristic, not user-agent or physical device detection.
// Fine-pointer desktops and larger tablets retain normal play.
export const PHONE_LANDSCAPE = '(pointer: coarse) and (hover: none) and (orientation: landscape) and (max-width: 1000px) and (max-height: 600px)';

export function watchPhoneLandscape(change: (blocked: boolean) => void): () => void {
  const media = window.matchMedia(PHONE_LANDSCAPE);
  const update = (): void => change(media.matches);
  media.addEventListener('change', update);
  update();
  return () => media.removeEventListener('change', update);
}

/** A key held across rotation must be released before it can activate a new menu. */
export function guardRotationActivation(signal: AbortSignal): () => void {
  const held = new Set<string>(), stale = new Set<string>();
  const activation = (key: string): boolean => key === 'Enter' || key === ' ';
  const suppress = (event: KeyboardEvent): void => { event.preventDefault(); event.stopImmediatePropagation(); };
  window.addEventListener('keydown', event => {
    if (!activation(event.key)) return;
    held.add(event.key);
    if (stale.has(event.key)) { stale.add(event.key); suppress(event); }
  }, { capture: true, signal });
  window.addEventListener('keyup', event => {
    if (!activation(event.key)) return;
    held.delete(event.key);
    if (stale.delete(event.key)) suppress(event);
  }, { capture: true, signal });
  return () => { for (const key of held) stale.add(key); };
}
