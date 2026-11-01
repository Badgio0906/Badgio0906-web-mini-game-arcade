(function() {
  const t = document.createElement("link").relList;
  if (t && t.supports && t.supports("modulepreload")) return;
  for (const o of document.querySelectorAll('link[rel="modulepreload"]')) r(o);
  new MutationObserver((o) => {
    for (const i of o) if (i.type === "childList") for (const u of i.addedNodes) u.tagName === "LINK" && u.rel === "modulepreload" && r(u);
  }).observe(document, { childList: true, subtree: true });
  function a(o) {
    const i = {};
    return o.integrity && (i.integrity = o.integrity), o.referrerPolicy && (i.referrerPolicy = o.referrerPolicy), o.crossOrigin === "use-credentials" ? i.credentials = "include" : o.crossOrigin === "anonymous" ? i.credentials = "omit" : i.credentials = "same-origin", i;
  }
  function r(o) {
    if (o.ep) return;
    o.ep = true;
    const i = a(o);
    fetch(o.href, i);
  }
})();
const N = [{ x: 120, y: 300, w: 80, h: 20 }, { x: 280, y: 300, w: 80, h: 20 }], f = { x: 240, y: 432 };
function D(e, t, a = 10, r = false) {
  return e >= 20 + a && e <= 460 - a && t >= 20 + a && t <= 460 - a && (!r || Math.hypot(e - f.x, t - f.y) >= 45 + a) && !N.some((o) => e > o.x - a && e < o.x + o.w + a && t > o.y - a && t < o.y + o.h + a);
}
function pe(e, t, a = 12, r = true) {
  const o = (h, y) => {
    const w = Math.max(1, Math.ceil(Math.hypot(y.x - h.x, y.y - h.y)));
    for (let b = 0; b <= w; b++) if (!D(h.x + (y.x - h.x) * b / w, h.y + (y.y - h.y) * b / w, a, r)) return false;
    return true;
  }, i = (h, y) => {
    for (const w of [{ x: y.x, y: h.y }, { x: h.x, y: y.y }]) if (o(h, w) && o(w, y)) return [w, y].filter((b, L, Q) => Math.hypot(b.x - (L ? Q[L - 1].x : h.x), b.y - (L ? Q[L - 1].y : h.y)) > 1e-8);
    return null;
  }, u = (h) => Math.max(20 + a, Math.min(460 - a, h)), l = [u(t.x), ...N.flatMap((h) => [h.x - a, h.x + h.w + a])], s = [u(t.y), ...N.flatMap((h) => [h.y - a, h.y + h.h + a])], d = Math.hypot(t.x - f.x, t.y - f.y) || 1, n = [...l.flatMap((h) => s.map((y) => ({ x: h, y }))), { x: f.x + (t.x === f.x && t.y === f.y ? 1 : (t.x - f.x) / d) * (45 + a + 1e-6), y: f.y + (t.y - f.y) / d * (45 + a + 1e-6) }].filter((h) => D(h.x, h.y, a, r)).sort((h, y) => Math.hypot(h.x - t.x, h.y - t.y) - Math.hypot(y.x - t.x, y.y - t.y)), x = Array.from({ length: 484 }, (h, y) => ({ id: y, x: 30 + y % 22 * 20, y: 30 + Math.floor(y / 22) * 20 })).filter((h) => D(h.x, h.y, a, r)), k = new Set(x.map((h) => h.id));
  if (n[0]) {
    const h = i(e, n[0]);
    if (h) return h;
  }
  const p = [...x].sort((h, y) => Math.hypot(h.x - e.x, h.y - e.y) - Math.hypot(y.x - e.x, y.y - e.y)), m = p.find((h) => i(e, h) !== null);
  if (!m) return [];
  const S = /* @__PURE__ */ new Map([[m.id, -1]]), P = [m.id];
  for (let h = 0; h < P.length; h++) {
    const y = P[h];
    for (const w of [-22, -1, 1, 22]) {
      const b = y + w;
      Math.abs(w) === 1 && Math.floor(b / 22) !== Math.floor(y / 22) || k.has(b) && !S.has(b) && (S.set(b, y), P.push(b));
    }
  }
  for (const h of n) for (const y of [...x].filter((w) => S.has(w.id)).sort((w, b) => Math.hypot(w.x - h.x, w.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))) {
    const w = i(y, h);
    if (!w) continue;
    const b = [];
    let L = y.id;
    for (; L !== -1; ) b.push({ x: 30 + L % 22 * 20, y: 30 + Math.floor(L / 22) * 20 }), L = S.get(L);
    return [...i(e, m), ...b.reverse().slice(1), ...w];
  }
  return [];
}
function ae(e, t, a, r, o = 1 / 120, i = 10, u = false) {
  const l = Math.hypot(t, a) || 1, s = r * o / l;
  let d = e.x + t * s, n = e.y + a * s;
  D(d, e.y, i, u) && (e.x = d), D(e.x, n, i, u) && (e.y = n);
}
const Y = Array.from({ length: 24 }, (e, t) => ({ id: t, x: 60 + 50 * (t % 8), y: 80 + 80 * Math.floor(t / 8) })), K = { x: 240, y: 60 }, de = [[{ x: 80, y: 80 }, { x: 210, y: 80 }, { x: 210, y: 240 }, { x: 80, y: 240 }], [{ x: 400, y: 80 }, { x: 270, y: 80 }, { x: 270, y: 240 }, { x: 400, y: 240 }]], $ = 120, G = 7200, fe = 42, ee = 60, ye = 120, te = 180, me = 30, ie = 9100;
function ne(e = false) {
  return { practice: e, tick: 0, player: { ...f }, robots: [{ id: 0, x: 80, y: 160, path: [], patrol: 0, routeAt: 0 }, { id: 1, x: 400, y: 160, path: [], patrol: 0, routeAt: 0 }], third: { id: 2, ...K, path: [], patrol: 0, routeAt: 0, phase: "idle", until: 0 }, used: Y.map(() => false), carry: [], life: 3, damage: 0, lost: 0, banked: 0, score: 0, maxBatch: 0, deposit: 0, patrolUntil: 0, rescue: 0, rescueFrom: { ...f }, immuneUntil: 0, status: "playing", reason: "", message: "集めたお宝は、銀行へ持ち帰って確定。" };
}
function U(e) {
  return e === 12 ? 3 : e >= 8 ? 2 : e >= 4 ? 1.5 : 1;
}
function oe(e) {
  return 100 * e * U(e);
}
function xe(e) {
  return e.status !== "clear" ? "—" : e.banked >= 22 && e.maxBatch >= 12 && e.damage === 0 ? "S" : e.banked >= 20 && e.maxBatch >= 8 ? "A" : "B";
}
function ge(e) {
  return Math.min(180, 110 + 7 * e);
}
function q(e, t) {
  return Math.hypot(e.x - t.x, e.y - t.y);
}
function be(e, t) {
  const a = t / $;
  let r = a;
  const o = [];
  for (; r > 1e-8 && e.path.length; ) {
    const u = e.path[0], l = q(e, u);
    if (l < 1e-7) {
      e.x = u.x, e.y = u.y, e.path.shift();
      continue;
    }
    const s = Math.min(r, l), d = { x: e.x, y: e.y }, n = (a - r) / a;
    ae(e, u.x - e.x, u.y - e.y, s * $, 1 / $, 12, true);
    const x = q(d, e);
    if (o.push({ a: d, b: { x: e.x, y: e.y }, t0: n, t1: n + x / a }), r -= x, x < s - 1e-6) {
      e.path = [];
      break;
    }
    q(e, u) < 1e-6 && (e.x = u.x, e.y = u.y, e.path.shift());
  }
  const i = 1 - r / a;
  return (r > 1e-8 || !o.length) && o.push({ a: { x: e.x, y: e.y }, b: { x: e.x, y: e.y }, t0: i, t1: 1 }), o;
}
function _(e, t, a) {
  const r = t.x - e.x, o = t.y - e.y, i = r * r + o * o, u = e.x * e.x + e.y * e.y - a * a;
  if (i < 1e-12) return u <= 0 ? [0, 1] : null;
  const l = 2 * (e.x * r + e.y * o), s = l * l - 4 * i * u;
  if (s < 0) return null;
  const d = Math.sqrt(s), n = Math.max(0, (-l - d) / (2 * i)), x = Math.min(1, (-l + d) / (2 * i));
  return n <= x ? [n, x] : null;
}
const z = (e, t, a) => ({ x: e.x + (t.x - e.x) * a, y: e.y + (t.y - e.y) * a });
function ve(e, t, a) {
  for (const r of a) {
    const o = z(e, t, r.t0), i = z(e, t, r.t1), u = _({ x: o.x - r.a.x, y: o.y - r.a.y }, { x: i.x - r.b.x, y: i.y - r.b.y }, 22);
    if (!u) continue;
    let l = r.t0 + (r.t1 - r.t0) * u[0], s = r.t0 + (r.t1 - r.t0) * u[1];
    const d = _({ x: e.x - f.x, y: e.y - f.y }, { x: t.x - f.x, y: t.y - f.y }, 45);
    if (d && l >= d[0] - 1e-9 && l <= d[1] + 1e-9 && (l = d[1] + 1e-7), l <= s && l <= 1) return l;
  }
  return null;
}
function V(e, t) {
  e.third.phase === "telegraph" ? (e.third.phase = "idle", t.push({ type: "depart" })) : e.third.phase === "active" && (e.third.phase = "returning", e.third.routeAt = 0, e.third.path = [], t.push({ type: "depart" }));
}
function C(e, t, a, r) {
  e.status = t, e.reason = a, e.message = a, e.deposit = 0, t === "clear" && !e.practice && (e.score += 1e3 + e.life * 300), r.push({ type: "finish", reason: t });
}
function we(e, t = 0, a = 0) {
  if (e.status !== "playing") return [];
  const r = [];
  e.tick++;
  const o = { ...e.player };
  if (e.rescue > 0 ? (e.rescue--, e.player = z(e.rescueFrom, f, 1 - e.rescue / ee), e.rescue === 0 && (e.player = { ...f }, r.push({ type: "rescue" }))) : ae(e.player, t, a, 210, 1 / $, 10, false), e.rescue === 0) {
    const l = Y.filter((s) => !e.used[s.id]).map((s) => ({ item: s, hit: _({ x: o.x - s.x, y: o.y - s.y }, { x: e.player.x - s.x, y: e.player.y - s.y }, 18) })).filter((s) => s.hit !== null).sort((s, d) => s.hit[0] - d.hit[0] || s.item.id - d.item.id);
    for (const { item: s } of l) {
      if (e.carry.length >= 12) break;
      e.used[s.id] = true, e.carry.push(s.id), r.push({ type: "pickup", count: e.carry.length }), (e.carry.length === 4 || e.carry.length === 8 || e.carry.length === 12) && r.push({ type: "alarm", count: e.carry.length }), e.message = e.carry.length === 12 ? "袋が満杯！ 銀行へ戻って×3確定" : `未確定 ${e.carry.length}個 · ×${U(e.carry.length)}`;
    }
  }
  e.carry.length >= 8 && e.third.phase === "idle" && (e.third.phase = "telegraph", e.third.until = e.tick + $, r.push({ type: "telegraph" })), e.third.phase === "telegraph" && e.carry.length < 8 && V(e, r), e.third.phase === "telegraph" && e.tick >= e.third.until && (e.third.phase = "active", e.third.routeAt = 0, r.push({ type: "spawn" }));
  const i = [...e.robots, ...e.third.phase === "active" || e.third.phase === "returning" ? [e.third] : []];
  let u = false;
  for (const l of i) {
    const s = l.id === 2 && e.third.phase === "returning", d = !s && e.carry.length > 0 && e.tick >= e.patrolUntil && e.rescue === 0;
    let n;
    if (s) n = K;
    else if (d) n = e.player;
    else {
      const k = de[l.id % 2];
      q(l, k[l.patrol]) < 2 && (l.patrol = (l.patrol + 1) % k.length, l.routeAt = 0), n = k[l.patrol];
    }
    e.tick >= l.routeAt && (l.path = pe(l, n, 12, true), l.routeAt = e.tick + me);
    const x = be(l, s ? 110 : d ? ge(e.carry.length) : 110);
    s && q(l, K) < 1e-6 && (e.third.phase = "idle", e.third.path = [], r.push({ type: "depart" })), !s && e.rescue === 0 && e.tick >= e.immuneUntil && ve(o, e.player, x) !== null && (u = true);
  }
  if (u) {
    e.life--, e.damage++, e.lost += e.carry.length, e.carry = [], e.deposit = 0, e.rescue = ee, e.rescueFrom = { ...e.player }, e.immuneUntil = e.tick + ye, e.patrolUntil = e.tick + te;
    for (const l of e.robots) l.routeAt = 0, l.patrol = 3, l.path = [];
    V(e, r), e.message = "捕獲！ 未確定分を失った。銀行へ救出", r.push({ type: "capture" });
  }
  if (e.rescue === 0 && e.carry.length > 0 && q(e.player, f) <= 28) {
    if (e.deposit++, e.deposit >= fe) {
      const l = e.carry.length, s = oe(l);
      e.score += s, e.banked += l, e.maxBatch = Math.max(e.maxBatch, l), e.carry = [], e.deposit = 0, e.patrolUntil = e.tick + te;
      for (const d of e.robots) d.routeAt = 0, d.patrol = 3, d.path = [];
      V(e, r), e.message = `${l}個 ×${U(l)} · ＋${s}点 確定！`, r.push({ type: "deposit", count: l, points: s });
    }
  } else e.deposit = 0;
  return e.tick === G - 5 * $ && !e.practice && r.push({ type: "warning" }), e.life <= 0 ? C(e, "over", "LIFEが0。預入済み点は保持", r) : e.practice && e.banked >= 2 ? C(e, "clear", "練習成功：持ち帰って確定できた", r) : e.banked >= 24 ? C(e, "clear", "全24個を預入完了", r) : e.tick >= G && !e.practice && C(e, e.banked >= 16 ? "clear" : "over", e.banked >= 16 ? "16個以上を持ち帰った" : "時間切れ：未預入分は得点になりません", r), r;
}
function ke(e, t) {
  const a = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set();
  let i = false, u = null, l = { x: 0, y: 0 }, s = { x: 0, y: 0 };
  const d = (p) => p.code || { w: "KeyW", a: "KeyA", s: "KeyS", d: "KeyD" }[p.key.toLowerCase()] || p.key, n = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"], x = () => {
    const p = u;
    if (u = null, p !== null) for (o.add(p), i = true; o.size > 8; ) o.delete(o.values().next().value);
    if (s = { x: 0, y: 0 }, r.clear(), e.removeAttribute("data-active"), p !== null && e.hasPointerCapture(p)) try {
      e.releasePointerCapture(p);
    } catch {
    }
  };
  window.addEventListener("pointerdown", (p) => {
    p.isPrimary && p.button === 0 && (o.delete(p.pointerId), i = false);
  }, true), window.addEventListener("click", (p) => {
    const m = p.pointerId;
    (typeof m == "number" && m >= 0 ? o.has(m) : i) && p.detail > 0 && (p.preventDefault(), p.stopImmediatePropagation());
  }, true), e.addEventListener("pointerdown", (p) => {
    !t.active() || !t.controllable() || u !== null || !p.isPrimary || p.button !== 0 || (p.preventDefault(), t.unlock(), r.clear(), u = p.pointerId, l = { x: p.clientX, y: p.clientY }, s = { x: 0, y: 0 }, e.setPointerCapture(u), e.setAttribute("data-active", ""));
  }), e.addEventListener("pointermove", (p) => {
    if (u !== p.pointerId || !t.active() || !t.controllable()) return;
    p.preventDefault();
    const m = p.clientX - l.x, S = p.clientY - l.y, P = Math.hypot(m, S);
    s = P <= 6 ? { x: 0, y: 0 } : { x: m / P, y: S / P };
  });
  for (const p of ["pointerup", "pointercancel", "lostpointercapture"]) e.addEventListener(p, (m) => {
    u === m.pointerId && x();
  });
  e.addEventListener("contextmenu", (p) => p.preventDefault()), window.addEventListener("keydown", (p) => {
    if (p.target instanceof HTMLInputElement || p.ctrlKey || p.metaKey || p.altKey) return;
    const m = d(p);
    if (!n.includes(m) && m !== "Escape") return;
    const S = a.has(m);
    if (a.add(m), !!t.active() && (p.preventDefault(), !(p.repeat || S))) {
      if (m === "Escape") {
        t.pause();
        return;
      }
      u === null && t.controllable() && (r.add(m), t.unlock());
    }
  }), window.addEventListener("keyup", (p) => {
    const m = d(p);
    a.delete(m), r.delete(m);
  });
  const k = () => {
    x(), a.clear(), t.pause();
  };
  return window.addEventListener("blur", k), window.addEventListener("resize", k), window.addEventListener("pagehide", k), document.addEventListener("visibilitychange", () => {
    document.hidden && k();
  }), matchMedia("(orientation:portrait)").addEventListener("change", k), { abort: x, axes: () => !t.active() || !t.controllable() ? { x: 0, y: 0 } : u !== null ? { ...s } : { x: Number(r.has("ArrowRight") || r.has("KeyD")) - Number(r.has("ArrowLeft") || r.has("KeyA")), y: Number(r.has("ArrowDown") || r.has("KeyS")) - Number(r.has("ArrowUp") || r.has("KeyW")) } };
}
const re = "100gare:game059:rules1";
class Me {
  data = { rulesVersion: 1, best: 0, volume: 0.35, muted: false, light: false };
  persistent = true;
  storage = null;
  constructor(t) {
    try {
      this.storage = t ?? window.localStorage;
      const a = this.storage.getItem(re);
      if (a === null) return;
      const r = JSON.parse(a);
      if (!r || Array.isArray(r) || r.rulesVersion !== 1 || typeof r.best != "number" || !Number.isInteger(r.best) || r.best < 0 || r.best > ie || r.best % 50 !== 0 || typeof r.volume != "number" || !Number.isFinite(r.volume) || r.volume < 0 || r.volume > 1 || typeof r.muted != "boolean" || typeof r.light != "boolean") {
        this.persistent = false;
        return;
      }
      this.data = { rulesVersion: 1, best: r.best, volume: r.volume, muted: r.muted, light: r.light };
    } catch {
      this.persistent = false;
    }
  }
  write() {
    if (this.persistent && this.storage) try {
      this.storage.setItem(re, JSON.stringify(this.data));
    } catch {
      this.persistent = false;
    }
  }
  result(t, a) {
    !a && Number.isInteger(t) && t >= 0 && t <= ie && t % 50 === 0 && (this.data.best = Math.max(this.data.best, t), this.write());
  }
}
class $e {
  context = null;
  master = null;
  voices = [];
  volume = 0.35;
  muted = false;
  unlock() {
    try {
      this.context || (this.context = new AudioContext(), this.master = this.context.createGain(), this.master.connect(this.context.destination)), this.context.resume().catch(() => {
      }), this.set(this.volume, this.muted);
    } catch {
    }
  }
  set(t, a) {
    this.volume = t, this.muted = a, this.context && this.master && this.master.gain.setValueAtTime(a ? 0 : t, this.context.currentTime), (a || t === 0) && this.stop();
  }
  remove(t, a = true) {
    const r = this.voices.indexOf(t);
    if (!(r < 0)) {
      if (this.voices.splice(r, 1), a) try {
        t.source.stop();
      } catch {
      }
      t.source.disconnect(), t.gain.disconnect();
    }
  }
  room() {
    if (!this.context || !this.master || this.muted || this.volume === 0) return false;
    for (const t of [...this.voices]) t.until < this.context.currentTime && this.remove(t);
    for (; this.voices.length >= 24; ) this.remove(this.voices[0]);
    return true;
  }
  tone(t, a, r, o = 0, i = "sine", u = 0.08) {
    if (!this.room()) return;
    const l = this.context, s = l.currentTime + o, d = l.createOscillator(), n = l.createGain();
    d.type = i, d.frequency.setValueAtTime(t, s), d.frequency.exponentialRampToValueAtTime(Math.max(1, a), s + r), n.gain.setValueAtTime(1e-4, s), n.gain.exponentialRampToValueAtTime(u, s + 7e-3), n.gain.exponentialRampToValueAtTime(1e-4, s + r), d.connect(n), n.connect(this.master);
    const x = { source: d, gain: n, until: s + r };
    this.voices.push(x), d.onended = () => this.remove(x, false), d.start(s), d.stop(s + r + 0.01);
  }
  noise(t, a) {
    if (!this.room()) return;
    const r = this.context, o = r.createBufferSource(), i = r.createGain(), u = r.createBiquadFilter(), l = r.createBuffer(1, Math.ceil(r.sampleRate * t), r.sampleRate), s = l.getChannelData(0);
    for (let n = 0; n < s.length; n++) s[n] = (Math.random() * 2 - 1) * (1 - n / s.length);
    o.buffer = l, u.type = "bandpass", u.frequency.value = a, o.connect(u), u.connect(i), i.connect(this.master), i.gain.setValueAtTime(0.09, r.currentTime), i.gain.exponentialRampToValueAtTime(1e-4, r.currentTime + t);
    const d = { source: o, gain: i, until: r.currentTime + t };
    this.voices.push(d), o.onended = () => {
      u.disconnect(), this.remove(d, false);
    }, o.start(), o.stop(r.currentTime + t + 0.01);
  }
  pulse(t) {
    t <= 0 || (this.tone(130, 130, 0.13, 0, "sine", 0.025), t >= 4 && this.tone(196, 190, 0.12, 0.055, "triangle", 0.025), t >= 8 && this.tone(293, 260, 0.14, 0.11, "square", 0.02), t >= 12 && this.tone(392, 340, 0.17, 0.16, "triangle", 0.025));
  }
  play(t) {
    if (t.type === "pickup") {
      const a = t.count ?? 1;
      this.tone(700 + 30 * a, 1100 + 35 * a, 0.12), this.tone(1480, 1680, 0.08, 0.025, "triangle", 0.04);
    }
    if (t.type === "alarm" && this.pulse(t.count ?? 1), t.type === "telegraph" && (this.tone(350, 550, 0.22, 0, "triangle"), this.tone(350, 550, 0.22, 0.3, "triangle")), t.type === "spawn" && (this.noise(0.18, 900), this.tone(260, 130, 0.18, 0, "square")), t.type === "deposit") {
      this.stop();
      for (let a = 0; a < 5; a++) this.noise(0.1, 1800 + a * 200), this.tone(640 + a * 120, 900 + a * 130, 0.19, a * 0.045, "triangle", 0.09);
      this.tone(110, 70, 0.28, 0, "sine", 0.15);
    }
    if (t.type === "capture") {
      for (const a of this.voices) this.context && a.gain.gain.setTargetAtTime(0.01, this.context.currentTime, 0.01);
      this.noise(0.23, 180), this.tone(230, 45, 0.4, 0, "sawtooth", 0.1);
    }
    t.type === "rescue" && (this.tone(390, 590, 0.18), this.tone(780, 980, 0.17, 0.1)), t.type === "warning" && (this.tone(260, 260, 0.12, 0, "square"), this.tone(260, 260, 0.12, 0.2, "square")), t.type === "finish" && (t.reason === "over" ? (this.tone(196, 98, 0.3), this.tone(146, 73, 0.35, 0.18)) : [523, 659, 784, 1047].forEach((a, r) => this.tone(a, a, 0.35, 0.065 * r, "triangle")));
  }
  stop() {
    for (const t of [...this.voices]) this.remove(t);
  }
  dispose() {
    this.stop(), this.context && this.context.close().catch(() => {
    }), this.context = null, this.master = null;
  }
}
const le = ["vault", "thief-normal", "thief-bag", "thief-victory", "robot", "gem", "bank"];
async function Ae() {
  return Object.fromEntries(await Promise.all(le.map(async (e) => {
    const t = new Image();
    return t.src = new URL(`assets/${e}.webp`, document.baseURI).href, await t.decode(), [e, t];
  })));
}
function Ee(e, t, a, r, o) {
  const i = e.getContext("2d");
  if (!i) return;
  const u = Math.max(1, Math.round(e.clientWidth * Math.min(2, window.devicePixelRatio || 1)));
  e.width !== u && (e.width = e.height = u), i.setTransform(u / 480, 0, 0, u / 480, 0, 0), i.fillStyle = "#11233b", i.fillRect(0, 0, 480, 480);
  const l = (n, x, k, p, m = "#f3ecd6") => {
    i.font = `bold ${p}px system-ui,sans-serif`, i.textAlign = "center", i.fillStyle = m, i.fillText(n, x, k);
  };
  if (a.vault && (i.globalAlpha = 0.55, i.drawImage(a.vault, 0, 0, 480, 480), i.globalAlpha = 1), Object.keys(a).length !== le.length) {
    l("画像を準備中", 240, 240, 25);
    return;
  }
  i.fillStyle = "#23435a88", i.fillRect(20, 20, 440, 440), i.strokeStyle = "#bdab70", i.lineWidth = 4, i.strokeRect(20, 20, 440, 440), i.fillStyle = "#213348";
  for (const n of N) i.fillRect(n.x, n.y, n.w, n.h), i.strokeStyle = "#b9bdc5", i.lineWidth = 2, i.strokeRect(n.x, n.y, n.w, n.h);
  i.strokeStyle = "#9bbec778", i.lineWidth = 2, i.setLineDash([5, 5]), i.beginPath(), i.arc(f.x, f.y, 45, 0, Math.PI * 2), i.stroke(), i.setLineDash([]), i.fillStyle = "#477c6a66", i.beginPath(), i.arc(f.x, f.y, 28, 0, Math.PI * 2), i.fill(), a.bank ? i.drawImage(a.bank, f.x - 34, f.y - 34, 68, 68) : l("BANK", f.x, f.y + 4, 16, "#d9efbb"), t.deposit > 0 && (i.strokeStyle = "#ffe095", i.lineWidth = 5, i.beginPath(), i.arc(f.x, f.y, 31, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t.deposit / 42), i.stroke());
  for (const n of Y) t.used[n.id] || (a.gem ? i.drawImage(a.gem, n.x - 12, n.y - 12, 24, 24) : (i.fillStyle = "#e6bc56", i.beginPath(), i.moveTo(n.x, n.y - 8), i.lineTo(n.x + 8, n.y), i.lineTo(n.x, n.y + 8), i.lineTo(n.x - 8, n.y), i.closePath(), i.fill()));
  const s = (n, x = false) => {
    a.robot ? i.drawImage(a.robot, n.x - 15, n.y - 15, 30, 30) : (i.fillStyle = n.id === 2 ? "#df766b" : "#92bdcf", i.beginPath(), i.roundRect(n.x - 12, n.y - 12, 24, 24, 6), i.fill()), l(String(n.id + 1), n.x, n.y + 5, 13, "#101f35"), x && (i.setLineDash([3, 4]), i.strokeStyle = "#abc5c9", i.beginPath(), i.arc(n.x, n.y, 18, 0, Math.PI * 2), i.stroke(), i.setLineDash([]), l("退場", n.x, n.y - 22, 11, "#cbdade"));
  };
  if (t.robots.forEach((n) => s(n)), (t.third.phase === "active" || t.third.phase === "returning") && s(t.third, t.third.phase === "returning"), t.third.phase === "telegraph") {
    const n = Math.max(0, (t.third.until - t.tick) / $);
    i.strokeStyle = "#ff9b7e", i.lineWidth = 3, i.beginPath(), i.arc(K.x, K.y, 20 + (o ? 0 : 3 * Math.sin(t.tick * 0.2)), 0, Math.PI * 2), i.stroke(), l(`③ 参加まで${n.toFixed(1)}秒`, 240, 35, 15, "#ffb89d");
  }
  t.rescue > 0 && (i.setLineDash([4, 5]), i.strokeStyle = "#d3e9ff", i.beginPath(), i.moveTo(t.player.x, t.player.y), i.lineTo(f.x, f.y), i.stroke(), i.setLineDash([]));
  const d = a[t.status === "clear" ? "thief-victory" : t.carry.length >= 8 ? "thief-bag" : "thief-normal"];
  d ? i.drawImage(d, t.player.x - 17, t.player.y - 24, 34, 44) : (i.fillStyle = "#e8edf2", i.beginPath(), i.arc(t.player.x, t.player.y, 10, 0, Math.PI * 2), i.fill(), i.fillStyle = "#c65e68", i.fillRect(t.player.x + 5, t.player.y, 8, 10)), t.tick < t.immuneUntil && (i.strokeStyle = "#bfe7ff", i.lineWidth = 2, i.beginPath(), i.arc(t.player.x, t.player.y, 16, 0, Math.PI * 2), i.stroke()), t.carry.length > 0 && l(String(t.carry.length), t.player.x, t.player.y - 27, 17, "#ffe193"), l("銀行保護域45", 365, 455, 13, "#bfd4d8");
}
const se = false;
document.querySelector("#app").innerHTML = '<header><a id="back" href="../../">一覧へ</a><span>ONE MORE HEIST</span><button id="pause">休憩</button></header><main><div class="hud"><span id="time"></span><b id="score"></b><span id="life"></span></div><div id="bag"></div><div id="risk"></div><div class="stage"><canvas aria-label="時計仕掛けの宝庫と銀行"></canvas></div><div id="pad" role="group" aria-label="相対移動スティック"><span>ここを押して、その場所から動かす</span><b>↑<br>←　移動　→<br>↓</b></div><p id="feedback" aria-live="polite"></p><small id="storage"></small></main><section id="layer" class="layer"><div id="panel" class="panel"></div></section>';
const M = (e) => document.getElementById(e), X = document.querySelector("canvas"), v = new Me(), E = new $e();
E.set(v.data.volume, v.data.muted);
let c = ne(), g = "title", ce = {}, I = se, he = "", O = performance.now(), R = 0, W = 0, j = false;
const B = () => g === "play" && c.status === "playing", F = ke(M("pad"), { active: B, controllable: () => c.rescue === 0, pause: J, unlock: () => E.unlock() });
function J() {
  B() && (g = "pause", F.abort(), E.stop(), R = 0, T());
}
function H(e) {
  I && (F.abort(), c = ne(e), g = "play", O = performance.now(), R = 0, E.unlock(), T());
}
const A = (e, t, a = false) => `<button id="${e}" ${a ? "disabled" : ""}>${t}</button>`;
function T() {
  if (M("layer").hidden = g === "play", M("pad").inert = g !== "play", M("pause").disabled = g !== "play", X.tabIndex = g === "play" ? 0 : -1, g === "play") {
    X.focus();
    return;
  }
  const e = M("panel"), t = `<details><summary>音・演出</summary><label><input id="mute" type="checkbox" ${v.data.muted ? "checked" : ""}>消音</label><label>音量 <input id="volume" type="range" min="0" max="1" step=".05" value="${v.data.volume}"></label><label><input id="light" type="checkbox" ${v.data.light ? "checked" : ""}>弱い演出</label></details>`;
  g === "title" && (e.innerHTML = `<p class="eyebrow">ONE MORE HEIST · 60秒</p><h1>怪盗、<br>あと一個だけ。</h1><p>いま戻れば確定。<br>あと一個なら、倍率が上がる。</p><p>お宝を拾い、銀行へ持ち帰ろう。</p><p>BEST <b>${v.data.best}</b></p><p class="artstatus">${I ? "画像の準備完了" : he || "画像を読み込み中…"}</p><div class="actions">${A("start", "すぐ遊ぶ", !I)}${A("help", "説明を見る")}${A("practice", "練習する", !I)}</div>${t}`), g === "help" && (e.innerHTML = `<h1>拾っただけでは、未確定。</h1><p>方向キー／WASDで移動。スマホ・マウスは下のpadを押し、その場所から指を動かす相対スティック。押した位置へ飛びません。</p><p>銀行の内円に0.35秒留まると全預入。外で停止しても得点になりません。1〜3個×1、4〜7個×1.5、8〜11個×2、12個×3。12個で袋が満杯。</p><p>持つほど警備が速くなり、8個以上で1秒予告後に3体目。銀行の外側の保護円には警備が入りません。預入後1.5秒は巡回へ戻ります。</p><p>捕まるとLIFE−1、持っていた未確定分だけを失います。預入分は保持。失ったお宝は再出現せず、0.5秒で救出・1秒無敵。</p><p>60秒で16個以上預入しLIFEを残せばclear。全24個なら早期clear。Sは22個以上・12個一括・無傷、Aは20個以上・8個一括。Escape／休憩で停止。</p><p>練習は2個を持ち帰るまで、BEST対象外。</p><div class="actions">${A("start", "遊ぶ", !I)}${A("practice", "練習", !I)}${A("title", "タイトル")}</div>`), g === "pause" && (e.innerHTML = `<h1>休憩中</h1><p>時計・追跡・予告・預入・救出を停止中。<br>指を離し、新しく操作して再開します。</p><div class="actions">${A("resume", "再開")}${A("retry", "やり直す")}${A("title", "タイトルへ")}</div>${t}`), g === "result" && (e.innerHTML = `<p class="eyebrow">${c.practice ? "練習 · BEST対象外" : "怪盗の搬送結果"}</p><h1>${c.status === "clear" ? c.practice ? "持ち帰れた！" : "預入クリア！" : "潜入終了"}</h1><p class="resultscore">${c.score}<small>点 ${c.practice ? "" : xe(c)}</small></p><p>${c.reason}<br>預入 ${c.banked}/24 · 最大一括${c.maxBatch}個<br>LIFE ${c.life} · 被害${c.damage} · 失った未確定${c.lost}個</p><p>終了時の未預入 ${c.carry.length}個は得点対象外<br>経過 ${(c.tick / $).toFixed(2)}秒</p><div class="actions">${A("retry", c.practice ? "もう一度練習" : "もう一度遊ぶ")}${c.practice ? A("start", "本番へ", !I) : ""}${A("title", "タイトルへ")}</div>`);
  const a = (r, o) => e.querySelector(`#${r}`)?.addEventListener("click", o);
  a("start", () => H(false)), a("practice", () => H(true)), a("retry", () => H(c.practice)), a("help", () => {
    g = "help", T();
  }), a("title", () => {
    F.abort(), E.stop(), g = "title", T();
  }), a("resume", () => {
    F.abort(), O = performance.now(), R = 0, g = "play", E.unlock(), T();
  }), e.querySelector("#mute")?.addEventListener("change", (r) => {
    v.data.muted = r.target.checked, v.write(), E.set(v.data.volume, v.data.muted);
  }), e.querySelector("#volume")?.addEventListener("input", (r) => {
    v.data.volume = Number(r.target.value), v.write(), E.set(v.data.volume, v.data.muted);
  }), e.querySelector("#light")?.addEventListener("change", (r) => {
    v.data.light = r.target.checked, v.write();
  }), e.querySelector("button:not(:disabled)")?.focus();
}
function ue() {
  M("time").textContent = c.practice ? "練習" : `${Math.max(0, (G - c.tick) / $).toFixed(1)}秒`, M("score").textContent = `確定 ${c.score}点`, M("life").textContent = `LIFE ${c.life}`, M("bag").textContent = `袋 ${c.carry.length}/12 · ×${U(c.carry.length)} · 預入で${oe(c.carry.length)}点 ／ 預入済${c.banked}/24`, M("risk").textContent = c.third.phase === "telegraph" ? `警戒：2体＋③参加まで${Math.max(0, (c.third.until - c.tick) / $).toFixed(1)}秒` : c.third.phase === "active" ? `警戒：3体${c.tick < c.patrolUntil ? "巡回" : "追跡"}中` : c.third.phase === "returning" ? "警戒：2体／③は入口へ退場中" : c.tick < c.patrolUntil ? `出口を空けて巡回中 · あと${((c.patrolUntil - c.tick) / $).toFixed(1)}秒` : `警戒：${c.carry.length ? "2体追跡" : "2体巡回"} · ${c.carry.length >= 4 ? "警戒音＋1層" : "通常層"}`, M("feedback").textContent = c.rescue > 0 ? "救出中。到着後は新しい入力で移動" : c.deposit > 0 ? `銀行預入 ${(c.deposit / 42 * 100).toFixed(0)}% · そのまま留まる` : c.tick >= 6600 && !c.practice && c.carry.length ? "あと5秒！ 未確定分を銀行へ" : c.message, M("storage").textContent = v.persistent ? "BEST・設定はこのブラウザに保存" : "保存できません：このページ内の記録のみ";
}
M("pause").addEventListener("click", J);
function Z(e) {
  if (j) return;
  const t = Math.max(0, (e - O) / 1e3);
  if (O = e, B()) if (t > 0.5) J();
  else for (R += t; R >= 1 / $ && B(); ) {
    const a = F.axes(), r = we(c, a.x, a.y);
    R -= 1 / $;
    for (const o of r) E.play(o), (o.type === "capture" || o.type === "rescue") && F.abort();
    c.tick % 60 === 0 && c.carry.length > 0 && E.pulse(c.carry.length), c.status !== "playing" && (F.abort(), v.result(c.score, c.practice), g = "result", T());
  }
  ue(), Ee(X, c, ce, se, v.data.light || matchMedia("(prefers-reduced-motion: reduce)").matches), W = requestAnimationFrame(Z);
}
T();
ue();
W = requestAnimationFrame(Z);
Ae().then((e) => {
  ce = e, I = true, (g === "title" || g === "help") && T();
}).catch(() => {
  he = "BLOCKED_ART：必要な画像がありません。通常プレイは準備中。", (g === "title" || g === "help") && T();
});
window.addEventListener("pagehide", () => {
  j = true, cancelAnimationFrame(W), E.dispose();
});
window.addEventListener("pageshow", (e) => {
  e.persisted && (j = false, O = performance.now(), R = 0, W = requestAnimationFrame(Z));
});
