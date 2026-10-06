import css from './gameTouchGuards.css?inline';

/** Interaction only: explanatory text, privacy, settings and portal remain ordinary web content. */
export const GAME_INTERACTION_SELECTOR = '[data-game-interaction], [data-game-control], .game-canvas, .game-control, .touch-control';
const inferredControls = 'canvas, #game-canvas button, #game-canvas [role="button"], .controls button, [data-practice-action], [data-hand], [data-pad], #practice-action, #game-canvas img';
const installed = new WeakMap<Document, () => void>();

/** Idempotent; observes controls created after boot, without changing gameplay pointer events. */
export function installGameTouchGuards(root: Document = document): () => void {
  const prior = installed.get(root);
  if (prior) return prior;
  const added = new Set<Element>();
  root.documentElement.dataset.gameTouchPage = '';
  const style = root.createElement('style'); style.dataset.gameTouchStyle = ''; style.textContent = css; root.head.append(style);
  const mark = (element: Element) => {
    if (element.matches('canvas')) {
      if (!element.hasAttribute('data-game-interaction')) { element.setAttribute('data-game-interaction', ''); added.add(element); }
    } else if (!element.hasAttribute('data-game-control')) { element.setAttribute('data-game-control', ''); added.add(element); }
  };
  const prepare = (element: Element) => {
    if (element.matches(inferredControls)) mark(element);
    element.querySelectorAll(inferredControls).forEach(mark);
    if (element.matches('img') && element.closest(GAME_INTERACTION_SELECTOR)) element.setAttribute('draggable', 'false');
    element.querySelectorAll('img').forEach(img => { if (img.closest(GAME_INTERACTION_SELECTOR)) img.draggable = false; });
  };
  prepare(root.documentElement);
  const prevent = (event: Event) => {
    const target = event.target as Element | null;
    if (!target || target.nodeType !== 1 || target.closest('input, textarea, select, [contenteditable="true"], [data-game-touch-allow]')) return;
    if (target.closest(GAME_INTERACTION_SELECTOR)) event.preventDefault();
  };
  for (const name of ['selectstart', 'contextmenu', 'dragstart']) root.addEventListener(name, prevent, true);
  const observer = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1) prepare(node as Element);
    for (const element of added) if (!element.isConnected) added.delete(element);
  });
  observer.observe(root.documentElement, { childList: true, subtree: true });
  const dispose = () => {
    observer.disconnect(); style.remove();
    for (const name of ['selectstart', 'contextmenu', 'dragstart']) root.removeEventListener(name, prevent, true);
    for (const element of added) { element.removeAttribute('data-game-interaction'); element.removeAttribute('data-game-control'); }
    delete root.documentElement.dataset.gameTouchPage; installed.delete(root);
  };
  installed.set(root, dispose);
  return dispose;
}
