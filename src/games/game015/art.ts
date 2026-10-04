/** FALL KING: deliberately authored native pixels, never filtered source art. */
export const NATIVE_WIDTH = 256;
export const NATIVE_HEIGHT = 448;
export const TILE_SIZE = 16;
export const KING_WIDTH = 24;
export const KING_HEIGHT = 36;
export const KING_ANCHOR = { x: 12, y: 36 } as const;

/** One transparent token plus sixteen deliberately limited opaque colors. */
export const PALETTE = {
  '0': '#111525', '1': '#1b253e', '2': '#34445b', '3': '#647580',
  '4': '#adbaae', '5': '#fff1c2', '6': '#f3b677', '7': '#f5cf64',
  '8': '#ac7639', '9': '#66c6b4', a: '#287c7b', b: '#d45b70',
  c: '#743953', d: '#a999d1', e: '#d88456', f: '#759876',
} as const;
export type PixelColor = keyof typeof PALETTE;
export type KingState = 'idle' | 'drop' | 'falling' | 'left' | 'right' | 'landing' | 'hard' | 'death';
export type PlatformArtType = 'normal' | 'soft' | 'crumble' | 'moving';
export type BiomeArt = 'tower' | 'works' | 'cave' | 'strange';
type Pixels = readonly string[];

function grid(rows: readonly string[], width: number, height: number): Pixels {
  if (rows.length !== height || rows.some(row => row.length !== width || /[^.0-9a-f]/.test(row))) {
    throw new Error(`FALL KING pixel grid must be ${width}x${height}`);
  }
  return rows;
}
function variant(base: Pixels, edits: Record<number, string>): Pixels {
  return grid(base.map((row, i) => edits[i] ?? row), base[0].length, base.length);
}
function mirror(base: Pixels): Pixels { return base.map(row => [...row].reverse().join('')); }

const IDLE = grid([
  '................', '.....7..7..7....', '.....77.7.77....', '.....8777778....',
  '.....0000000....', '....066666660...', '....065555560...', '....065050560...',
  '....065555560...', '.....6655560....', '......60006.....', '.....099990.....',
  '....bb9999bc....', '...0b69999b60...', '...0669999660...', '....0a9999c0....',
  '.....a9999c.....', '.....a7777c.....', '.....0aaa00.....', '.....0a00a0.....',
  '.....060060.....', '....06600660....', '....08800880....', '....00000000....',
], 16, 24);
const DROP = grid([
  '................', '................', '................', '.....7..7..7....',
  '.....77.7.77....', '.....8777778....', '.....0000000....', '....066666660...',
  '....065555560...', '....065050560...', '....065555560...', '.....6655560....',
  '......60006.....', '....0b9999b0....', '...0669999660...', '....0a9999c0....',
  '.....a9999c.....', '....0a7777a0....', '....06aaaa60....', '.....600006.....',
  '....06600660....', '....08800880....', '....00000000....', '................',
], 16, 24);
const FALL = grid([
  '................', '.....7..7..7....', '.....77.7.77....', '.....8777778....',
  '.....0000000....', '....066666660...', '....065555560...', '....065050560...',
  '....065555560...', '.....6655560....', '..60..60006..06.', '..060b9999b0060.',
  '...0bb9999bb00..', '...0bc9999cb0...', '....0a9999c0....', '.....a9999c.....',
  '.....a7777c.....', '.....0aaa00.....', '....060..060....', '...0660..0660...',
  '...0880..0880...', '...0000..0000...', '................', '................',
], 16, 24);
const LEFT = grid([
  '................', '....7..7..7.....', '....77.7.77.....', '....8777778.....',
  '....0000000.....', '...066666660....', '...065555560....', '...060550560....',
  '...065555560....', '....6655560.....', '.....60006......', '..60.09999bb....',
  '..060b9999bbbc..', '...0669999bbcc..', '....0a9999cc0...', '.....a9999c.....',
  '.....a7777c.....', '.....0aaa00.....', '....060..060....', '...0660...0660..',
  '...0880...0880..', '...0000...0000..', '................', '................',
], 16, 24);
const LAND = grid([
  '................', '................', '................', '................',
  '................', '................', '.....7..7..7....', '.....77.7.77....',
  '.....8777778....', '.....0000000....', '....066666660...', '....065555560...',
  '....065050560...', '....065555560...', '.....6655560....', '......60006.....',
  '....0b9999b0....', '...0669999660...', '....0a7777a0....', '....06aaaa60....',
  '...0660000660...', '...0880..0880...', '...0000000000...', '................',
], 16, 24);
const HARD = grid([
  '................', '................', '................', '................',
  '................', '................', '................', '....7..7..7.....',
  '....77.7.77.....', '....8777778.....', '....0000000.....', '...066666660....',
  '...065555560....', '...060550560....', '...065555560....', '....6655560.....',
  '.....60006......', '...0bb9999b0....', '..06669999660...', '...0aa7777a0....',
  '...06aaaa660....', '..0660088880....', '..0880000000....', '..0000..........',
], 16, 24);
const DEATH = grid([
  '................', '................', '................', '................',
  '................', '................', '................', '................',
  '.........7..7...', '.........7777...', '.........8778...', '................',
  '................', '................', '................', '................',
  '................', '................', '.....00000......', '...066555660....',
  '..06650555660...', '..0bb999999bc0..', '.088aa7777aa880.', '.0000000000000.',
].map(row => row.padEnd(16, '.')), 16, 24);

/** Every variant is a deliberate row edit; integer-frame animation only. */
const KING_SOURCE_FRAMES: Readonly<Record<KingState, readonly Pixels[]>> = {
  idle: [IDLE, variant(IDLE, { 7: '....065555560...', 14: '...06699996bc0..', 15: '....0a9999cc0...' })],
  drop: [DROP, variant(DROP, { 18: '...066aaaa660...', 19: '....06000060....', 20: '...0660..0660...', 21: '...0880..0880...', 22: '...0000..0000...' })],
  falling: [FALL, variant(FALL, { 10: '.060..60006.060.', 11: '..060b9999b060..', 12: '...0bb9999bb0...', 18: '.....060060.....', 19: '....06600660....', 20: '....08800880....', 21: '....00000000....' }), FALL, variant(FALL, { 12: '..0bbb9999bbb0..', 13: '...0bc9999cb0...', 19: '..0660....0660..', 20: '..0880....0880..', 21: '..0000....0000..' })],
  left: [LEFT, variant(LEFT, { 12: '..060b9999bbbc..', 13: '...0669999bbcc..', 19: '..0660....0660..', 20: '..0880....0880..', 21: '..0000....0000..' })],
  right: [mirror(LEFT), mirror(variant(LEFT, { 12: '..060b9999bbbc..', 13: '...0669999bbcc..', 19: '..0660....0660..', 20: '..0880....0880..', 21: '..0000....0000..' }))],
  landing: [LAND, DROP, IDLE],
  hard: [HARD, variant(HARD, { 13: '...065555560....', 17: '...0bb9999bb0...', 18: '..06669999b660..' }), HARD],
  death: [LAND, HARD, DEATH, variant(DEATH, { 7: '..7.........7...', 8: '.777.......777..', 9: '..7.........7...', 10: '.....7..7..7....', 11: '.....8777778....', 20: '..06655055660...' })],
};

/** Explicit nearest 3:2 mapping produces only whole native pixels, never an antialiased transform. */
function enlargedKingFrames(state: KingState): readonly Pixels[] { return KING_SOURCE_FRAMES[state].map(frame => grid(Array.from({ length: KING_HEIGHT }, (_, row) => Array.from({ length: KING_WIDTH }, (_, col) => frame[Math.floor(row / 1.5)][Math.floor(col / 1.5)]).join('')), KING_WIDTH, KING_HEIGHT)); }
export const KING_FRAMES: Readonly<Record<KingState, readonly Pixels[]>> = { idle: enlargedKingFrames('idle'), drop: enlargedKingFrames('drop'), falling: enlargedKingFrames('falling'), left: enlargedKingFrames('left'), right: enlargedKingFrames('right'), landing: enlargedKingFrames('landing'), hard: enlargedKingFrames('hard'), death: enlargedKingFrames('death') };

const TILES = {
  brick: [
    '2222222222222222','2111111221111112','2132211221322112','2122111221221112',
    '2111111221111112','2111111221111112','2111111221111112','2222222222222222',
    '1112211111122111','1112211111122111','2212221221222211','1112211111122111',
    '1112211111122111','1112211111122111','1112211111122111','2222222222222222',
  ],
  window: [
    '2222222222222222','2111222222221112','2112300000321112','2112300000321112',
    '2112300000321112','2112300000321112','2112333333321112','2112302200321112',
    '2112302200321112','2112302200321112','2112302200321112','2112302200321112',
    '2112222222221112','2111111111111112','2111111111111112','2222222222222222',
  ],
  beam: [
    '1122222222222211','1123222222232211','1123222222232211','1122322222322211',
    '1122232223222211','1122223232222211','1122222322222211','1122223232222211',
    '1122232223222211','1122322222322211','1123222222232211','1123222222232211',
    '1122222222222211','1123222222232211','1122222222222211','1122222222222211',
  ],
  pipe: [
    '1111112222111111','1111123332211111','1111123232211111','1111123232211111',
    '1111123232211111','1111123232211111','1111223232221111','1112333333322111',
    '1112222222222111','1111123232211111','1111123232211111','1111123232211111',
    '1111123232211111','1111123232211111','1111123232211111','1111122222211111',
  ],
  cave: [
    '1111111111111111','1111111122211111','1122211222221111','1222222222121111',
    '1221222221122211','1121122211122221','1111111111121221','1111111111111121',
    '1111122221111111','1111222222111111','1111221222211111','1111121122211111',
    '1122111112111111','1222211111111111','1222221111111111','1121221111111111',
  ],
  rock: [
    '1111122222111111','1111223222211111','1112232222221111','1122221222222111',
    '1122211221222111','1122111122122111','1122111111122111','1122111111112111',
    '1111111221111111','1111112232111111','1111122232211111','1111222222221111',
    '1111222122221111','1111221121221111','1111121111221111','1111111111111111',
  ],
  glyph: [
    '1111112222111111','1111122112211111','1111221111221111','1112211221122111',
    '1122112332112211','1121123223211211','1121123113211211','1121123113211211',
    '1121123223211211','1122112332112211','1112211221122111','1111221111221111',
    '1111122112211111','1111112222111111','1111111111111111','1111111111111111',
  ],
  pillars: [
    '1122211111122211','1123211111123211','1123211111123211','1122211111122211',
    '1122111111112211','1122111111112211','1122111111112211','1122222222222211',
    '1123222222232211','1122222222222211','1122111111112211','1122111111112211',
    '1122111111112211','1122211111122211','1123211111123211','1122211111122211',
  ],
} as const;
const BASE_TILES = Object.fromEntries(Object.entries(TILES).map(([name, rows]) => [name, grid(rows, 16, 16)])) as Record<keyof typeof TILES,Pixels>;
// Explicit masonry/engineering/organic/unknown motifs, not noise or pixel-filtered art.
const MORE_TILES = {
  ashlar: variant(BASE_TILES.brick,{3:'2122222222222112',7:'2222222222222222',11:'1122221111222211'}),
  chipped: variant(BASE_TILES.brick,{1:'2111110221111112',2:'2132200221322112',3:'2122001221221112',4:'2111011221111112'}),
  grate: variant(BASE_TILES.window,{3:'2112302300321112',5:'2112302300321112',7:'2112302300321112',9:'2112302300321112',11:'2112302300321112'}),
  arch: variant(BASE_TILES.window,{1:'2111112222111112',2:'2111220000221112',3:'2112300000321112',6:'2112300000321112'}),
  column: variant(BASE_TILES.brick,{1:'2111123332211112',3:'2111123232211112',4:'2111123232211112',5:'2111123232211112',6:'2111123232211112',8:'1111123232211111',9:'1111123232211111',10:'1111123232211111',11:'1111123232211111',12:'1111123232211111',13:'1111123332211111'}),
  rivets: variant(BASE_TILES.brick,{2:'2132111221321112',5:'2123111221231112',10:'1132211111122311',13:'1123211111123211'}),
  bolted: variant(BASE_TILES.beam,{1:'1128222222282211',3:'1122382228322211',9:'1122382228322211',13:'1128222222282211'}),
  elbow: variant(BASE_TILES.pipe,{9:'1111123232222222',10:'1111123333333333',11:'1111122222222222',12:'1111111111111111',13:'1111111111111111',14:'1111111111111111',15:'1111111111111111'}),
  tee: variant(BASE_TILES.pipe,{6:'2222223232222222',7:'3333333333333333',8:'2222222222222222'}),
  cable: variant(BASE_TILES.beam,{0:'1111112821111111',1:'1111112831111111',2:'1111112821111111',3:'1111112821111111',4:'1111112821111111',5:'1111112821111111',6:'1111112821111111',7:'1111112821111111',8:'1111112821111111',9:'1111112821111111',10:'1111112821111111',11:'1111112821111111',12:'1111112821111111',13:'1111112831111111',14:'1111112821111111',15:'1111112821111111'}),
  mesh: variant(BASE_TILES.beam,{2:'1121121121122211',4:'1122122122122211',6:'1121121121122211',8:'1122122122122211',10:'1121121121122211',12:'1122122122122211'}),
  valve: variant(BASE_TILES.pipe,{5:'1111128882211111',6:'1111283238221111',7:'1112338383322111',8:'1112288882222111'}),
  moss: variant(BASE_TILES.rock,{1:'11112f3222211111',2:'1112ff2222221111',3:'11222f1222222111',12:'1111222f22221111',13:'1111221ff1221111'}),
  fissure: variant(BASE_TILES.cave,{2:'1122211222021111',3:'1222222220021111',4:'1221222200122211',5:'1121122001122221',6:'1111110011121221',7:'1111100111111121',8:'1111102221111111',9:'1111002222111111'}),
  stalactite: variant(BASE_TILES.rock,{0:'2222222222222222',1:'1222232222222211',2:'1122232222222111',3:'1112232222221111',4:'1111222222211111',5:'1111221222211111',6:'1111121222111111',7:'1111121222111111',8:'1111112221111111',9:'1111112211111111',10:'1111112111111111',11:'1111111111111111',12:'1111111111111111',13:'1111111111111111',14:'1111111111111111',15:'1111111111111111'}),
  pebbles: variant(BASE_TILES.cave,{1:'1122111111122111',2:'1232211111232211',3:'1222211111222211',4:'1111111111111111',8:'1111111221111111',9:'1111112322111111',10:'1111112222111111'}),
  pocket: variant(BASE_TILES.rock,{3:'1122220002222111',4:'1122200000222111',5:'1122000000022111',6:'1122000000022111',7:'1122200000222111',8:'1111220002211111'}),
  roots: variant(BASE_TILES.cave,{1:'1111112f22211111',2:'1122212f22221111',3:'1222222f22f21111',4:'122122f221f22211',5:'112112f211ff2221',6:'11111ff11112f221',7:'11111f1111111121'}),
  circuit: variant(BASE_TILES.glyph,{3:'1112211aa1122111',4:'112211a99a112211',5:'112112a22a211211',6:'112112a11a211211',7:'112112aaaa211211',8:'1121122222211211'}),
  gate: variant(BASE_TILES.pillars,{0:'11222dddddd22211',1:'11232d1111d23211',2:'11232d1111d23211',3:'11222d1111d22211',7:'1122111111112211',8:'1122111111112211',9:'1122111111112211'}),
  inlay: variant(BASE_TILES.glyph,{2:'1111221aa1221111',3:'111221a22a122111',4:'112211a22a112211',9:'112211a22a112211',10:'111221a22a122111',11:'1111221aa1221111'}),
  crystal: variant(BASE_TILES.glyph,{4:'1122111d21112211',5:'112111dd32111211',6:'112112dd33211211',7:'1121122d33211211',8:'1121112332111211',9:'1122111221112211'}),
  chevrons: variant(BASE_TILES.pillars,{4:'112211a11a112211',5:'1122111aa1112211',6:'1122111111112211',7:'112211a11a112211',8:'1122111aa1112211',9:'1122111111112211'}),
  buried: variant(BASE_TILES.glyph,{10:'1122221221222211',11:'1222222222222221',12:'2222232222222222',13:'2222222222222222',14:'2222222222322222',15:'2222222222222222'}),
} as const;
export type TileId = keyof typeof TILES | keyof typeof MORE_TILES;
export const TILE_FRAMES: Readonly<Record<TileId, Pixels>> = { ...BASE_TILES, ...MORE_TILES };
export const BIOME_TILES: Readonly<Record<BiomeArt, readonly TileId[]>> = {
  tower: ['brick', 'window','ashlar','chipped','grate','arch','column','rivets'],
  works: ['beam', 'pipe','bolted','elbow','tee','cable','mesh','valve'],
  cave: ['cave', 'rock','moss','fissure','stalactite','pebbles','pocket','roots'],
  strange: ['glyph', 'pillars','circuit','gate','inlay','crystal','chevrons','buried'],
};

export const PLATFORM_FRAMES: Readonly<Record<PlatformArtType, readonly Pixels[]>> = {
  normal: [grid(['5555555555555555','4444444444444444','3333333233333333','3223333233223333','3222222223222223','2222222222222222','0222202222220220','0000000000000000'],16,8)],
  soft: [grid(['dd5d5d5d5d5d5ddd','.dddddddddddddd.','dddddddddddddddd','dcdcdcdcdcdcdcdc','cccccccccccccccc','.cccccccccccccc.','..aaaaaaaaaaaa..','..000000000000..'],16,8), grid(['dd5d5d5d5d5d5ddd','dddddddddddddddd','dcdcdcdcdcdcdcdc','cccccccccccccccc','.cccccccccccccc.','..aaaaaaaaaaaa..','..000000000000..','................'],16,8)],
  crumble: [grid(['5555505555555555','4444044440444444','3330333333033333','3303333333303333','2220022222202222','2222202222220222','0222220022222020','0000000000000000'],16,8),grid(['5555005555550555','4440044440044444','3300333333003333','3303333033303333','2220022022002222','2222200222220222','0222220022200020','0000000000000000'],16,8),grid(['5500..055500..55','440...044400..44','330...033300..33','33....033300..33','22....00220...22','22.....0222...22','02......220...20','00......000...00'],16,8)],
  moving: [grid(['7777777777777777','8887778877788777','7778887788877888','8888888888888888','2222222222222222','2322222222222232','0222200000022220','0000000000000000'],16,8),grid(['7777777777777777','7887778877788778','8778887788877887','8888888888888888','2222222222222222','2322222222222232','0222200000022220','0000000000000000'],16,8)],
};

const spriteCache = new Map<string,HTMLCanvasElement>();
function paint(ctx: CanvasRenderingContext2D, pixels: Pixels, x: number, y: number): void {
  if (typeof document !== 'undefined') {
    const key=pixels.join('|');let cached=spriteCache.get(key);
    if (!cached) {
      cached=document.createElement('canvas');cached.width=pixels[0].length;cached.height=pixels.length;
      const native=cached.getContext('2d');if(native)paintRows(native,pixels,0,0);
      spriteCache.set(key,cached);
    }
    ctx.imageSmoothingEnabled=false;ctx.drawImage(cached,Math.round(x),Math.round(y));return;
  }
  paintRows(ctx,pixels,x,y);
}
function paintRows(ctx: CanvasRenderingContext2D, pixels: Pixels, x: number, y: number): void {
  const px = Math.round(x), py = Math.round(y);
  for (let row = 0; row < pixels.length; row++) {
    const line = pixels[row];
    for (let col = 0; col < line.length;) {
      const token = line[col]; let end = col + 1;
      while (end < line.length && line[end] === token) end++;
      if (token !== '.') { ctx.fillStyle = PALETTE[token as PixelColor]; ctx.fillRect(px + col, py + row, end - col, 1); }
      col = end;
    }
  }
}

export function drawKing(ctx: CanvasRenderingContext2D, x: number, y: number,
  options: { state: KingState; frame?: number; facing?: -1 | 1; ghost?: boolean }): void {
  const frames = KING_FRAMES[options.state];
  const frame = frames[Math.abs(Math.floor(options.frame ?? 0)) % frames.length];
  ctx.save(); ctx.imageSmoothingEnabled = false;
  if (options.ghost) ctx.globalAlpha *= 0.45;
  paint(ctx, options.facing === -1 && options.state !== 'left' && options.state !== 'right' ? mirror(frame) : frame, x, y);
  ctx.restore();
}

export function drawTile(ctx: CanvasRenderingContext2D, id: TileId, x: number, y: number): void {
  paint(ctx, TILE_FRAMES[id], x, y);
}

/** The visible top is exactly y; no artwork overhang extends the collision width. */
export function drawPlatform(ctx: CanvasRenderingContext2D,
  options: { x: number; y: number; width: number; height?: number; type: PlatformArtType; phase?: number }): void {
  const x = Math.round(options.x), y = Math.round(options.y), width = Math.max(1,Math.round(options.width));
  const height = Math.max(1,Math.round(options.height ?? 8));
  const frames = PLATFORM_FRAMES[options.type]; const phase = Math.max(0, Math.floor(options.phase ?? 0));
  const pixels = frames[Math.min(phase, frames.length - 1)];
  ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();
  for (let dx = 0; dx < width; dx += 16) paint(ctx,pixels,x+dx,y);
  if (height > 8) {ctx.fillStyle=PALETTE['0'];ctx.fillRect(x,y+8,width,height-8);}
  // End caps stay inside physical geometry, preserving honest platform width.
  ctx.fillStyle=PALETTE['0'];ctx.fillRect(x,y+Math.min(2,height-1),1,Math.max(1,height-2));
  ctx.fillRect(x+width-1,y+Math.min(2,height-1),1,Math.max(1,height-2));ctx.restore();
}

/** Quiet, noncolliding distant tiles; high-contrast platforms are drawn separately. */
export function drawBackdrop(ctx: CanvasRenderingContext2D, biome: BiomeArt,
  options: { width?: number; height?: number; scrollY?: number } = {}): void {
  const width=options.width??NATIVE_WIDTH,height=options.height??NATIVE_HEIGHT;
  const scroll=Math.floor((options.scrollY??0)/4),offset=((scroll%16)+16)%16;
  const firstRow=Math.floor(scroll/16);
  const tiles=BIOME_TILES[biome];
  ctx.fillStyle=PALETTE['1'];ctx.fillRect(0,0,width,height);
  for(let y=-offset,row=0;y<height;y+=16,row++) {
    for(let x=0,col=0;x<width;x+=16,col++) {
      const edge=col===0||x+16>=width;
      const worldRow=row+firstRow;
      const nearWall=col<3||x+48>=width;
      // Keep the 160px central shaft clear: detail belongs to the distant side walls.
      if (!nearWall) continue;
      const accent=nearWall&&((worldRow*3+col)%19+19)%19===0;
      const id=edge||accent?tiles[((worldRow+col)%7+7)%7+1]:tiles[0];
      drawTile(ctx,id,x,y);
    }
  }
}

const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  A:['01110','10001','10001','11111','10001','10001','10001'], B:['11110','10001','10001','11110','10001','10001','11110'],
  C:['01111','10000','10000','10000','10000','10000','01111'], D:['11110','10001','10001','10001','10001','10001','11110'],
  E:['11111','10000','10000','11110','10000','10000','11111'], F:['11111','10000','10000','11110','10000','10000','10000'],
  G:['01111','10000','10000','10111','10001','10001','01111'], H:['10001','10001','10001','11111','10001','10001','10001'],
  I:['11111','00100','00100','00100','00100','00100','11111'], J:['00111','00010','00010','00010','10010','10010','01100'],
  K:['10001','10010','10100','11000','10100','10010','10001'], L:['10000','10000','10000','10000','10000','10000','11111'],
  M:['10001','11011','10101','10101','10001','10001','10001'], N:['10001','11001','10101','10011','10001','10001','10001'],
  O:['01110','10001','10001','10001','10001','10001','01110'], P:['11110','10001','10001','11110','10000','10000','10000'],
  Q:['01110','10001','10001','10001','10101','10010','01101'], R:['11110','10001','10001','11110','10100','10010','10001'],
  S:['01111','10000','10000','01110','00001','00001','11110'], T:['11111','00100','00100','00100','00100','00100','00100'],
  U:['10001','10001','10001','10001','10001','10001','01110'], V:['10001','10001','10001','10001','10001','01010','00100'],
  W:['10001','10001','10001','10101','10101','10101','01010'], X:['10001','10001','01010','00100','01010','10001','10001'],
  Y:['10001','10001','01010','00100','00100','00100','00100'], Z:['11111','00001','00010','00100','01000','10000','11111'],
  '0':['01110','10001','10011','10101','11001','10001','01110'], '1':['00100','01100','00100','00100','00100','00100','01110'],
  '2':['01110','10001','00001','00010','00100','01000','11111'], '3':['11110','00001','00001','01110','00001','00001','11110'],
  '4':['00010','00110','01010','10010','11111','00010','00010'], '5':['11111','10000','10000','11110','00001','00001','11110'],
  '6':['01110','10000','10000','11110','10001','10001','01110'], '7':['11111','00001','00010','00100','01000','01000','01000'],
  '8':['01110','10001','10001','01110','10001','10001','01110'], '9':['01110','10001','10001','01111','00001','00001','01110'],
  '.':['00000','00000','00000','00000','00000','00110','00110'], ',':['00000','00000','00000','00000','00110','00110','00100'],
  ':':['00000','00110','00110','00000','00110','00110','00000'], '!':['00100','00100','00100','00100','00100','00000','00100'],
  '?':['01110','10001','00001','00010','00100','00000','00100'], '-':['00000','00000','00000','11111','00000','00000','00000'],
  '+':['00000','00100','00100','11111','00100','00100','00000'], '/':['00001','00001','00010','00100','01000','10000','10000'],
  '×':['00000','10001','01010','00100','01010','10001','00000'], '%':['11001','11010','00100','00100','01000','10110','00110'],
  '<':['00010','00100','01000','10000','01000','00100','00010'], '>':['01000','00100','00010','00001','00010','00100','01000'],
  '↓':['00100','00100','00100','10101','01110','00100','00000'], '★':['00100','00100','11111','01110','01010','10001','00000'],
  m:['00000','00000','11010','10101','10101','10101','10101'],
};
export const BITMAP_GLYPHS = GLYPHS;
export function measureBitmapText(text: string, scale = 1): number {
  const size=Math.max(1,Math.floor(scale));
  return Math.max(0,[...text].reduce((width,char)=>width+(char===' '?4:6),0)-1)*size;
}
export function drawBitmapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  options: { color?: string; scale?: number; align?: 'left'|'center'|'right' } = {}): void {
  const scale=Math.max(1,Math.floor(options.scale??1)), width=measureBitmapText(text,scale);
  let px=Math.round(x)-(options.align==='center'?Math.floor(width/2):options.align==='right'?width:0);
  const py=Math.round(y);ctx.save();ctx.fillStyle=options.color??PALETTE['5'];
  for(const original of text) {
    const char=original==='m'?'m':original.toUpperCase();
    if(char===' '){px+=4*scale;continue;}
    const glyph=GLYPHS[char]??GLYPHS['?'];
    glyph.forEach((row,dy)=>{for(let dx=0;dx<row.length;dx++)if(row[dx]==='1')ctx.fillRect(px+dx*scale,py+dy*scale,scale,scale);});
    px+=6*scale;
  }
  ctx.restore();
}

/** Floor teeth are contained by the model's actual hazardous rectangle. */
export function drawSpikeFloor(ctx: CanvasRenderingContext2D, options: { x: number; y: number; width: number; height: number }): void {
  const x = Math.round(options.x), y = Math.round(options.y), width = Math.max(1, Math.round(options.width)), height = Math.max(1, Math.round(options.height));
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip();
  ctx.fillStyle = PALETTE['0']; ctx.fillRect(x, y + height - 3, width, 3);
  ctx.fillStyle = PALETTE.b; ctx.fillRect(x, y + height - 2, width, 2);
  const tooth = 10;
  for (let dx = 0; dx < width; dx += tooth) {
    for (let row = 0; row < height - 2; row++) {
      const half = Math.min(4, Math.floor(row * 5 / Math.max(1, height - 2)));
      ctx.fillStyle = PALETTE['0']; ctx.fillRect(x + dx + 4 - half, y + row, half * 2 + 3, 1);
      ctx.fillStyle = row < 2 ? PALETTE['5'] : PALETTE.b; ctx.fillRect(x + dx + 5 - half, y + row, half * 2 + 1, 1);
    }
  }
  ctx.restore();
}

/** A permanently visible socket precedes the model's warning and active needle. */
export function drawWallNeedle(ctx: CanvasRenderingContext2D, options: { x: number; y: number; width: number; height: number; side: 'left' | 'right'; state: 'idle' | 'warning' | 'active'; reach: number; frame?: number }): void {
  const x = Math.round(options.x), y = Math.round(options.y), width = Math.round(options.width), height = Math.round(options.height), left = options.side === 'left';
  const socketX = left ? 0 : NATIVE_WIDTH - 8;
  ctx.fillStyle = PALETTE['0']; ctx.fillRect(socketX, y - 3, 8, height + 6);
  ctx.fillStyle = PALETTE['3']; ctx.fillRect(socketX + 1, y - 2, 6, height + 4);
  ctx.fillStyle = PALETTE['0']; ctx.fillRect(socketX + 2, y, 4, height);
  const warning = options.state === 'warning';
  ctx.fillStyle = warning ? (Math.floor(options.frame ?? 0) % 2 ? PALETTE['5'] : PALETTE['7']) : options.state === 'active' ? PALETTE.b : PALETTE['4'];
  ctx.fillRect(socketX + 2, y - 2, 4, 2); ctx.fillRect(socketX + 2, y + height, 4, 2);
  if (warning) {
    const mid = y + Math.floor(height / 2);
    ctx.fillStyle = PALETTE['7'];
    for (let d = 10; d < options.reach; d += 6) ctx.fillRect(left ? d : NATIVE_WIDTH - d - 3, mid, 3, 1);
    // An angular caution marker stays beside the socket, away from the king's safe bay.
    ctx.fillRect(left ? 10 : NATIVE_WIDTH - 12, y - 7, 2, 3);
    ctx.fillRect(left ? 10 : NATIVE_WIDTH - 12, y - 3, 2, 1);
  }
  if (options.state !== 'active' || width <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip();
  // Four outward-facing teeth fill the tall collision envelope; no hidden empty shaft.
  const count = Math.max(1, Math.round(height / 11)), toothHeight = Math.floor(height / count);
  for (let i = 0; i < count; i++) {
    const mid = y + i * toothHeight + Math.floor(toothHeight / 2);
    for (let distance = 0; distance < width; distance++) {
      const half = Math.max(0, Math.floor((1 - distance / Math.max(1, width - 1)) * toothHeight / 2));
      const column = left ? x + distance : x + width - distance - 1;
      ctx.fillStyle = PALETTE['0']; ctx.fillRect(column, mid - half, 1, half * 2 + 1);
      ctx.fillStyle = PALETTE.b; if (half) ctx.fillRect(column, mid - half + 1, 1, half * 2 - 1);
      ctx.fillStyle = PALETTE['5']; ctx.fillRect(column, mid - half, 1, 1);
    }
  }
  ctx.restore();
}

const BIRD_BASE = grid([
  '........................', '........................', '.....0............0.....', '....0b0..........0b0....',
  '...0bb0..........0bb0...', '..0bbb0..........0bbb0..', '.0bbbb00........00bbbb0.', '..0bbbb0000000000bbbb0..',
  '...0bbbbbbbbbb5bbbbbb0..', '....0bbbbbbbbb05bbb0....', '.....0bbbbbbbbb7770.....', '......0bbbbbbbb770......',
  '.......0000000000.......', '.........0....0.........', '..........0..0..........', '........................',
], 24, 16);
export const BIRD_FRAMES: readonly Pixels[] = [BIRD_BASE,
  variant(BIRD_BASE, { 2: '........................', 3: '........................', 4: '........................', 5: '........................', 6: '........................', 7: '...000000000000000000...', 8: '..0bbbbbbbbbbb5bbbbbb0..', 9: '.0bbbbbbbbbbbb05bbbbbb0.', 10: '..0bbbbbbbbbbbb777bbb0..', 11: '...000bbbbbbbbb770000...', 12: '......00000000000.......' }),
  variant(BIRD_BASE, { 2: '........................', 3: '........................', 4: '........................', 5: '........................', 6: '........................', 7: '.....00000000000000.....', 8: '....0bbbbbbbbb5bbbb0....', 9: '...0bbbbbbbbbb05bbbb0...', 10: '..0bbbbbbbbbbbb777bbb0..', 11: '.0bbbb0bbbbbbbb770bbbb0.', 12: '..0bbb0000000000bbb0....', 13: '...0bb0..0....0..0bb0...', 14: '....0b0...0..0...0b0....', 15: '.....0............0.....' }),
];
const birdPixels = new Map<string, Pixels>();
export function drawBird(ctx: CanvasRenderingContext2D, options: { x: number; y: number; width: number; height: number; frame: number; facing: -1 | 1 }): void {
  const source = BIRD_FRAMES[Math.floor(options.frame) % BIRD_FRAMES.length];
  const frame = options.facing === -1 ? mirror(source) : source;
  const width = Math.max(1, Math.round(options.width)), height = Math.max(1, Math.round(options.height));
  // Authored pixels are nearest-mapped into the exact model envelope, not rotated or stretched with smoothing.
  const key = `${width}/${height}/${Math.floor(options.frame) % BIRD_FRAMES.length}/${options.facing}`;
  let pixels = birdPixels.get(key);
  if (!pixels) { pixels = grid(Array.from({ length: height }, (_, row) => Array.from({ length: width }, (_, col) => frame[Math.floor(row * 16 / height)][Math.floor(col * 24 / width)]).join('')), width, height); birdPixels.set(key, pixels); }
  paint(ctx, pixels, options.x, options.y);
}
