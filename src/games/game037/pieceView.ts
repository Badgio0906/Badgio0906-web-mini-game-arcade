// DOM for one food piece. The art is drawn at rotation 0 on a 100-unit cell
// grid; the wrapper takes the rotated bounding box and the image turns about
// its centre, so the drawn cells always coincide with the model's cells.
import {cellBounds, shapeCells, FOODS, SHAPES, type Piece, type ShapeKey} from './model';

export const ART: Readonly<Record<ShapeKey, string>> = {
  I: 'food-I-tamagoyaki.svg',
  O: 'food-O-onigiri.svg',
  L: 'food-L-ebifry.svg',
  J: 'food-J-wiener.svg',
  T: 'food-T-karaage.svg',
  S: 'food-S-broccoli.svg',
  Z: 'food-Z-tomato.svg',
};

export const assetUrl = (file: string): string => `./assets/game037/${file}`;

export function rotatedBounds(p: Pick<Piece, 'shape' | 'rotation'>): {w: number; h: number} {
  return cellBounds(shapeCells(p.shape, p.rotation));
}

export function createPieceArt(shape: ShapeKey): HTMLElement {
  const wrap = document.createElement('span');
  wrap.className = 'food';
  wrap.dataset.shape = shape;
  const img = document.createElement('img');
  img.src = assetUrl(ART[shape]);
  img.alt = '';
  img.draggable = false;
  img.decoding = 'async';
  wrap.append(img);
  return wrap;
}

/** Size the image inside a wrapper whose box is the rotated bounds. */
export function layoutPieceArt(wrap: HTMLElement, p: Pick<Piece, 'shape' | 'rotation'>): {w: number; h: number} {
  const base = cellBounds(SHAPES[p.shape]);
  const {w, h} = rotatedBounds(p);
  const img = wrap.firstElementChild as HTMLImageElement;
  img.style.width = `${(base.w / w) * 100}%`;
  img.style.height = `${(base.h / h) * 100}%`;
  img.style.left = `${((w - base.w) / 2 / w) * 100}%`;
  img.style.top = `${((h - base.h) / 2 / h) * 100}%`;
  img.style.transform = `rotate(${p.rotation * 90}deg)`;
  wrap.style.aspectRatio = `${w} / ${h}`;
  return {w, h};
}

/** Japanese name; duplicate shapes in one stage get their instance number. */
export const foodLabel = (p: Pick<Piece, 'shape' | 'id'>, duplicated: boolean): string =>
  duplicated ? `${FOODS[p.shape].ja}${p.id.slice(1)}` : FOODS[p.shape].ja;
