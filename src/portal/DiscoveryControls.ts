import { developmentStatusLabels, type GameCatalogEntry, type GameDevelopmentStatus, type TagMatchMode } from '../data/gameCatalog';
import { tagLabels, type TagId } from '../data/tagCatalog';
import { activeTagOptions } from './discovery';

export interface DiscoverySelection { tags: TagId[]; mode: TagMatchMode; statuses: GameDevelopmentStatus[]; }

/** Controls update selection only; card nodes and their integrations stay owned by main. */
export function mountDiscoveryControls(games: readonly GameCatalogEntry[], onChange: (selection: DiscoverySelection) => void) {
  const tags = new Set<TagId>(), statuses = new Set<GameDevelopmentStatus>();
  let mode: TagMatchMode = 'or';
  const selected = document.getElementById('selected-tags')!;
  const picker = document.getElementById('tag-picker') as HTMLDetailsElement;
  const summary = picker.querySelector('summary')!;
  const tagButtons = new Map<TagId, HTMLButtonElement>();
  const statusButtons = new Map<GameDevelopmentStatus, HTMLButtonElement>();
  const modeButtons = document.querySelectorAll<HTMLButtonElement>('#tag-match-modes button');
  const options = activeTagOptions(games);
  summary.textContent = `タグを選ぶ（${options.length}種類）`;
  picker.open = false;

  const update = () => {
    for (const tag of options) {
      const button = tagButtons.get(tag.id)!;
      button.setAttribute('aria-pressed', String(tags.has(tag.id)));
      button.textContent = `${tags.has(tag.id) ? '✓ ' : ''}${tag.label} ${tag.count}`;
    }
    for (const [status, button] of statusButtons) {
      button.setAttribute('aria-pressed', String(statuses.has(status)));
      button.textContent = `${statuses.has(status) ? '✓ ' : ''}${developmentStatusLabels[status]} ${games.filter(game => game.developmentStatus === status).length}`;
    }
    for (const button of modeButtons) {
      const active = button.dataset.mode === mode;
      button.setAttribute('aria-pressed', String(active));
      button.textContent = `${active ? '✓ ' : ''}${button.dataset.mode === 'or' ? 'OR' : 'AND'}`;
    }
    document.getElementById('tag-match-description')!.textContent = mode === 'or'
      ? '選択タグのどれかが一致'
      : '選択タグすべてが一致';
    const compact = document.getElementById('discovery-selection-summary')!;
    compact.textContent = [tags.size ? `${mode.toUpperCase()}：${[...tags].map(id => tagLabels[id]).join('・')}` : '', [...statuses].map(status => developmentStatusLabels[status]).join('・')].filter(Boolean).join(' ／ ');
    compact.hidden = !compact.textContent;
    selected.replaceChildren();
    if (!tags.size) selected.textContent = 'なし（すべてのタグ）';
    for (const id of tags) {
      const chip = document.createElement('button');
      chip.type = 'button'; chip.textContent = `${tagLabels[id]} ×`;
      chip.setAttribute('aria-label', `${tagLabels[id]}の絞り込みを解除`);
      chip.setAttribute('aria-pressed', 'true');
      chip.addEventListener('click', () => {
        tags.delete(id); update();
        // The chip is removed; leave keyboard focus on a visible, useful control.
        if (picker.open) tagButtons.get(id)!.focus({ preventScroll: true });
        else summary.focus({ preventScroll: true });
      });
      selected.append(chip);
    }
    onChange({ tags: [...tags], mode, statuses: [...statuses] });
  };
  for (const status of ['trial', 'complete'] as const) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.developmentStatus = status;
    button.className = `development-filter development-filter--${status}`;
    button.addEventListener('click', () => { if (statuses.has(status)) statuses.delete(status); else statuses.add(status); update(); });
    statusButtons.set(status, button); document.getElementById('development-filters')!.append(button);
  }
  for (const tag of options) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.tagId = tag.id;
    button.addEventListener('click', () => { if (tags.has(tag.id)) tags.delete(tag.id); else tags.add(tag.id); update(); });
    tagButtons.set(tag.id, button); document.getElementById('tag-options')!.append(button);
  }
  for (const button of modeButtons) button.addEventListener('click', () => { mode = button.dataset.mode as TagMatchMode; update(); });
  document.getElementById('clear-filters')!.addEventListener('click', () => { tags.clear(); statuses.clear(); mode = 'or'; update(); });
  update();
}
