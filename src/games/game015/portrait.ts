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
