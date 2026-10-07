export type Group = 'solid' | 'stripe';
export type Player = 0 | 1;
export interface Match {
    turn: Player;
    groups: [
        Group | null,
        Group | null
    ];
    break: boolean;
    winner: Player | null;
    ballInHand: boolean;
    shots: [
        number,
        number
    ];
    fouls: [
        number,
        number
    ];
}
export interface Shot {
    shooter: Player;
    break: boolean;
    legalTargets: number[];
    firstContact: number | null;
    railAfterContact: boolean;
    pocketed: number[];
}
export interface Decision {
    match: Match;
    foul: string | null;
    respotEight: boolean;
    assigned: Group | null;
    reason: string;
}
export const groupOf = (id: number): Group | null => id >= 1 && id <= 7 ? 'solid' : id >= 9 && id <= 15 ? 'stripe' : null;
export const other = (p: Player): Player => p === 0 ? 1 : 0;
export function newMatch(): Match { return { turn: 0, groups: [null, null], break: true, winner: null, ballInHand: false, shots: [0, 0], fouls: [0, 0] }; }
export function legalTargets(match: Match, live: number[]): number[] {
    if (match.break)
        return live.filter(n => n !== 0);
    const group = match.groups[match.turn];
    if (!group)
        return live.filter(n => groupOf(n) !== null);
    const own = live.filter(n => groupOf(n) === group);
    return own.length ? own : live.includes(8) ? [8] : [];
}
export function beginShot(match: Match, live: number[]): Shot { return { shooter: match.turn, break: match.break, legalTargets: legalTargets(match, live), firstContact: null, railAfterContact: false, pocketed: [] }; }
/** Evaluate the complete shot, never intermediate pocket events. Pocket ordering has no effect. */
export function adjudicate(before: Match, shot: Shot): Decision {
    const match = structuredClone(before), shooter = shot.shooter, opponent = other(shooter);
    const pockets = [...new Set(shot.pocketed)].sort((a, b) => a - b);
    const objectPockets = pockets.filter(n => n !== 0);
    let foul: string | null = null;
    if (pockets.includes(0))
        foul = '白球スクラッチ';
    else if (shot.firstContact === null)
        foul = 'どの球にも当たりませんでした';
    else if (!shot.legalTargets.includes(shot.firstContact))
        foul = '最初の接触が合法な球ではありません';
    else if (!objectPockets.length && !shot.railAfterContact)
        foul = '接触後に入球もクッションもありません';
    match.shots[shooter]++;
    match.break = false;
    match.ballInHand = false;
    if (foul)
        match.fouls[shooter]++;
    if (pockets.includes(8) && !shot.break) {
        const legalEight = shot.legalTargets.length === 1 && shot.legalTargets[0] === 8;
        match.winner = legalEight && !foul ? shooter : opponent;
        return { match, foul, respotEight: false, assigned: null, reason: match.winner === shooter ? '8番を入れて勝利！' : foul ? '8番入球時のファウルで敗北' : '8番がまだ早かったため敗北' };
    }
    let assigned: Group | null = null;
    if (!foul && !shot.break && !match.groups[shooter]) {
        assigned = objectPockets.map(groupOf).find(g => g !== null) ?? null;
        if (assigned) {
            match.groups[shooter] = assigned;
            match.groups[opponent] = assigned === 'solid' ? 'stripe' : 'solid';
        }
    }
    const successful = !foul && (shot.break ? objectPockets.length > 0 : objectPockets.some(n => groupOf(n) === match.groups[shooter]));
    if (foul) {
        match.turn = opponent;
        match.ballInHand = true;
    }
    else if (!successful)
        match.turn = opponent;
    return { match, foul, respotEight: shot.break && pockets.includes(8), assigned, reason: foul ? `${foul} · 相手が白球を置きます` : successful ? '入球 · もう一球どうぞ' : '手番が交代しました' };
}

/** Stable ASCII analysis codes; Japanese UI text never widens the shared privacy filter. */
export function foulCode(label:string|null):string { return label === '白球スクラッチ' ? 'scratch' : label === 'どの球にも当たりませんでした' ? 'no_contact' : label === '最初の接触が合法な球ではありません' ? 'wrong_first' : label === '接触後に入球もクッションもありません' ? 'no_rail' : 'none'; }
