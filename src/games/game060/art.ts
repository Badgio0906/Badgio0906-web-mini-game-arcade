// ImageGen originals → pinned Pixelizer CLI distribution. No human art approval is implied.
export interface Sprites {
  bg: HTMLCanvasElement;
  drone: HTMLCanvasElement;
  boss: HTMLCanvasElement;
  bossDamaged: HTMLCanvasElement;
  heroNormal: HTMLCanvasElement;
  heroSmug: HTMLCanvasElement;
}

let generated:Sprites;
export async function prepareSprites(){const names=['board','drone','boss','bossDamaged','heroNormal','heroSmug'];const out:Record<string,HTMLCanvasElement>={};await Promise.all(names.map(async name=>{const image=new Image();image.src=`./assets/${name}.webp`;await image.decode();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;c.getContext('2d')!.drawImage(image,0,0);out[name==='board'?'bg':name]=c;}));generated=out as unknown as Sprites;}
export function buildSprites(_scale:number):Sprites{if(!generated)throw Error('Required art not ready');return generated;}
