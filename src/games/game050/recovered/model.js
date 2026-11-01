const x = 1 / 120, H = 36;
function z(e, i, t, o = H) {
  const a = i.x - e.x, s = i.y - e.y, l = e.x - t.x, f = e.y - t.y, d = a * a + s * s;
  if (l * l + f * f <= o * o + 1e-8) return 0;
  if (d < 1e-12) return null;
  const n = 2 * (l * a + f * s), c = l * l + f * f - o * o, h = n * n - 4 * d * c;
  if (h < 0) return null;
  const r = (-n - Math.sqrt(h)) / (2 * d);
  return r >= 0 && r <= 1 ? r : null;
}
function F(e, i = false) {
  const t = e % 2 === 0, o = t ? 120 : 360, a = t ? 360 : 120, s = i ? 0 : e * 7 + 0.5, l = e === 0 || i, f = l ? [160, 240, 320] : [95, 155, 220], d = l ? [180, 260, 340] : [160, 240, 300], n = [];
  for (let c = 0; c < 3; c++) n.push({ id: e * 6 + c, x: o, y: f[c], hp: 1, kind: "paper", vy: l ? 0 : [6.4, 14.4, 32][c], born: s, out: -1, back: -1 });
  for (let c = 0; c < 3; c++) {
    const h = l ? 0 : [8, 16, 32][c], r = d[c], p = o + (a - o) * (r + h * 0.6 - 60) / 360, L = !l && (e + c) % 2 === 0;
    n.push({ id: e * 6 + 3 + c, x: p, y: r, hp: L ? 2 : 1, kind: L ? "armor" : "paper", vy: h, born: s, out: -1, back: -1 });
  }
  return n;
}
function B(e = false) {
  return { ticks: 0, time: 0, x: 120, hp: 3, score: 0, kills: 0, maxKills: 0, sixes: 0, hits: 0, outKills: 0, backKills: 0, wave: 0, enemies: F(0, e), ring: null, nextShot: 1, cooldown: 0, invuln: 0, practice: e, status: "run", notice: "投げた後に動き、帰り道を変えよう", events: [], lastCatch: null };
}
function W(e) {
  return e.status !== "run" || e.ring || e.cooldown > 1e-8 ? false : (e.ring = { id: e.nextShot++, x: e.x, y: 420, leg: "out", life: 0, kills: 0, outKills: 0, backKills: 0 }, e.events.push({ kind: "throw", n: 1, x: e.x, y: 420 }), true);
}
function C(e, i, t, o) {
  const a = e.ring, s = e.enemies.filter((l) => l.hp > 0 && e.time + 1e-8 >= l.born && (o === "out" ? l.out : l.back) !== a.id).map((l) => ({ e: l, u: z(i, t, l) })).filter((l) => l.u !== null).sort((l, f) => l.u - f.u || l.e.id - f.e.id);
  for (const { e: l } of s) o === "out" ? l.out = a.id : l.back = a.id, l.hp = Math.max(0, l.hp - (o === "out" ? 1 : 2)), e.events.push({ kind: "hit", n: o === "back" ? 2 : 1, x: l.x, y: l.y }), l.hp === 0 && (l.defeated = true, a.kills++, e.kills++, o === "out" ? (a.outKills++, e.outKills++) : (a.backKills++, e.backKills++), e.maxKills = Math.max(e.maxKills, a.kills), e.score += Math.floor((l.kind === "armor" ? 200 : 100) * (o === "out" ? 1 : 2) * (10 + Math.min(a.kills - 1, 5)) / 10), e.notice = `往路${a.outKills}＋復路${a.backKills} / ${a.kills}連`, e.events.push({ kind: "kill", n: a.kills, x: l.x, y: l.y }));
}
function U(e, i = 0) {
  if (e.status === "run") {
    e.ticks++, e.time = e.ticks / 120, e.cooldown = Math.max(0, e.cooldown - x), e.invuln = Math.max(0, e.invuln - x), e.x = Math.max(48, Math.min(432, e.x + Math.max(-1, Math.min(1, i)) * 600 * x));
    for (const t of e.enemies) t.hp > 0 && e.time >= t.born && (t.y += t.vy * x);
    if (e.ring) {
      const t = e.ring, o = { x: t.x, y: t.y };
      let a = false, s = false;
      if (t.leg === "out") t.y = Math.max(60, t.y - 600 * x), C(e, o, t, "out"), t.y <= 60 + 1e-8 && (t.leg = "back", t.life = 0);
      else {
        t.life += x;
        const l = e.x - t.x, f = 420 - t.y, d = Math.hypot(l, f), n = d ? Math.min(1, 900 * x / d) : 1;
        t.x += l * n, t.y += f * n, a = n === 1, s = t.life >= 2, C(e, o, t, "back");
      }
      (a || s) && (a && t.kills >= 6 && (e.sixes++, e.score += 500), e.lastCatch = { at: e.time, kills: t.kills, out: t.outKills, back: t.backKills }, e.events.push({ kind: s ? "recover" : "catch", n: t.kills, x: e.x, y: 420 }), e.ring = null, e.cooldown = 0.12, e.notice = s ? "輪を回収しました" : t.kills >= 6 ? "往復六連、まとめて回収！" : "戻った！ 次の投擲へ", e.practice && t.outKills >= 1 && t.backKills >= 1 && (e.status = "clear"));
    }
    for (const t of e.enemies) t.hp > 0 && e.time >= t.born && t.y >= 420 && (t.hp = 0, e.invuln <= 1e-8 && (e.hp--, e.hits++, e.invuln = 0.84, e.events.push({ kind: "damage", n: 1, x: e.x, y: 420 })));
    if (e.hp <= 0) {
      e.status = "over";
      return;
    }
    if (!e.practice && e.time >= 56) {
      e.status = e.kills >= 24 ? "clear" : "over", e.status === "clear" && (e.score += 1e3 + e.hp * 400);
      return;
    }
    if (!e.practice) {
      const t = Math.min(7, Math.floor((e.time + 1e-8) / 7));
      t > e.wave && (e.wave = t, e.enemies = F(t));
    }
  }
}
export {x as FIXED_DT,H as HIT_RADIUS,z as segmentHit,F as createWave,B as createReturn,W as throwRing,C as sweep,U as tickReturn};
