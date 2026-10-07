/** The entire field rotates in portrait; this is display only, never a physics resize. */
export function worldToUnit(x: number, y: number, portrait: boolean): {
    u: number;
    v: number;
} {
    return portrait ? { u: (500 - y) / 550, v: (x + 50) / 1000 } : { u: (x + 50) / 1000, v: (y + 50) / 550 };
}
export function unitToWorld(u: number, v: number, portrait: boolean): {
    x: number;
    y: number;
} {
    return portrait ? { x: v * 1000 - 50, y: 500 - u * 550 } : { x: u * 1000 - 50, y: v * 550 - 50 };
}
