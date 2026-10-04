export class InputService {
  private abort = new AbortController();
  constructor(target: HTMLElement, onAction: () => void, onPause: () => void) {
    const options = { signal: this.abort.signal };
    target.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest('button, a, input, dialog')) return;
      event.preventDefault();
      target.focus({ preventScroll: true });
      onAction();
    }, options);
    document.addEventListener('keydown', event => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const element = event.target as HTMLElement;
      if (element.closest('dialog[open], input, textarea, select')) return;
      if (event.code === 'Escape' || event.code === 'KeyP') {
        event.preventDefault(); onPause(); return;
      }
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      // Let semantic buttons handle their native keyboard click once.
      if (element.closest('button, a')) return;
      event.preventDefault(); onAction();
    }, options);
  }
  destroy(): void { this.abort.abort(); }
}
