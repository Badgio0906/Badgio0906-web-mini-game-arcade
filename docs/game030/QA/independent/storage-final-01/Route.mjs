import { CLEARANCE, EPS, clearSegment, distance, inside, length, project, safePath, selfCrosses, simplify } from './Geometry.mjs';
export const RULES = '1';
export class Route {
    level;
    points;
    cleared = false;
    constructor(level) {
        this.level = level;
        this.points = [{ ...level.start }];
    }
    get plug() { return this.points.at(-1); }
    get used() { return length(this.points); }
    get remaining() { return Math.max(0, this.level.budget - this.used); }
    reset() { this.points = [{ ...this.level.start }]; this.cleared = false; }
    move(to) {
        if (this.cleared)
            return 'same';
        if (!inside(to))
            return 'outside';
        const from = this.plug, travel = distance(from, to);
        if (travel < EPS)
            return 'same';
        if (!clearSegment(from, to, this.level.obstacles))
            return 'wall';
        if (this.points.length >= 2) {
            const prior = this.points.at(-2), back = project(to, prior, from);
            // Only the most recent segment; small finger deviation is projected onto that same segment.
            if (back.distance <= 6 && back.t < 1 - EPS && distance(prior, from) >= distance(prior, to) - EPS) {
                this.points = back.t <= EPS ? this.points.slice(0, -1) : [...this.points.slice(0, -1), back.point];
                return 'backtrack';
            }
        }
        if (this.points.length >= 4096)
            return 'length';
        let target = to, limited = false;
        if (travel > this.remaining + EPS) {
            const t = this.remaining / travel;
            target = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
            limited = true;
        }
        if (distance(from, target) < EPS)
            return 'length';
        let candidate = [...this.points, target];
        if (selfCrosses(candidate))
            return 'crossing';
        candidate = simplify(candidate, this.level.obstacles);
        if (!safePath(candidate, this.level.obstacles, this.level.budget))
            return 'wall';
        this.points = candidate;
        if (!limited && distance(this.plug, this.level.socket) <= 18 && clearSegment(this.plug, this.level.socket, this.level.obstacles) && distance(this.plug, this.level.socket) <= this.remaining + EPS) {
            const connected = distance(this.plug, this.level.socket) > EPS ? [...this.points, { ...this.level.socket }] : this.points;
            if (safePath(connected, this.level.obstacles, this.level.budget)) {
                this.points = connected;
                this.cleared = true;
                return 'clear';
            }
        }
        return limited ? 'length' : 'moved';
    }
    restore(points, cleared) {
        if (!safePath(points, this.level.obstacles, this.level.budget) || distance(points[0], this.level.start) > EPS || cleared && distance(points.at(-1), this.level.socket) > EPS || !cleared && distance(points.at(-1), this.level.socket) < EPS)
            return false;
        this.points = points.map(p => ({ ...p }));
        this.cleared = cleared;
        return true;
    }
    /** Display units are world centimeters, unaffected by CSS dimensions or device pixel ratio. */
    static metres(worldUnits) { return (worldUnits / 100).toFixed(2); }
    get clearance() { return CLEARANCE; }
}
