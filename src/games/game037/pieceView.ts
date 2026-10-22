// DOM/SVG for one dish. Rules v2 dishes can be any polyomino, so a dish is
// composed at runtime: a rounded base that follows the cells (tray paper,
// leaf or baran per food) plus one hand-drawn food motif per cell from
// foods.svg. Rotation re-renders the rotated cells, so food stays upright and
// the drawn cells always coincide with the model's cells.
import {cellBounds, pieceShape, FOODS, type Cell, type FoodKey, type Piece} from './model';

export const assetUrl = (file: string): string => `./assets/game037/${file}`;

/** Base (tray material) colour and outline per food; motif ids live in foods.svg. */
export const DISH_STYLE: Readonly<Record<FoodKey, {base: string; line: string}>> = {
  tamago: {base: '#fbf3dc', line: '#4a2e1c'},
  onigiri: {base: '#6f9e44', line: '#2f4a1c'},
  ebi: {base: '#dcebb0', line: '#3f5a1e'},
  tako: {base: '#cfe6f0', line: '#2f4f63'},
  karaage: {base: '#a6cf66', line: '#34501a'},
  broccoli: {base: '#f4e4bc', line: '#5a4628'},
  tomato: {base: '#5fa443', line: '#1f4a16'},
  salmon: {base: '#f6dde0', line: '#7a3a3e'},
  edamame: {base: '#fff3c4', line: '#7a6420'},
  hamburg: {base: '#e9cfa6', line: '#5e3a18'},
};

let spritePromise: Promise<void> | null = null;

/** Inject foods.svg once so <use href="#m-…"> works everywhere (tray, board, ghost). */
export function loadSprite(): Promise<void> {
  spritePromise ??= fetch(assetUrl('foods.svg'))
    .then(r => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
    .then(text => {
      const holder = document.createElement('div');
      holder.setAttribute('aria-hidden', 'true');
      holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      holder.innerHTML = text;
      document.body.prepend(holder);
    })
    .catch(() => { /* dishes still show their shaped bases without motifs */ });
  return spritePromise;
}

const CELL = 100, GAP = 5, RADIUS = 12, INSET = GAP + RADIUS;

/** Union of inset cell squares, bridges and 2×2 centres; stroked round it gives a rounded dish. */
function dishPath(cells: readonly Cell[]): string {
  const has = new Set(cells.map(([x, y]) => `${x},${y}`));
  const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;
  const s = INSET, side = CELL - 2 * s;
  let d = '';
  for (const [x, y] of cells) {
    const ox = x * CELL + s, oy = y * CELL + s;
    d += rect(ox, oy, side, side);
    if (has.has(`${x + 1},${y}`)) d += rect(ox, oy, CELL + side, side);
    if (has.has(`${x},${y + 1}`)) d += rect(ox, oy, side, CELL + side);
    if (has.has(`${x + 1},${y}`) && has.has(`${x},${y + 1}`) && has.has(`${x + 1},${y + 1}`)) d += rect(ox, oy, CELL + side, CELL + side);
  }
  return d;
}

/** Render the dish for `p` at its current rotation into `host` (an element sized by aspect-ratio). */
export function renderDish(host: HTMLElement, p: Pick<Piece, 'food' | 'cells' | 'rotation'>): {w: number; h: number} {
  const cells = pieceShape(p);
  const {w, h} = cellBounds(cells);
  const key = `${p.food}|${JSON.stringify(cells)}`;
  host.style.aspectRatio = `${w} / ${h}`;
  if (host.dataset.dish === key) return {w, h};
  host.dataset.dish = key;
  const st = DISH_STYLE[p.food];
  const d = dishPath(cells);
  const seed = p.food.length;
  const motifs = cells.map(([x, y], i) => {
    const tilt = (((x * 7 + y * 13 + i * 5 + seed) % 5) - 2) * 4;
    return `<use href="#m-${p.food}" x="${x * CELL + 4}" y="${y * CELL + 4}" width="92" height="92" transform="rotate(${tilt} ${x * CELL + 50} ${y * CELL + 50})"/>`;
  }).join('');
  host.innerHTML =
    `<svg viewBox="0 0 ${w * CELL} ${h * CELL}" preserveAspectRatio="xMidYMid meet" overflow="visible" aria-hidden="true">` +
    `<path d="${d}" fill="#2a170c" stroke="#2a170c" stroke-width="${2 * RADIUS}" stroke-linejoin="round" opacity=".24" transform="translate(3 5)"/>` +
    `<path d="${d}" fill="${st.line}" stroke="${st.line}" stroke-width="${2 * RADIUS + 7}" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="${st.base}" stroke="${st.base}" stroke-width="${2 * RADIUS}" stroke-linejoin="round"/>` +
    motifs + '</svg>';
  return {w, h};
}

export function createDish(): HTMLElement {
  const wrap = document.createElement('span');
  wrap.className = 'food';
  return wrap;
}

export const rotatedBounds = (p: Pick<Piece, 'cells' | 'rotation'>): {w: number; h: number} => cellBounds(pieceShape(p));

/** Japanese name; when the same food appears twice in a stage it gets its tray number. */
export const foodLabel = (food: FoodKey, n: number | null): string => n === null ? FOODS[food].ja : `${FOODS[food].ja}${n}`;
