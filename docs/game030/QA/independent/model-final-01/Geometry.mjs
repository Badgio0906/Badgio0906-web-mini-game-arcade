export const WORLD = { width: 600, height: 500 };
export const CLEARANCE = 25; // Covers the drawn axis-aligned plug incl. stroke (max22.5), and cable half-width3, with buffer.
export const EPS = 1e-7;
export const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
export const length = (points) => points.slice(1).reduce((n, p, i) => n + distance(points[i], p), 0);
export function inside(p, pad = CLEARANCE) { return Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= pad && p.x <= WORLD.width - pad && p.y >= pad && p.y <= WORLD.height - pad; }
export function project(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, sq = dx * dx + dy * dy;
    const t = sq ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / sq)) : 0;
    const point = { x: a.x + dx * t, y: a.y + dy * t };
    return { point, t, distance: distance(p, point) };
}
/** Closed-rectangle slab intersection on the complete swept center segment. */
export function hitsRect(a, b, r, pad = CLEARANCE) {
    let low = 0, high = 1;
    for (const [start, delta, min, max] of [[a.x, b.x - a.x, r.x - pad, r.x + r.w + pad], [a.y, b.y - a.y, r.y - pad, r.y + r.h + pad]]) {
        if (Math.abs(delta) < EPS) {
            if (start < min || start > max)
                return false;
        }
        else {
            const t1 = (min - start) / delta, t2 = (max - start) / delta;
            low = Math.max(low, Math.min(t1, t2));
            high = Math.min(high, Math.max(t1, t2));
            if (low > high + EPS)
                return false;
        }
    }
    return true;
}
export function clearSegment(a, b, obstacles, pad = CLEARANCE) { return inside(a, pad) && inside(b, pad) && !obstacles.some(o => hitsRect(a, b, o, pad)); }
const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
export function intersects(a, b, c, d) {
    const z1 = cross(a, b, c), z2 = cross(a, b, d), z3 = cross(c, d, a), z4 = cross(c, d, b);
    if (((z1 > EPS && z2 < -EPS) || (z1 < -EPS && z2 > EPS)) && ((z3 > EPS && z4 < -EPS) || (z3 < -EPS && z4 > EPS)))
        return true;
    return Math.abs(z1) <= EPS && project(c, a, b).distance <= EPS || Math.abs(z2) <= EPS && project(d, a, b).distance <= EPS || Math.abs(z3) <= EPS && project(a, c, d).distance <= EPS || Math.abs(z4) <= EPS && project(b, c, d).distance <= EPS;
}
export function selfCrosses(points) {
    for (let i = 1; i < points.length; i++)
        for (let j = 1; j < i - 1; j++)
            if (intersects(points[i - 1], points[i], points[j - 1], points[j]))
                return true;
    return false;
}
export function safePath(points, obstacles, budget) {
    return points.length >= 1 && points.length <= 4096 && points.every(p => inside(p) && !obstacles.some(o => hitsRect(p, p, o))) && points.slice(1).every((p, i) => distance(points[i], p) > EPS && clearSegment(points[i], p, obstacles)) && !selfCrosses(points) && length(points) <= budget + EPS;
}
/** Remove only nearly collinear interior points; verify the replacement sweep and crossings. */
export function simplify(points, obstacles) {
    if (points.length < 3)
        return points;
    const a = points.at(-3), b = points.at(-2), c = points.at(-1);
    if (project(b, a, c).distance > .4 || distance(a, c) + .05 < distance(a, b) + distance(b, c) || !clearSegment(a, c, obstacles))
        return points;
    const result = [...points.slice(0, -2), c];
    return selfCrosses(result) ? points : result;
}
