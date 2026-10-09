/* Load before game entrypoints, including legacy shell scripts.
   Keep native link clicks and each game's save/quit listeners intact. */
(() => {
  const isReturn = event => event.target instanceof Element && event.target.closest('a.arcade-portal-return');
  window.addEventListener('keydown', event => {
    if (!isReturn(event)) return;
    // Tab still moves focus; Enter still performs the native anchor click.
    // Neither key nor gameplay shortcuts reach global game input handlers.
    event.stopImmediatePropagation();
    if (event.repeat && event.key === 'Enter') event.preventDefault();
  }, true);
  for (const type of ['pointerdown', 'mousedown', 'touchstart']) {
    // Capture listeners register fresh gestures for native click validation.
    // Stop initiating gestures after those guards have seen the press.
    // Releases propagate so a gameplay hold released over navigation is cleared.
    document.addEventListener(type, event => {
      if (isReturn(event)) event.stopImmediatePropagation();
    }, {passive: true});
  }
  // A native modal makes the page header inert. Keep the same return action at
  // its reserved header coordinates in the modal's top layer, outside play.
  // Forward the click so asynchronous save/quit hooks continue to own exit.
  function syncModalReturn() {
    const modals = [...document.querySelectorAll('dialog:modal')];
    const modal = modals.at(-1);
    document.querySelectorAll('.arcade-modal-return').forEach(link => {
      if (link.parentElement !== modal) link.remove();
    });
    const source = document.querySelector('.arcade-game-header a.arcade-portal-return');
    if (!modal || !source) return;
    let link = modal.querySelector('.arcade-modal-return');
    if (!link) {
      link = document.createElement('a');
      link.className = 'arcade-portal-return arcade-modal-return';
      link.textContent = '← ゲーム一覧へ';
      link.href = source.href;
      link.addEventListener('click', event => {
        if (event.button || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        source.click();
      });
      modal.prepend(link);
    }
    const box = source.getBoundingClientRect();
    link.style.left = `${Math.max(8, box.left)}px`;
    link.style.top = `${Math.max(4, box.top)}px`;
  }
  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(records => {
      if (records.some(record => record.attributeName === 'open' || record.target instanceof Element && record.target.closest('dialog'))) syncModalReturn();
    }).observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['open']});
    syncModalReturn();
  });
  window.addEventListener('resize', syncModalReturn);
  window.addEventListener('scroll', syncModalReturn, true);
})();
