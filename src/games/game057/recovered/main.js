(function() {
  const t = document.createElement("link").relList;
  if (t && t.supports && t.supports("modulepreload")) return;
  for (const n of document.querySelectorAll('link[rel="modulepreload"]')) o(n);
  new MutationObserver((n) => {
    for (const i of n) if (i.type === "childList") for (const f of i.addedNodes) f.tagName === "LINK" && f.rel === "modulepreload" && o(f);
  }).observe(document, { childList: true, subtree: true });
  function a(n) {
    const i = {};
    return n.integrity && (i.integrity = n.integrity), n.referrerPolicy && (i.referrerPolicy = n.referrerPolicy), n.crossOrigin === "use-credentials" ? i.credentials = "include" : n.crossOrigin === "anonymous" ? i.credentials = "omit" : i.credentials = "same-origin", i;
  }
  function o(n) {
    if (n.ep) return;
    n.ep = true;
    const i = a(n);
    fetch(n.href, i);
  }
})();
const C = [["#######", "#B....#", "#.....#", "#1234G#", "#.....#", "#.....#", "#######"], ["#######", "#...B.#", "#..#..#", "#41..##", "#.....#", "#3.G2.#", "#######"], ["#######", "#..2.4#", "#..1..#", "#..#..#", "#G3B.##", "#.....#", "#######"], ["#######", "#.#.#.#", "##..#.#", "#.4.31#", "#..B..#", "#G..2.#", "#######"], ["#######", "#...#.#", "#1##..#", "#...2.#", "#34G#.#", "#.B...#", "#######"], ["#######", "#....G#", "#.3.4.#", "#.#B..#", "#21.#.#", "#.....#", "#######"]], U = { U: [0, -1], R: [1, 0], D: [0, 1], L: [-1, 0] };
function Z(e) {
  return e.flatMap((t, a) => [...t].flatMap((o, n) => /[1-4B]/.test(o) ? [{ id: o, x: n, y: a }] : []));
}
function ne(e, t, a) {
  const [o, n] = U[a], i = t.map((r) => ({ ...r })), f = [], h = [...i].sort((r, l) => l.x * o + l.y * n - (r.x * o + r.y * n) || r.id.localeCompare(l.id));
  for (const r of h) {
    const l = [{ x: r.x, y: r.y }];
    let p = false, x = false;
    for (let L = 0; L < 7; L++) {
      const S = r.x + o, d = r.y + n;
      if (!e[d] || e[d][S] === "#" || i.some((m) => m !== r && m.x === S && m.y === d)) break;
      if (r.x = S, r.y = d, l.push({ x: S, y: d }), e[d][S] === "G") {
        p = r.id !== "B", x = r.id === "B", i.splice(i.indexOf(r), 1);
        break;
      }
    }
    f.push({ id: r.id, points: l, gold: p, bomb: x });
  }
  const u = f.filter((r) => r.gold).length, s = f.some((r) => r.bomb);
  return { pieces: i, paths: f, gold: u, bomb: s, score: 200 * u + 100 * u * (u - 1) / 2, moved: f.some((r) => r.points.length > 1) };
}
const G = 120, R = 7200, W = 54, X = 18, se = 42, z = 13250;
function Q(e = false) {
  return { practice: e, tick: 0, room: 0, pieces: Z(C[0]), phase: "ready", motion: null, wait: 0, life: 3, score: 0, gold: 0, roomGold: 0, steps: 0, maxBatch: 0, damage: 0, cleared: 0, direction: null, status: "playing", reason: "", message: "金塊だけを受取口へ。方向を1回押す。" };
}
function ce(e) {
  return e.status !== "clear" ? "—" : e.damage === 0 && e.steps <= 36 && e.maxBatch >= 4 ? "S" : e.damage === 0 ? "A" : "B";
}
function F(e) {
  return e.status === "playing" && e.phase === "ready";
}
function le(e, t) {
  if (e.status !== "playing") return [];
  const a = [];
  if (t && F(e)) {
    const o = ne(C[e.room], e.pieces, t);
    e.direction = t, e.steps++, e.pieces = o.pieces;
    const n = o.paths.filter((u) => u.points.length > 1), i = n.length ? W / n.length : X;
    let f = 0;
    const h = o.paths.map((u) => {
      const s = u.points.length > 1, r = s ? Math.floor(f++ * i) : 0;
      return { ...u, start: r, end: s ? Math.floor(f * i) : 0, heard: false };
    });
    e.motion = { age: 0, duration: o.moved ? W : X, paths: h, collected: 0, moved: o.moved }, e.phase = "slide", e.message = o.moved ? "まとめて滑走中" : "動けない方向。手は消費します", a.push({ type: o.moved ? "lever" : "empty" }), o.moved && a.push({ type: "slide" });
  }
  if (e.tick++, e.tick === R - 600 && !e.practice && a.push({ type: "warning" }), e.phase === "slide" && e.motion) {
    const o = e.motion;
    o.age++;
    for (const n of o.paths) n.heard || o.age < n.end || (n.heard = true, n.gold && (e.score += 200 + o.collected * 100, o.collected++, e.maxBatch = Math.max(e.maxBatch, o.collected), e.gold++, e.roomGold++, a.push({ type: "gold", count: o.collected }), e.message = `金塊 ${o.collected}個 回収！`), n.bomb && (e.life--, e.damage++, a.push({ type: "bomb" }), e.message = "危険カプセルが受取口へ。LIFE −1"));
    o.age >= o.duration && (e.maxBatch = Math.max(e.maxBatch, o.collected), e.motion = null, e.life <= 0 ? q(e, "over", "危険カプセルでLIFEが0", a) : e.roomGold === 4 ? (e.cleared++, a.push({ type: "room", count: e.cleared }), e.room === (e.practice ? 0 : 5) ? e.phase = "ready" : (e.phase = "room", e.wait = se, e.message = "金庫の扉が開く… 次の部屋へ")) : e.phase = "ready");
  } else e.phase === "room" && --e.wait <= 0 && (e.room++, e.pieces = Z(C[e.room]), e.roomGold = 0, e.phase = "ready", e.direction = null, e.message = `第${e.room + 1}室：危険物は壁の陰に残そう`);
  return e.status === "playing" && (e.tick >= R && !e.practice && e.life <= 0 ? q(e, "over", "危険カプセルでLIFEが0", a) : e.tick >= R && !e.practice ? q(e, "over", "60秒の時間切れ", a) : e.cleared === (e.practice ? 1 : 6) && q(e, "clear", e.practice ? "練習成功" : "全6室 搬出完了", a)), a;
}
function q(e, t, a, o) {
  e.status = t, e.reason = a, e.message = a, t === "clear" && !e.practice && (e.score += 1e3 + Math.floor((R - e.tick) / G) * 50 + e.life * 300), o.push({ type: "finish", reason: t });
}
function de(e, t) {
  const a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set();
  let n = false, i = null;
  const f = (r) => r.code || r.key, h = () => {
    const r = i;
    if (i = null, r) for (o.add(r.id), n = true; o.size > 8; ) o.delete(o.values().next().value);
    if (r && r.target.hasPointerCapture(r.id)) try {
      r.target.releasePointerCapture(r.id);
    } catch {
    }
  };
  window.addEventListener("pointerdown", (r) => {
    r.isPrimary && r.button === 0 && (o.delete(r.pointerId), n = false);
  }, true), window.addEventListener("click", (r) => {
    const l = r.pointerId;
    (typeof l == "number" && l >= 0 ? o.has(l) : n) && r.detail > 0 && (r.preventDefault(), r.stopImmediatePropagation());
  }, true);
  const u = { ArrowUp: "U", ArrowRight: "R", ArrowDown: "D", ArrowLeft: "L" };
  for (const r of ["U", "R", "D", "L"]) {
    const l = e[r];
    l.addEventListener("pointerdown", (p) => {
      !t.active() || !t.ready() || i || !p.isPrimary || p.button !== 0 || (p.preventDefault(), t.unlock(), i = { id: p.pointerId, target: l, direction: r }, l.setPointerCapture(p.pointerId));
    }), l.addEventListener("pointerup", (p) => {
      if (!i || i.id !== p.pointerId || i.target !== l) return;
      const x = i;
      i = null;
      const L = l.getBoundingClientRect();
      t.active() && t.ready() && p.clientX >= L.left && p.clientX <= L.right && p.clientY >= L.top && p.clientY <= L.bottom && t.tilt(x.direction), l.hasPointerCapture(p.pointerId) && l.releasePointerCapture(p.pointerId);
    });
    for (const p of ["pointercancel", "lostpointercapture"]) l.addEventListener(p, (x) => {
      i?.id === x.pointerId && h();
    });
    l.addEventListener("keydown", (p) => {
      if (f(p) !== "Enter") return;
      p.preventDefault();
      const x = a.has("Enter");
      a.add("Enter"), !(!t.active() || !t.ready() || i || p.repeat || x) && (t.unlock(), t.tilt(r));
    }), l.addEventListener("click", (p) => {
      p.detail === 0 && t.active() && t.ready() && !i && !a.has("Enter") && (t.unlock(), t.tilt(r));
    }), l.addEventListener("contextmenu", (p) => p.preventDefault());
  }
  window.addEventListener("keydown", (r) => {
    if (r.target instanceof HTMLInputElement || r.ctrlKey || r.metaKey || r.altKey) return;
    const l = f(r);
    if (!u[l] && l !== "Escape") return;
    const p = a.has(l);
    a.add(l), !(!t.active() || i || p || r.repeat) && (r.preventDefault(), l === "Escape" ? t.pause() : t.ready() && (t.unlock(), t.tilt(u[l])));
  }), window.addEventListener("keyup", (r) => a.delete(f(r)));
  const s = () => {
    h(), a.clear(), t.pause();
  };
  return window.addEventListener("blur", s), window.addEventListener("resize", s), window.addEventListener("pagehide", s), document.addEventListener("visibilitychange", () => {
    document.hidden && s();
  }), matchMedia("(orientation:portrait)").addEventListener("change", s), { abort: h };
}
const J = "100gare:game057:rules1";
class pe {
  data = { rulesVersion: 1, best: 0, volume: 0.35, muted: false, light: false };
  persistent = true;
  storage = null;
  constructor(t) {
    try {
      this.storage = t ?? window.localStorage;
      const a = this.storage.getItem(J);
      if (a === null) return;
      const o = JSON.parse(a);
      if (!o || Array.isArray(o) || o.rulesVersion !== 1 || typeof o.best != "number" || !Number.isInteger(o.best) || o.best < 0 || o.best > z || o.best % 50 !== 0 || typeof o.volume != "number" || !Number.isFinite(o.volume) || o.volume < 0 || o.volume > 1 || typeof o.muted != "boolean" || typeof o.light != "boolean") {
        this.persistent = false;
        return;
      }
      this.data = { rulesVersion: 1, best: o.best, volume: o.volume, muted: o.muted, light: o.light };
    } catch {
      this.persistent = false;
    }
  }
  write() {
    if (this.persistent && this.storage) try {
      this.storage.setItem(J, JSON.stringify(this.data));
    } catch {
      this.persistent = false;
    }
  }
  result(t, a) {
    !a && Number.isInteger(t) && t >= 0 && t <= z && t % 50 === 0 && (this.data.best = Math.max(t, this.data.best), this.write());
  }
}
class ue {
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
    const o = this.voices.indexOf(t);
    if (!(o < 0)) {
      if (this.voices.splice(o, 1), a) try {
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
  tone(t, a, o, n = 0, i = "triangle", f = 0.1) {
    if (!this.room()) return;
    const h = this.context, u = h.currentTime + n, s = h.createOscillator(), r = h.createGain();
    s.type = i, s.frequency.setValueAtTime(t, u), s.frequency.exponentialRampToValueAtTime(Math.max(1, a), u + o), r.gain.setValueAtTime(1e-4, u), r.gain.exponentialRampToValueAtTime(f, u + 7e-3), r.gain.exponentialRampToValueAtTime(1e-4, u + o), s.connect(r), r.connect(this.master);
    const l = { source: s, gain: r, until: u + o };
    this.voices.push(l), s.onended = () => this.remove(l, false), s.start(u), s.stop(u + o + 0.01);
  }
  noise(t, a, o = 0.1) {
    if (!this.room()) return;
    const n = this.context, i = n.createBufferSource(), f = n.createGain(), h = n.createBiquadFilter(), u = n.createBuffer(1, Math.ceil(n.sampleRate * t), n.sampleRate), s = u.getChannelData(0);
    for (let l = 0; l < s.length; l++) s[l] = (Math.random() * 2 - 1) * (1 - l / s.length);
    i.buffer = u, h.type = "lowpass", h.frequency.value = a, i.connect(h), h.connect(f), f.connect(this.master), f.gain.setValueAtTime(o, n.currentTime), f.gain.exponentialRampToValueAtTime(1e-4, n.currentTime + t);
    const r = { source: i, gain: f, until: n.currentTime + t };
    this.voices.push(r), i.onended = () => {
      h.disconnect(), this.remove(r, false);
    }, i.start(), i.stop(n.currentTime + t + 0.01);
  }
  play(t) {
    if (!(!this.context || this.muted || this.volume === 0)) {
      if (t.type === "lever" && (this.tone(95, 42, 0.16, 0, "square", 0.13), this.tone(410, 210, 0.07, 0, "triangle", 0.08), this.noise(0.09, 1200, 0.12)), t.type === "slide" && (this.noise(0.34, 460, 0.12), this.tone(62, 85, 0.32, 0, "sawtooth", 0.035)), t.type === "empty" && (this.tone(145, 100, 0.09, 0, "triangle", 0.05), this.tone(210, 140, 0.07, 0.055, "square", 0.03)), t.type === "gold") {
        const a = t.count ?? 1;
        this.noise(0.08, 3100, 0.07), this.tone(860 + a * 90, 650 + a * 80, 0.15, 0, "triangle", 0.12), this.tone(1460 + a * 110, 1850 + a * 100, 0.13, 0.025, "sine", 0.07), this.tone(320, 190, 0.09, 0, "sine", 0.11);
      }
      if (t.type === "bomb") {
        for (const a of this.voices) a.gain.gain.setTargetAtTime(0.012, this.context.currentTime, 0.01);
        this.noise(0.25, 150, 0.17), this.tone(190, 37, 0.35, 0, "sawtooth", 0.12);
      }
      t.type === "room" && (this.tone(392, 392, 0.18), this.tone(588, 588, 0.22, 0.09), this.tone(784, 784, 0.25, 0.18)), t.type === "warning" && (this.tone(245, 245, 0.09, 0, "square", 0.05), this.tone(245, 245, 0.09, 0.2, "square", 0.05)), t.type === "finish" && (t.reason === "over" ? (this.tone(220, 110, 0.3), this.tone(98, 49, 0.35, 0.18)) : [523, 659, 784, 1047].forEach((a, o) => this.tone(a, a, 0.4, o * 0.07, "triangle", 0.09)));
    }
  }
  stop() {
    for (const t of [...this.voices]) this.remove(t);
  }
  dispose() {
    this.stop(), this.context && this.context.close().catch(() => {
    }), this.context = null, this.master = null;
  }
}
const ee = ["vault", "gecko-normal", "gecko-joy", "gold", "bomb", "wall", "receiver"];
async function fe() {
  const e = await Promise.all(ee.map(async (t) => {
    const a = new Image();
    return a.src = new URL(`assets/${t}.webp`, document.baseURI).href, await a.decode(), [t, a];
  }));
  return Object.fromEntries(e);
}
function me(e, t) {
  const o = Math.max(0, Math.min(1, (t - e.start) / Math.max(1, e.end - e.start))) * (e.points.length - 1), n = Math.min(Math.floor(o), e.points.length - 1), i = e.points[n], f = e.points[Math.min(n + 1, e.points.length - 1)], h = o - n;
  return { x: i.x + (f.x - i.x) * h, y: i.y + (f.y - i.y) * h, gone: (e.gold || e.bomb) && t >= e.end };
}
function he(e, t, a, o, n) {
  const i = e.getContext("2d");
  if (!i) return;
  const f = Math.min(2, window.devicePixelRatio || 1), h = Math.max(1, Math.round(e.clientWidth * f));
  e.width !== h && (e.width = e.height = h), i.setTransform(h / 480, 0, 0, h / 480, 0, 0), i.fillStyle = "#112d43", i.fillRect(0, 0, 480, 480);
  const u = (d, m, v, b, A = "#eaf1eb") => {
    i.font = `bold ${b}px system-ui,sans-serif`, i.textAlign = "center", i.fillStyle = A, i.fillText(d, m, v);
  };
  if (a.vault && (i.globalAlpha = 0.5, i.drawImage(a.vault, 0, 0, 480, 480), i.globalAlpha = 1), Object.keys(a).length !== ee.length) {
    u("画像を準備中", 240, 240, 26);
    return;
  }
  u(`第${t.room + 1}室`, 100, 25, 21, "#ffe39c"), u(`回収 ${t.roomGold}/4`, 350, 25, 21, "#ffe39c");
  const s = 56, r = 44, l = 42, p = (d, m) => ({ x: r + (d + 0.5) * s, y: l + (m + 0.5) * s });
  if (i.save(), !n && t.motion?.moved) {
    const d = t.direction ? U[t.direction] : [0, 0];
    i.translate(240, 238), i.rotate((d[0] - d[1]) * 0.018 * Math.sin(Math.PI * t.motion.age / t.motion.duration)), i.translate(-240, -238);
  }
  const x = C[t.room];
  for (let d = 0; d < 7; d++) for (let m = 0; m < 7; m++) {
    const v = r + m * s, b = l + d * s;
    i.fillStyle = `rgb(${20 + t.cleared * 2},${53 + t.cleared * 3},${73 + t.cleared * 3})`, i.fillRect(v, b, s, s), i.strokeStyle = "#4c7686", i.lineWidth = 1, i.strokeRect(v + 0.5, b + 0.5, s - 1, s - 1), x[d][m] === "#" && (a.wall ? i.drawImage(a.wall, v, b, s, s) : (i.fillStyle = "#416980", i.fillRect(v + 1, b + 1, s - 2, s - 2), i.strokeStyle = "#82a7b9", i.strokeRect(v + 5, b + 5, s - 10, s - 10))), x[d][m] === "G" && (i.fillStyle = "#163c36", i.fillRect(v + 2, b + 2, s - 4, s - 4), a.receiver && i.drawImage(a.receiver, v, b, s, s), i.strokeStyle = "#f1d072", i.lineWidth = 3, i.strokeRect(v + 3, b + 3, s - 6, s - 6), u("G", v + s / 2, b + s * 0.67, 25, "#ffe291"));
  }
  if (t.phase === "ready" && t.direction) {
    const [d, m] = U[t.direction];
    for (const v of t.pieces) {
      const b = v.x + d, A = v.y + m;
      if (x[A]?.[b] !== void 0 && x[A][b] !== "#") {
        const Y = p(b, A);
        i.strokeStyle = "#b4c9d777", i.setLineDash([3, 4]), i.lineWidth = 2, i.strokeRect(Y.x - 19, Y.y - 19, 38, 38), i.setLineDash([]);
      }
    }
  }
  const L = (d) => {
    const m = p(d.x, d.y), v = a[d.id === "B" ? "bomb" : "gold"];
    v ? i.drawImage(v, m.x - 25, m.y - 25, 50, 50) : (i.fillStyle = d.id === "B" ? "#d65f60" : "#e6b441", i.beginPath(), i.roundRect(m.x - 23, m.y - 23, 46, 46, 10), i.fill()), i.font = "bold 24px system-ui,sans-serif", i.textAlign = "center", i.lineWidth = 4, i.strokeStyle = "#152732", i.strokeText(d.id, m.x, m.y + 8), i.fillStyle = d.id === "B" ? "#fff0e8" : "#fff3bd", i.fillText(d.id, m.x, m.y + 8);
  };
  if (t.motion) for (const d of t.motion.paths) {
    const m = me(d, t.motion.age);
    m.gone || L({ id: d.id, x: m.x, y: m.y });
  }
  else for (const d of t.pieces) L(d);
  i.restore();
  const S = a[t.phase === "room" || t.status === "clear" ? "gecko-joy" : "gecko-normal"];
  S ? i.drawImage(S, 398, 412, 76, 68) : u("✦", 441, 460, 35, "#b1dc9a"), u(t.phase === "slide" ? "滑走中 · 追加操作の予約なし" : t.phase === "room" ? "搬出完了 · 次室へ" : "全物体が同じ方向へ動く", 220, 467, 18);
}
const te = false, _ = { U: "↑ 上", R: "→ 右", D: "↓ 下", L: "← 左" };
document.querySelector("#app").innerHTML = `<header><a id="back" href="../../">一覧へ</a><span>GRAVITY VAULT</span><button id="pause">休憩</button></header><main><div class="hud"><span id="time"></span><b id="score"></b><span id="life"></span></div><div id="progress"></div><div class="stage"><canvas aria-label="7×7の重力金庫"></canvas></div><div id="pads" class="pads">${["U", "L", "D", "R"].map((e) => `<button id="pad-${e}" data-direction="${e}" aria-label="${_[e]}へ傾ける">${_[e]}</button>`).join("")}</div><p id="feedback" aria-live="polite"></p><small class="hint">全金塊をGへ。赤いBは壁の陰に残す。</small><small id="storage"></small></main><section id="layer" class="layer"><div id="panel" class="panel"></div></section>`;
const $ = (e) => document.getElementById(e), N = document.querySelector("canvas"), ie = Object.fromEntries(["U", "R", "D", "L"].map((e) => [e, $(`pad-${e}`)])), g = new pe(), E = new ue();
E.set(g.data.volume, g.data.muted);
let c = Q(), oe = {}, B = te, ae = "", y = "title", k, O = performance.now(), I = 0, V = 0, j = false;
const P = () => y === "play" && c.status === "playing", M = de(ie, { active: P, ready: () => F(c) && k === void 0, tilt: (e) => {
  P() && F(c) && k === void 0 && (k = e);
}, pause: H, unlock: () => E.unlock() });
function H() {
  P() && (y = "pause", M.abort(), k = void 0, E.stop(), I = 0, T());
}
function D(e) {
  B && (M.abort(), k = void 0, c = Q(e), y = "play", I = 0, O = performance.now(), E.unlock(), T());
}
function w(e, t, a = false) {
  return `<button id="${e}" ${a ? "disabled" : ""}>${t}</button>`;
}
function T() {
  if ($("layer").hidden = y === "play", $("pads").inert = y !== "play", $("pause").disabled = y !== "play", N.tabIndex = y === "play" ? 0 : -1, y === "play") {
    N.focus();
    return;
  }
  const e = $("panel"), t = `<details><summary>音・演出</summary><label><input id="mute" type="checkbox" ${g.data.muted ? "checked" : ""}>消音</label><label>音量 <input id="volume" type="range" min="0" max="1" step=".05" value="${g.data.volume}"></label><label><input id="light" type="checkbox" ${g.data.light ? "checked" : ""}>弱い演出</label></details>`;
  y === "title" && (e.innerHTML = `<p class="eyebrow">GRAVITY VAULT · 60秒</p><h1>金庫ごと、<br>ひっくり返せ。</h1><p>金塊をまとめてGへ。<br>危険カプセルBは、壁の陰に置き去りに。</p><p>BEST <b>${g.data.best}</b></p><p class="artstatus">${B ? "画像の準備完了" : ae || "画像を読み込み中…"}</p><div class="actions">${w("start", "すぐ遊ぶ", !B)}${w("help", "説明を見る")}${w("practice", "練習する", !B)}</div>${t}`), y === "help" && (e.innerHTML = `<h1>盤面ごと傾けよう。</h1><p>方向キー／4つのpadで1回ずつ重力を変更。全ての金塊とBが同じ方向へ壁・物体まで滑ります。Gは通った瞬間に吸収します。</p><p>1手の滑走は0.45秒、その間は追加操作を予約しません。動けない方向も1手・0.15秒。後列の金塊は先の金塊が空けた場所まで進みます。</p><p>金塊は1個200点。同じ手でまとめるほど＋100/＋200/＋300点。4個同時なら1400点。Bが入るとLIFE−1、Bはその室から消えます。</p><p>6室を60秒・LIFE3で攻略。1室の金塊4個で次へ（Bは残してOK）。途中失敗も正式BEST対象。Sは全室・無傷・36手以内・4個一括。</p><p>Escape／休憩で停止。練習は初室の1室だけ、BEST対象外。</p><div class="actions">${w("start", "遊ぶ", !B)}${w("practice", "練習", !B)}${w("title", "タイトル")}</div>`), y === "pause" && (e.innerHTML = `<h1>休憩中</h1><p>時計・滑走・部屋移動を停止しています。<br>操作の予約は残していません。</p><div class="actions">${w("resume", "再開")}${w("retry", "やり直す")}${w("title", "タイトルへ")}</div>${t}`), y === "result" && (e.innerHTML = `<p class="eyebrow">${c.practice ? "練習 · BEST対象外" : "重力金庫の搬出結果"}</p><h1>${c.status === "clear" ? c.practice ? "まとめて回収！" : "全6室、搬出完了！" : "搬出終了"}</h1><p class="resultscore">${c.score}<small>点 ${c.practice ? "" : ce(c)}</small></p><p>${c.reason}<br>${c.gold}/${c.practice ? 4 : 24}個 · ${c.cleared}/${c.practice ? 1 : 6}室 · ${c.steps}手<br>最大${c.maxBatch}個一括 · 被害${c.damage} · LIFE ${c.life}</p><p>経過 ${(c.tick / G).toFixed(2)}秒 ${c.practice ? "" : `／ BEST ${g.data.best}`}</p><div class="actions">${w("retry", c.practice ? "もう一度練習" : "もう一度遊ぶ")}${c.practice ? w("start", "本番へ", !B) : ""}${w("title", "タイトルへ")}</div>`);
  const a = (o, n) => e.querySelector(`#${o}`)?.addEventListener("click", n);
  a("start", () => D(false)), a("practice", () => D(true)), a("retry", () => D(c.practice)), a("help", () => {
    y = "help", T();
  }), a("title", () => {
    M.abort(), k = void 0, E.stop(), y = "title", T();
  }), a("resume", () => {
    M.abort(), k = void 0, O = performance.now(), I = 0, y = "play", E.unlock(), T();
  }), e.querySelector("#mute")?.addEventListener("change", (o) => {
    g.data.muted = o.target.checked, g.write(), E.set(g.data.volume, g.data.muted);
  }), e.querySelector("#volume")?.addEventListener("input", (o) => {
    g.data.volume = Number(o.target.value), g.write(), E.set(g.data.volume, g.data.muted);
  }), e.querySelector("#light")?.addEventListener("change", (o) => {
    g.data.light = o.target.checked, g.write();
  }), e.querySelector("button:not(:disabled)")?.focus();
}
function re() {
  $("time").textContent = c.practice ? "練習" : `${Math.max(0, (R - c.tick) / G).toFixed(1)}秒`, $("score").textContent = `${c.score}点`, $("life").textContent = `LIFE ${c.life}`, $("progress").textContent = `第${c.room + 1}/${c.practice ? 1 : 6}室 · 金塊 ${c.roomGold}/4 · ${c.steps}手 · 最大${c.maxBatch}個`, $("feedback").textContent = c.message, $("storage").textContent = g.persistent ? "BEST・設定はこのブラウザに保存" : "保存できません：このページ内の記録のみ";
  for (const e of Object.values(ie)) e.disabled = y !== "play" || !F(c) || k !== void 0;
}
$("pause").addEventListener("click", H);
function K(e) {
  if (j) return;
  const t = Math.max(0, (e - O) / 1e3);
  if (O = e, P()) if (t > 0.5) H();
  else for (I += t; I >= 1 / G && P(); ) {
    const a = c.phase, o = le(c, k);
    k = void 0, I -= 1 / G;
    for (const n of o) E.play(n);
    (a !== c.phase || o.some((n) => n.type === "lever" || n.type === "empty")) && M.abort(), c.status !== "playing" && (M.abort(), g.result(c.score, c.practice), y = "result", T());
  }
  re(), he(N, c, oe, te, g.data.light || matchMedia("(prefers-reduced-motion: reduce)").matches), V = requestAnimationFrame(K);
}
T();
re();
V = requestAnimationFrame(K);
fe().then((e) => {
  oe = e, B = true, (y === "title" || y === "help") && T();
}).catch(() => {
  ae = "BLOCKED_ART：必要な画像がありません。通常プレイは準備中。", (y === "title" || y === "help") && T();
});
window.addEventListener("pagehide", () => {
  j = true, cancelAnimationFrame(V), E.dispose();
});
window.addEventListener("pageshow", (e) => {
  e.persisted && (j = false, O = performance.now(), I = 0, V = requestAnimationFrame(K));
});
