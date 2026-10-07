import { legalTargets, type Match } from './rules';
import { POCKETS, type World, legalPlacement } from './physics';
export type Difficulty = 'easy' | 'normal' | 'strong';
export function cpuPlacement(world: World): {
    x: number;
    y: number;
} {
    for (let x = 180; x <= 800; x += 30)
        for (let y = 45; y <= 400; y += 30)
            if (legalPlacement(world, x, y))
                return { x, y };
    return { x: 225, y: 225 };
}
/** Approximate cut-ball aiming with bounded noise; independent from rule adjudication. */
export function chooseShot(world: World, match: Match, level: Difficulty, rng = Math.random): {
    angle: number;
    power: number;
} {
    const cue = world.balls.find(b => b.id === 0)!;
    if (match.break)
        return { angle: 0 + (rng() - .5) * .018, power: .85 };
    const targets = legalTargets(match, world.balls.filter(b => !b.pocketed).map(b => b.id));
    const choices = world.balls.filter(b => targets.includes(b.id)).flatMap(b => POCKETS.map(p => {
        const length = Math.hypot(p.x - b.x, p.y - b.y), gx = b.x - (p.x - b.x) / length * 24, gy = b.y - (p.y - b.y) / length * 24;
        return { angle: Math.atan2(gy - cue.y, gx - cue.x), distance: Math.hypot(gx - cue.x, gy - cue.y) + length, blocked: world.balls.some(o => !o.pocketed && o.id !== 0 && o.id !== b.id && Math.hypot(o.x - gx, o.y - gy) < 28) };
    })).filter(c => !c.blocked).sort((a, b) => a.distance - b.distance);
    const choice = choices[Math.floor(rng() * Math.min(choices.length, level === 'strong' ? 1 : level === 'normal' ? 3 : 6))];
    const spread = level === 'strong' ? .025 : level === 'normal' ? .08 : .2;
    return { angle: (choice?.angle ?? 0) + (rng() - .5) * spread, power: Math.max(.22, Math.min(.82, (choice?.distance ?? 600) / 1500 + .18 + (rng() - .5) * spread)) };
}
