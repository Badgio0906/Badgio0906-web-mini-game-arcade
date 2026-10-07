export const TABLE = { halfWidth: .5, halfLength: 1, netHeight: .14, racketY: .86, racketRadius: .145, gravity: 2.8 };
export const opposite = (s) => s === 0 ? 1 : 0;
export const sideAt = (y) => y >= 0 ? 0 : 1;
const sign = (s) => s === 0 ? 1 : -1;
export function serverFor(scores, mode, first) {
    const total = scores[0] + scores[1];
    const turn = mode === 11 && scores[0] >= 10 && scores[1] >= 10 ? total - 20 : Math.floor(total / 2);
    return turn % 2 === 0 ? first : opposite(first);
}
export function matchWinner(scores, mode) { if (Math.max(...scores) < mode)
    return null; if (mode === 11 && Math.abs(scores[0] - scores[1]) < 2)
    return null; return scores[0] > scores[1] ? 0 : 1; }
export function createMatch(mode = 11, difficulty = 'easy', practice = false, seed = 28) {
    return { mode, difficulty, practice, scores: [0, 0], firstServer: 0, rally: { id: 1, ball: null, status: 'ready', server: 0, winner: null, reason: '', returns: 0, scored: false }, paddles: [0, 0], maxRally: 0, points: 0, clock: 0, seed: seed >>> 0, cpu: { elapsed: 0, target: 0, rallyId: 1 } };
}
export function nextRally(m) { if (m.rally.status === 'over')
    return; const id = m.rally.id + 1; const server = m.practice ? 0 : serverFor(m.scores, m.mode, m.firstServer); m.rally = { id, ball: null, status: 'ready', server, winner: null, reason: '', returns: 0, scored: false }; m.cpu = { elapsed: 0, target: 0, rallyId: id }; }
export function serve(m) {
    if (m.rally.status !== 'ready' && m.rally.status !== 'let')
        return false;
    const s = m.rally.server;
    m.rally.ball = { x: m.paddles[s], y: sign(s) * .84, z: .27, vx: 0, vy: -sign(s) * 1.38, vz: -1, lastHit: s, expected: opposite(s), bounces: 0, serve: true, stage: 0, netTouched: false };
    m.rally.status = 'live';
    m.rally.reason = '';
    m.rally.scored = false;
    return true;
}
export function award(m, winner, reason) {
    if (m.rally.scored || m.rally.status !== 'live')
        return;
    m.rally.scored = true;
    m.rally.winner = winner;
    m.rally.reason = reason;
    m.maxRally = Math.max(m.maxRally, m.rally.returns);
    if (!m.practice) {
        m.scores[winner]++;
        m.points++;
    }
    m.rally.status = !m.practice && matchWinner(m.scores, m.mode) !== null ? 'over' : 'point';
}
export function tableBounce(m, side) {
    const b = m.rally.ball;
    if (!b || m.rally.status !== 'live')
        return;
    if (b.serve && b.stage === 0) {
        if (side !== b.lastHit) {
            award(m, opposite(b.lastHit), 'サーブが自陣にバウンドしませんでした');
            return;
        }
        b.stage = 1;
        return;
    }
    if (side !== b.expected) {
        award(m, opposite(b.lastHit), '相手側に届きませんでした');
        return;
    }
    if (b.serve && b.netTouched) {
        m.rally.status = 'let';
        m.rally.reason = 'ネットに触れた正しいサーブ · もう1回';
        m.rally.ball = null;
        return;
    }
    b.stage = 2;
    b.bounces++;
    if (b.bounces >= 2)
        award(m, b.lastHit, '2回バウンドしました');
}
export function hit(m, side) {
    const b = m.rally.ball;
    if (!b || m.rally.status !== 'live' || b.expected !== side || b.bounces !== 1 || b.z > .6 || Math.abs(b.y - sign(side) * TABLE.racketY) > .075 || Math.abs(b.x - m.paddles[side]) > TABLE.racketRadius)
        return false;
    const offset = (b.x - m.paddles[side]) / TABLE.racketRadius;
    b.vx = offset * .53;
    b.vy = -sign(side) * 1.62;
    b.vz = 1.08;
    b.y = sign(side) * TABLE.racketY;
    b.lastHit = side;
    b.expected = opposite(side);
    b.bounces = 0;
    b.serve = false;
    b.stage = 1;
    b.netTouched = false;
    m.rally.returns++;
    m.maxRally = Math.max(m.maxRally, m.rally.returns);
    return true;
}
export function movePaddle(m, side, x) { if (Number.isFinite(x))
    m.paddles[side] = Math.max(-.46, Math.min(.46, x)); }
function random(m) { m.seed = (1664525 * m.seed + 1013904223) >>> 0; return m.seed / 4294967296; }
/** CPU observes current horizontal position only at delayed intervals; no future intersection oracle. */
export function cpuStep(m, dt) {
    if (m.cpu.rallyId !== m.rally.id)
        return;
    const settings = { easy: { delay: .2, speed: .68, error: .09 }, normal: { delay: .13, speed: .92, error: .055 }, hard: { delay: .08, speed: 1.3, error: .025 } }[m.difficulty];
    m.cpu.elapsed += dt;
    if (m.cpu.elapsed >= settings.delay) {
        m.cpu.elapsed = 0;
        const b = m.rally.ball;
        if (b && b.expected === 1)
            m.cpu.target = Math.max(-.46, Math.min(.46, b.x + (random(m) - .5) * settings.error * 2));
    }
    const delta = m.cpu.target - m.paddles[1];
    movePaddle(m, 1, m.paddles[1] + Math.sign(delta) * Math.min(Math.abs(delta), settings.speed * dt));
}
/** Caller supplies fixed 1/120 second steps; net/table contacts resolved at swept crossing fractions. */
export function step(m, dt) {
    if (m.rally.status !== 'live')
        return;
    const b = m.rally.ball;
    if (!b)
        return;
    m.clock += dt;
    cpuStep(m, dt);
    let remaining = dt;
    for (let n = 0; n < 4 && remaining > 1e-8 && m.rally.status === 'live'; n++) {
        const oldY = b.y;
        const netTime = b.vy !== 0 ? -oldY / b.vy : Infinity;
        const discriminant = b.vz * b.vz + 2 * TABLE.gravity * b.z;
        const groundTime = (b.vz + Math.sqrt(Math.max(0, discriminant))) / TABLE.gravity;
        const t = Math.min(remaining, netTime > 1e-7 ? netTime : Infinity, groundTime > 1e-7 ? groundTime : Infinity);
        b.x += b.vx * t;
        b.y += b.vy * t;
        b.z += b.vz * t - .5 * TABLE.gravity * t * t;
        b.vz -= TABLE.gravity * t;
        remaining -= t;
        if (t === netTime) {
            if (b.z <= TABLE.netHeight) {
                if (b.z < TABLE.netHeight * .68) {
                    award(m, opposite(b.lastHit), 'ネットに届きませんでした');
                    return;
                }
                b.netTouched = true;
                b.vy *= .73;
                b.z = TABLE.netHeight + .002;
                b.vz = Math.max(b.vz, .32);
            }
            b.y = Math.sign(b.vy) * .00001;
        }
        if (t === groundTime) {
            if (b.z <= 1e-7) {
                b.z = 0;
                if (Math.abs(b.x) <= TABLE.halfWidth && Math.abs(b.y) <= TABLE.halfLength) {
                    tableBounce(m, sideAt(b.y));
                    b.vz = Math.max(.85, -b.vz * .74);
                }
                else {
                    award(m, b.bounces >= 1 ? b.lastHit : opposite(b.lastHit), '台の外へ出ました');
                    return;
                }
            }
        }
        if (m.rally.status !== 'live')
            return;
        if (b.bounces === 1 && Math.abs(b.y) >= TABLE.racketY - .025 && Math.abs(b.y) <= TABLE.racketY + .05)
            hit(m, b.expected);
        if (Math.abs(b.x) > .6 || Math.abs(b.y) > 1.18) {
            award(m, b.bounces >= 1 ? b.lastHit : opposite(b.lastHit), '台の外へ出ました');
            return;
        }
    }
}
