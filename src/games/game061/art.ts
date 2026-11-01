// ImageGen originals → Pixelizer distribution; minor spinning gear remains procedural.
export const COPPER = '#b8643a';
export const CREAM = '#f6ead2';
export const TURQ = '#2fe0c8';
export const BRASS = '#d9a441';

export interface Sprites { bg: HTMLCanvasElement; armor: HTMLCanvasElement; armorBroken: HTMLCanvasElement; core: HTMLCanvasElement; cannon: HTMLCanvasElement; gear: HTMLCanvasElement; gunner: HTMLCanvasElement; gunnerWin: HTMLCanvasElement }

function canvas(w: number, h: number, scale: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
  const g = c.getContext('2d')!; g.scale(scale, scale);
  return [c, g];
}

function gear(scale: number) {
  const [c, g] = canvas(28, 28, scale);
  g.translate(14, 14); g.fillStyle = BRASS;
  for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.fillRect(-3, -13, 6, 6); }
  g.beginPath(); g.arc(0, 0, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#4a2214'; g.beginPath(); g.arc(0, 0, 3.5, 0, Math.PI * 2); g.fill();
  return c;
}

let generated:Sprites;
export async function prepareSprites(){const names=['board','armor','armorBroken','core','cannon','gunner','gunnerWin'];const out:Record<string,HTMLCanvasElement>={};await Promise.all(names.map(async name=>{const image=new Image();image.src=`./assets/${name}.webp`;await image.decode();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;c.getContext('2d')!.drawImage(image,0,0);out[name==='board'?'bg':name]=c;}));out.gear=gear(1);generated=out as unknown as Sprites;}
export function buildSprites(_scale:number):Sprites{if(!generated)throw Error('Required art not ready');return generated;}
