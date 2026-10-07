import type { Shot } from './rules';
export const WIDTH = 900, HEIGHT = 450, RADIUS = 12, POCKET = 23, FIXED_DT = 1 / 120;
export const POCKETS = [{ x: 0, y: 0 }, { x: 450, y: 0 }, { x: 900, y: 0 }, { x: 0, y: 450 }, { x: 450, y: 450 }, { x: 900, y: 450 }];
export interface Ball {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    pocketed: boolean;
}
export interface World {
    balls: Ball[];
    shot: Shot | null;
    moving: boolean;
    shotTime: number;
}
export function rack(): World {
    const ids = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 6, 13, 7, 14, 15];
    const balls: Ball[] = [{ id: 0, x: 225, y: 225, vx: 0, vy: 0, pocketed: false }];
    let n = 0;
    for (let row = 0; row < 5; row++)
        for (let j = 0; j <= row; j++)
            balls.push({ id: ids[n++], x: 630 + row * 21.15, y: 225 + (j - row / 2) * 24.42, vx: 0, vy: 0, pocketed: false });
    return { balls, shot: null, moving: false, shotTime: 0 };
}
export function legalPlacement(world: World, x: number, y: number, exclude = 0): boolean {
    return Number.isFinite(x) && Number.isFinite(y) && x >= RADIUS && x <= WIDTH - RADIUS && y >= RADIUS && y <= HEIGHT - RADIUS
        && !POCKETS.some(p => Math.hypot(x - p.x, y - p.y) < POCKET + RADIUS)
        && world.balls.every(b => b.id === exclude || b.pocketed || Math.hypot(x - b.x, y - b.y) >= 2 * RADIUS + .1);
}
export function placeCue(world: World, x: number, y: number): boolean {
    if (world.moving || !legalPlacement(world, x, y))
        return false;
    const cue = world.balls.find(b => b.id === 0)!;
    Object.assign(cue, { x, y, vx: 0, vy: 0, pocketed: false });
    return true;
}
export function respot(world: World, id: number): void {
    const b = world.balls.find(b => b.id === id)!;
    // Deterministic scan around the rack spot; finite 16-ball layout leaves ample free positions.
    const candidates = [{ x: 630, y: 225 }];
    for (let x = 620; x >= 40; x -= 26)
        for (let y = 40; y <= 410; y += 26)
            candidates.push({ x, y });
    const p = candidates.find(p => legalPlacement(world, p.x, p.y, id));
    if (p)
        Object.assign(b, { ...p, vx: 0, vy: 0, pocketed: false });
}
export function shoot(world: World, angle: number, power: number, shot: Shot): boolean {
    const cue = world.balls.find(b => b.id === 0);
    if (world.moving || !cue || cue.pocketed || !Number.isFinite(angle) || !Number.isFinite(power))
        return false;
    const speed = 70 + Math.max(0, Math.min(1, power)) * 1030;
    cue.vx = Math.cos(angle) * speed;
    cue.vy = Math.sin(angle) * speed;
    world.shot = shot;
    world.moving = true;
    world.shotTime = 0;
    return true;
}
function rail(ball: Ball, shot: Shot | null): void {
    // Pocket throats are actual openings. No solid rail bridges the visible pocket mouth.
    const horizontalOpening = Math.abs(ball.x - WIDTH / 2) < 22 || ball.x < 22 || ball.x > WIDTH - 22;
    const verticalOpening = ball.y < 22 || ball.y > HEIGHT - 22;
    let hit = false;
    if (!verticalOpening && ball.x < RADIUS) {
        ball.x = RADIUS;
        if (ball.vx < 0) {
            ball.vx = -ball.vx * .9;
            hit = true;
        }
    }
    if (!verticalOpening && ball.x > WIDTH - RADIUS) {
        ball.x = WIDTH - RADIUS;
        if (ball.vx > 0) {
            ball.vx = -ball.vx * .9;
            hit = true;
        }
    }
    if (!horizontalOpening && ball.y < RADIUS) {
        ball.y = RADIUS;
        if (ball.vy < 0) {
            ball.vy = -ball.vy * .9;
            hit = true;
        }
    }
    if (!horizontalOpening && ball.y > HEIGHT - RADIUS) {
        ball.y = HEIGHT - RADIUS;
        if (ball.vy > 0) {
            ball.vy = -ball.vy * .9;
            hit = true;
        }
    }
    // Bevel/jaw safety: escaped mouth trajectories must enter a pocket or reflect within its throat.
    if (ball.x < -RADIUS || ball.x > WIDTH + RADIUS) {
        ball.x = Math.max(0, Math.min(WIDTH, ball.x));
        ball.vx = -ball.vx * .7;
        hit = true;
    }
    if (ball.y < -RADIUS || ball.y > HEIGHT + RADIUS) {
        ball.y = Math.max(0, Math.min(HEIGHT, ball.y));
        ball.vy = -ball.vy * .7;
        hit = true;
    }
    if (hit && shot?.firstContact !== null && shot)
        shot.railAfterContact = true;
}
function collide(a: Ball, b: Ball, shot: Shot | null): void {
    let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d >= 2 * RADIUS)
        return;
    if (d < 1e-7) {
        dx = 1;
        dy = 0;
        d = 1;
    }
    const nx = dx / d, ny = dy / d, overlap = 2 * RADIUS - d;
    a.x -= nx * (overlap / 2 + .00001);
    a.y -= ny * (overlap / 2 + .00001);
    b.x += nx * (overlap / 2 + .00001);
    b.y += ny * (overlap / 2 + .00001);
    const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (relative < 0) {
        const impulse = -(1 + .97) * relative / 2;
        a.vx -= impulse * nx;
        a.vy -= impulse * ny;
        b.vx += impulse * nx;
        b.vy += impulse * ny;
        if (shot && shot.firstContact === null && (a.id === 0 || b.id === 0))
            shot.firstContact = a.id === 0 ? b.id : a.id;
    }
}
/** Fixed 120 Hz with displacement-bounded substeps prevents a fast ball crossing another circle. */
export function step(world: World, dt = FIXED_DT): boolean {
    if (!world.moving)
        return false;
    const live = world.balls.filter(b => !b.pocketed);
    const max = Math.max(0, ...live.map(b => Math.hypot(b.vx, b.vy)));
    const substeps = Math.max(1, Math.ceil(max * dt / (RADIUS * .35))), h = dt / substeps;
    for (let sub = 0; sub < substeps; sub++) {
        for (const b of live) {
            if (b.pocketed)
                continue;
            b.x += b.vx * h;
            b.y += b.vy * h;
            if (POCKETS.some(p => Math.hypot(b.x - p.x, b.y - p.y) <= POCKET)) {
                b.pocketed = true;
                b.vx = 0;
                b.vy = 0;
                if (world.shot && !world.shot.pocketed.includes(b.id))
                    world.shot.pocketed.push(b.id);
                continue;
            }
            rail(b, world.shot);
        }
        for (let i = 0; i < live.length; i++)
            for (let j = i + 1; j < live.length; j++)
                if (!live[i].pocketed && !live[j].pocketed)
                    collide(live[i], live[j], world.shot);
        for (const b of live) {
            if (b.pocketed)
                continue;
            const speed = Math.hypot(b.vx, b.vy), next = Math.max(0, speed - 135 * h);
            if (next < 3) {
                b.vx = 0;
                b.vy = 0;
            }
            else {
                b.vx *= next / speed;
                b.vy *= next / speed;
            }
        }
    }
    world.shotTime += dt;
    if (!live.some(b => Math.hypot(b.vx, b.vy) > 0) || world.shotTime >= 20) {
        live.forEach(b => { b.vx = 0; b.vy = 0; });
        // Resolve residual contact compression before a resting state can be saved.
        for (let pass = 0; pass < 16; pass++) {
            for (let i = 0; i < live.length; i++)
                for (let j = i + 1; j < live.length; j++)
                    if (!live[i].pocketed && !live[j].pocketed)
                        collide(live[i], live[j], null);
            for (const b of live)
                if (!b.pocketed)
                    rail(b, null);
        }
        world.moving = false;
        return true;
    }
    return false;
}
export function aimEndpoint(world: World, angle: number): {
    x: number;
    y: number;
    target: number | null;
} {
    const cue = world.balls.find(b => b.id === 0)!;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    let distance = Math.hypot(WIDTH, HEIGHT), target: number | null = null;
    for (const b of world.balls) {
        if (b.id === 0 || b.pocketed)
            continue;
        const px = b.x - cue.x, py = b.y - cue.y, along = px * dx + py * dy, across = px * dy - py * dx;
        if (along > 0 && Math.abs(across) < 2 * RADIUS) {
            const t = along - Math.sqrt((2 * RADIUS) ** 2 - across ** 2);
            if (t >= 0 && t < distance) {
                distance = t;
                target = b.id;
            }
        }
    }
    const ballDistance = distance;
    if (dx > 0)
        distance = Math.min(distance, (WIDTH - RADIUS - cue.x) / dx);
    else if (dx < 0)
        distance = Math.min(distance, (RADIUS - cue.x) / dx);
    if (dy > 0)
        distance = Math.min(distance, (HEIGHT - RADIUS - cue.y) / dy);
    else if (dy < 0)
        distance = Math.min(distance, (RADIUS - cue.y) / dy);
    if (distance < ballDistance)
        target = null;
    return { x: cue.x + dx * distance, y: cue.y + dy * distance, target };
}
