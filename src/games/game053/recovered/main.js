(function() {
  const a = document.createElement("link").relList;
  if (a && a.supports && a.supports("modulepreload")) return;
  for (const s of document.querySelectorAll('link[rel="modulepreload"]')) r(s);
  new MutationObserver((s) => {
    for (const l of s) if (l.type === "childList") for (const t of l.addedNodes) t.tagName === "LINK" && t.rel === "modulepreload" && r(t);
  }).observe(document, { childList: true, subtree: true });
  function i(s) {
    const l = {};
    return s.integrity && (l.integrity = s.integrity), s.referrerPolicy && (l.referrerPolicy = s.referrerPolicy), s.crossOrigin === "use-credentials" ? l.credentials = "include" : s.crossOrigin === "anonymous" ? l.credentials = "omit" : l.credentials = "same-origin", l;
  }
  function r(s) {
    if (s.ep) return;
    s.ep = true;
    const l = i(s);
    fetch(s.href, l);
  }
})();
const U = () => ({ x: 300, y: 500, vx: -230, vy: 0, heading: Math.PI, hp: 3, invuln: 0, time: 0 });
function $(e) {
  return Math.hypot(e.vx, e.vy) < 1e-8 ? 0 : Math.abs(Math.atan2(Math.sin(e.heading - Math.atan2(e.vy, e.vx)), Math.cos(e.heading - Math.atan2(e.vy, e.vx)))) * 180 / Math.PI;
}
function X(e, a, i, r = 1 / 120) {
  e.time += r, e.invuln = Math.max(0, e.invuln - r), e.heading += Math.max(-1, Math.min(1, a)) * (i ? 2.8 : 1.5) * r;
  const s = i ? 220 : 230, l = 1 - Math.exp(-(i ? 3.2 : 10) * r);
  e.vx += (Math.cos(e.heading) * s - e.vx) * l, e.vy += (Math.sin(e.heading) * s - e.vy) * l, e.x += e.vx * r, e.y += e.vy * r;
  let t = false;
  for (const u of ["x", "y"]) {
    const c = u === "x" ? "vx" : "vy";
    e[u] < 36 && (e[u] = 36, e[c] = Math.abs(e[c]) * 0.2, t = true), e[u] > 564 && (e[u] = 564, e[c] = -Math.abs(e[c]) * 0.2, t = true);
  }
  return t && e.invuln <= 0 && (e.hp--, e.invuln = 0.8), { hit: t, effective: i && Math.hypot(e.vx, e.vy) >= 140 && $(e) >= 15 && $(e) <= 70 };
}
const oe = Array.from({ length: 56 }, (e, a) => {
  const i = 1 + Math.floor(a / 8), r = a % 8, s = i * Math.PI / 4 + (r - 3.5) * 0.065;
  return { id: a + 8, x: 300 + Math.cos(s) * 210, y: 300 + Math.sin(s) * 210, taken: false };
}), Z = [{ id: 0, x: 180, y: 300, r: 18 }, { id: 1, x: 390, y: 340, r: 18 }, { id: 2, x: 320, y: 170, r: 18 }], W = 120, O = 6e3, _ = 21100;
function le() {
  const e = U(), a = [];
  for (let i = 1; i <= 246; i++) X(e, 1, true), i >= 78 && (i - 78) % 24 === 0 && a.push({ id: a.length, x: e.x, y: e.y, taken: false });
  return a;
}
function Q(e = false) {
  const a = le();
  return e || a.push(...oe.map((i) => ({ ...i }))), { car: U(), medals: a, bag: [], banked: 0, score: 0, maxBank: 0, drifting: false, status: "run", practice: e, events: [], tick: 0, damage: 0, lost: 0, effective: false, reason: "" };
}
function ce(e) {
  e.status === "run" && (e.drifting = true);
}
function ue(e) {
  if (!e.drifting || e.status !== "run") return false;
  e.drifting = false, e.effective = false;
  const a = e.bag.length;
  return e.score += 100 * a * Math.min(3, 1 + Math.floor(a / 5)), e.banked += a, e.maxBank = Math.max(e.maxBank, a), e.bag = [], a && e.events.push({ kind: "bank", n: a }), e.practice && a >= 5 && (e.status = "clear", e.reason = "5個以上のドリフト確定成功", e.events.push({ kind: "finish", n: 1 })), true;
}
function ee(e) {
  e.drifting = false, e.effective = false;
}
function fe(e) {
  return e.status !== "clear" ? "—" : e.maxBank >= 10 && e.damage === 0 ? "S" : e.maxBank >= 8 ? "A" : "B";
}
function he(e, a, i, r, s, l, t) {
  const u = i - e, c = r - a, f = u * u + c * c, d = f ? Math.max(0, Math.min(1, ((s - e) * u + (l - a) * c) / f)) : 0;
  return Math.hypot(e + u * d - s, a + c * d - l) <= t;
}
function de(e, a) {
  if (e.status !== "run") return;
  e.tick++;
  const i = e.car.hp, r = { x: e.car.x, y: e.car.y }, s = X(e.car, a, e.drifting);
  if (!e.practice) for (const l of Z) {
    const t = e.car.x - l.x, u = e.car.y - l.y, c = Math.hypot(t, u), f = l.r + 12;
    if (c >= f) continue;
    const d = c > 1e-8 ? t / c : Math.cos(e.car.heading + Math.PI), m = c > 1e-8 ? u / c : Math.sin(e.car.heading + Math.PI);
    e.car.x = l.x + d * f, e.car.y = l.y + m * f;
    const w = e.car.vx * d + e.car.vy * m;
    w < 0 && (e.car.vx -= 1.2 * w * d, e.car.vy -= 1.2 * w * m), e.car.invuln <= 0 && (e.car.hp--, e.car.invuln = 0.8);
  }
  if (e.car.hp < i) {
    const l = Math.floor(e.bag.length / 2);
    e.lost += e.bag.length - l, e.bag = e.bag.slice(0, l), e.damage++, e.events.push({ kind: "damage", n: 1 });
  }
  e.effective = s.effective && Math.hypot(e.car.vx, e.car.vy) >= 140 && $(e.car) >= 15 && $(e.car) <= 70;
  for (const l of e.medals) !l.taken && he(r.x, r.y, e.car.x, e.car.y, l.x, l.y, 20) && (l.taken = true, e.effective ? e.bag.push(l.id) : (e.score += 50, e.banked++), e.events.push({ kind: "pickup", n: e.bag.length }));
  e.tick === O - 360 && !e.practice && e.events.push({ kind: "warning", n: 3 }), e.car.hp <= 0 ? (e.status = "over", e.reason = "LIFEが0。確定済み点は保持") : e.tick >= O && !e.practice && (e.status = e.banked >= 30 ? "clear" : "over", e.reason = e.status === "clear" ? "30個以上を確定して完走" : "50秒終了：未確定バッグは数えません", e.status === "clear" && (e.score += 1e3 + e.car.hp * 300)), e.status !== "run" && e.events.push({ kind: "finish", n: e.status === "clear" ? 1 : 0 });
}
function pe(e, a, i) {
  const r = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set();
  let t = false, u = null, c = null, f = 0, d = false;
  const m = (n) => {
    if (n !== null) for (l.add(n), t = true; l.size > 16; ) l.delete(l.values().next().value);
  };
  window.addEventListener("pointerdown", (n) => {
    n.button === 0 && (n.isPrimary || n.pointerType === "touch") && (l.delete(n.pointerId), t = false);
  }, true), window.addEventListener("click", (n) => {
    const h = n.pointerId;
    (typeof h == "number" && h >= 0 ? l.has(h) : t) && n.detail > 0 && (n.preventDefault(), n.stopImmediatePropagation());
  }, true);
  const w = (n) => n.code || { a: "KeyA", d: "KeyD", " ": "Space" }[n.key.toLowerCase()] || n.key, p = (n, h) => {
    if (h !== null && n.hasPointerCapture(h)) try {
      n.releasePointerCapture(h);
    } catch {
    }
  }, F = () => {
    s.clear(), d = false, f = 0;
  }, C = () => {
    const n = u, h = c;
    u = c = null, m(n), m(h), F(), p(e, n), p(a, h);
  }, P = (n) => n.button === 0 && (n.isPrimary || n.pointerType === "touch"), q = (n) => {
    const h = e.getBoundingClientRect();
    return Math.max(-1, Math.min(1, ((n.clientX - h.left) / Math.max(1, h.width) - 0.5) * 4));
  };
  e.addEventListener("pointerdown", (n) => {
    !i.active() || u !== null || n.pointerId === c || !P(n) || (n.preventDefault(), s.clear(), u = n.pointerId, f = q(n), e.setPointerCapture(n.pointerId), i.unlock());
  }), e.addEventListener("pointermove", (n) => {
    n.pointerId === u && i.active() && (n.preventDefault(), f = q(n));
  }), e.addEventListener("pointerup", (n) => {
    if (n.pointerId !== u) return;
    const h = u;
    u = null, f = 0, m(h), p(e, h);
  }), a.addEventListener("pointerdown", (n) => {
    !i.active() || c !== null || d || n.pointerId === u || !P(n) || (n.preventDefault(), c = n.pointerId, a.setPointerCapture(n.pointerId), i.unlock(), i.begin());
  }), a.addEventListener("pointerup", (n) => {
    if (n.pointerId !== c) return;
    const h = c;
    c = null, m(h), p(a, h), i.active() && i.release();
  });
  for (const [n, h] of [[e, "steer"], [a, "drift"]]) for (const B of ["pointercancel", "lostpointercapture"]) n.addEventListener(B, (se) => {
    const T = se.pointerId;
    h === "steer" && u === T ? (u = null, f = 0, m(T), p(n, T), i.cancel()) : h === "drift" && c === T && (c = null, m(T), p(n, T), i.cancel());
  });
  const Y = (n, h) => {
    const B = r.has(h);
    r.add(h), !(!i.active() || n.repeat || B) && (i.unlock(), h === "Space" || h === "Enter" ? c === null && !d && (d = true, i.begin()) : u === null && s.add(h));
  };
  window.addEventListener("keydown", (n) => {
    if (n.target instanceof HTMLInputElement || n.ctrlKey || n.metaKey || n.altKey) return;
    const h = w(n);
    if (h === "Escape") {
      i.active() && !n.repeat && i.pause();
      return;
    }
    ["KeyA", "KeyD", "ArrowLeft", "ArrowRight", "Space"].includes(h) && (i.active() && n.preventDefault(), Y(n, h));
  }), window.addEventListener("keyup", (n) => {
    const h = w(n);
    r.delete(h), s.delete(h), h === "Space" && d && (d = false, i.active() && i.release());
  }), a.addEventListener("keydown", (n) => {
    w(n) === "Enter" && (n.preventDefault(), Y(n, "Enter"));
  }), a.addEventListener("keyup", (n) => {
    w(n) === "Enter" && (n.preventDefault(), r.delete("Enter"), d && (d = false, i.active() && i.release()));
  }), a.addEventListener("click", (n) => {
    n.detail === 0 && i.active() && c === null && !d && !r.has("Space") && !r.has("Enter") && (i.unlock(), i.begin(), i.release());
  });
  for (const n of [e, a]) n.addEventListener("contextmenu", (h) => h.preventDefault());
  const A = () => {
    C(), r.clear(), i.pause();
  };
  return window.addEventListener("blur", A), window.addEventListener("resize", A), window.addEventListener("pagehide", A), document.addEventListener("visibilitychange", () => {
    document.hidden && A();
  }), matchMedia("(orientation:portrait)").addEventListener("change", A), { abort: C, pauseKeys: F, steer: () => i.active() ? u !== null ? f : Number(s.has("KeyD") || s.has("ArrowRight")) - Number(s.has("KeyA") || s.has("ArrowLeft")) : 0, owners: () => ({ steer: u, drift: c }) };
}
const J = "100gare:game053:rules1";
class me {
  data = { rulesVersion: 1, best: 0, volume: 0.35, muted: false, light: false };
  persistent = true;
  storage = null;
  constructor(a) {
    try {
      this.storage = a ?? window.localStorage;
      const i = this.storage.getItem(J);
      if (i === null) return;
      const r = JSON.parse(i);
      if (!r || Array.isArray(r) || r.rulesVersion !== 1 || typeof r.best != "number" || !Number.isInteger(r.best) || r.best < 0 || r.best > _ || r.best % 50 !== 0 || typeof r.volume != "number" || !Number.isFinite(r.volume) || r.volume < 0 || r.volume > 1 || typeof r.muted != "boolean" || typeof r.light != "boolean") {
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
      this.storage.setItem(J, JSON.stringify(this.data));
    } catch {
      this.persistent = false;
    }
  }
  result(a, i) {
    !i && Number.isInteger(a) && a >= 0 && a <= _ && a % 50 === 0 && (this.data.best = Math.max(a, this.data.best), this.write());
  }
}
class ve {
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
  set(a, i) {
    this.volume = a, this.muted = i, this.context && this.master && this.master.gain.setValueAtTime(i ? 0 : a, this.context.currentTime), (i || a === 0) && this.stop();
  }
  remove(a, i = true) {
    const r = this.voices.indexOf(a);
    if (!(r < 0)) {
      if (this.voices.splice(r, 1), i) try {
        a.source.stop();
      } catch {
      }
      a.source.disconnect(), a.gain.disconnect();
    }
  }
  room() {
    if (!this.context || !this.master || this.muted || this.volume === 0) return false;
    for (const a of [...this.voices]) a.until < this.context.currentTime && this.remove(a);
    for (; this.voices.length >= 24; ) this.remove(this.voices[0]);
    return true;
  }
  tone(a, i, r, s = 0, l = "triangle", t = 0.08) {
    if (!this.room()) return;
    const u = this.context, c = u.currentTime + s, f = u.createOscillator(), d = u.createGain();
    f.type = l, f.frequency.setValueAtTime(a, c), f.frequency.exponentialRampToValueAtTime(Math.max(1, i), c + r), d.gain.setValueAtTime(1e-4, c), d.gain.exponentialRampToValueAtTime(t, c + 7e-3), d.gain.exponentialRampToValueAtTime(1e-4, c + r), f.connect(d), d.connect(this.master);
    const m = { source: f, gain: d, until: c + r };
    this.voices.push(m), f.onended = () => this.remove(m, false), f.start(c), f.stop(c + r + 0.01);
  }
  noise(a, i, r = 0.07) {
    if (!this.room()) return;
    const s = this.context, l = s.createBufferSource(), t = s.createGain(), u = s.createBiquadFilter(), c = s.createBuffer(1, Math.ceil(s.sampleRate * a), s.sampleRate), f = c.getChannelData(0);
    for (let m = 0; m < f.length; m++) f[m] = (Math.random() * 2 - 1) * (1 - m / f.length);
    l.buffer = c, u.type = "bandpass", u.frequency.value = i, l.connect(u), u.connect(t), t.connect(this.master), t.gain.setValueAtTime(r, s.currentTime), t.gain.exponentialRampToValueAtTime(1e-4, s.currentTime + a);
    const d = { source: l, gain: t, until: s.currentTime + a };
    this.voices.push(d), l.onended = () => {
      u.disconnect(), this.remove(d, false);
    }, l.start(), l.stop(s.currentTime + a + 0.01);
  }
  slide(a, i) {
    const r = Math.min(1, Math.max(0, a / 70)) * Math.min(1, i / 220);
    this.noise(0.12, 500 + a * 16, 0.025 + r * 0.05), this.tone(65 + i * 0.15, 65 + i * 0.15, 0.1, 0, "sawtooth", 0.012);
  }
  play(a, i = 0) {
    if (a === "press" && (this.tone(170, 120, 0.06, 0, "square", 0.045), this.noise(0.05, 1600, 0.035)), a === "pickup" && (this.tone(620 + i % 10 * 70, 780 + i % 10 * 75, 0.1), this.tone(1320, 1560, 0.07, 0.02, "sine", 0.04)), a === "bank" && (this.stop(), this.noise(0.23, 2200, 0.13), this.tone(100, 55, 0.3, 0, "sine", 0.18), [523, 659, 784].forEach((r, s) => this.tone(r, r, 0.23, 0.045 * s, "triangle", 0.09)), i >= 10 && this.tone(1047, 1047, 0.35, 0.13)), a === "damage") {
      for (const r of this.voices) this.context && r.gain.gain.setTargetAtTime(0.01, this.context.currentTime, 0.01);
      this.noise(0.2, 140, 0.17), this.tone(210, 45, 0.3, 0, "sawtooth", 0.1);
    }
    a === "warning" && (this.tone(320, 320, 0.1, 0, "square", 0.05), this.tone(320, 320, 0.1, 0.2, "square", 0.05)), a === "finish" && (i ? [523, 659, 784, 1047].forEach((r, s) => this.tone(r, r, 0.35, 0.08 * s)) : (this.tone(196, 98, 0.3), this.tone(147, 73, 0.35, 0.18)));
  }
  stop() {
    for (const a of [...this.voices]) this.remove(a);
  }
  dispose() {
    this.stop(), this.context && this.context.close().catch(() => {
    }), this.context = null, this.master = null;
  }
}
const te = ["yard", "cart", "wheel", "driver-normal", "driver-joy", "medal", "pylon"];
async function ye() {
  return Object.fromEntries(await Promise.all(te.map(async (e) => {
    const a = new Image();
    return a.src = new URL(`assets/${e}.webp`, document.baseURI).href, await a.decode(), [e, a];
  })));
}
function ge(e, a, i, r, s, l) {
  const t = e.getContext("2d");
  if (!t) return;
  const u = Math.max(1, Math.round(e.clientWidth * Math.min(2, window.devicePixelRatio || 1)));
  e.width !== u && (e.width = e.height = u), t.setTransform(u / 600, 0, 0, u / 600, 0, 0), t.fillStyle = "#15263b", t.fillRect(0, 0, 600, 600);
  const c = (p, F, C, P, q = "#eef2e0") => {
    t.font = `bold ${P}px system-ui,sans-serif`, t.textAlign = "center", t.fillStyle = q, t.fillText(p, F, C);
  };
  if (i.yard && (t.globalAlpha = 0.65, t.drawImage(i.yard, 0, 0, 600, 600), t.globalAlpha = 1), Object.keys(i).length !== te.length) {
    c("画像を準備中", 300, 300, 28);
    return;
  }
  if (t.strokeStyle = "#f1ad58", t.lineWidth = 5, t.strokeRect(24, 24, 552, 552), t.strokeStyle = "#97b7b32b", t.lineWidth = 2, t.setLineDash([10, 12]), t.beginPath(), t.arc(300, 300, 210, 0, Math.PI * 2), t.stroke(), t.setLineDash([]), !s && l.length > 1) {
    t.strokeStyle = "#b5d3bb88", t.lineWidth = 3, t.beginPath(), t.moveTo(l[0].x, l[0].y);
    for (const p of l) t.lineTo(p.x, p.y);
    t.stroke();
  }
  if (!a.practice) for (const p of Z) i.pylon ? t.drawImage(i.pylon, p.x - 23, p.y - 25, 46, 46) : (t.fillStyle = "#f5a156", t.beginPath(), t.arc(p.x, p.y, p.r, 0, Math.PI * 2), t.fill()), t.strokeStyle = "#ffd9a1", t.lineWidth = 2, t.beginPath(), t.arc(p.x, p.y, p.r, 0, Math.PI * 2), t.stroke();
  for (const p of a.medals) p.taken || (i.medal ? t.drawImage(i.medal, p.x - 10, p.y - 10, 20, 20) : (t.fillStyle = "#edac4e", t.beginPath(), t.arc(p.x, p.y, 8, 0, Math.PI * 2), t.fill()));
  const f = a.car;
  if (t.save(), t.translate(f.x, f.y), t.rotate(f.heading), t.fillStyle = "#070f1888", t.beginPath(), t.ellipse(0, 3, 23, 17, 0, 0, Math.PI * 2), t.fill(), i.wheel) for (const p of [-15, 15]) t.drawImage(i.wheel, -8, p - 5, 16, 10);
  i.cart ? t.drawImage(i.cart, -23, -18, 46, 36) : (t.fillStyle = "#b6e56b", t.fillRect(-19, -13, 38, 26), t.fillStyle = "#f1f5d7", t.fillRect(8, -9, 7, 18)), t.strokeStyle = a.effective ? "#ffe28b" : "#d7e6c9", t.lineWidth = 3, t.beginPath(), t.moveTo(15, 0), t.lineTo(36, 0), t.stroke(), a.effective && (t.fillStyle = "#ffd464", t.beginPath(), t.arc(-21, -12, 4, 0, Math.PI * 2), t.arc(-21, 12, 4, 0, Math.PI * 2), t.fill()), t.restore();
  const d = Math.atan2(f.vy, f.vx), m = 38;
  t.strokeStyle = "#8ed3f1", t.lineWidth = 3, t.beginPath(), t.moveTo(f.x, f.y), t.lineTo(f.x + Math.cos(d) * m, f.y + Math.sin(d) * m), t.stroke(), f.invuln > 0 && (t.strokeStyle = "#e5f8ff", t.lineWidth = 2, t.beginPath(), t.arc(f.x, f.y, 27, 0, Math.PI * 2), t.stroke()), c(`滑り角 ${$(f).toFixed(0)}°`, 300, 566, 19, a.effective ? "#ffe18d" : "#c9dae5");
  const w = i[a.status === "clear" ? "driver-joy" : "driver-normal"];
  w && t.drawImage(w, 526, 518, 60, 68);
}
const ae = false;
document.querySelector("#app").innerHTML = '<header><a id="back" href="../../">一覧へ</a><span>DRIFT DELIVERY</span><button id="pause">休憩</button></header><main><div class="hud"><span id="time"></span><b id="score"></b><span id="life"></span></div><div id="bag"></div><div id="signal"></div><div class="stage"><canvas aria-label="600×600の玩具配送場"></canvas></div><div class="controls"><div id="steer" role="group" aria-label="左半分で左、右半分で右へ操舵"><b>← 操舵 →</b><small>A/D・左右キー<br>中央はまっすぐ</small></div><button id="drift" aria-label="DRIFT保持、離すと確定">DRIFT<small>Space保持 → 離して確定</small></button></div><p id="feedback" aria-live="polite"></p><small id="storage"></small></main><section id="layer" class="layer"><div id="panel" class="panel"></div></section>';
const g = (e) => document.getElementById(e), H = document.querySelector("canvas"), y = new me(), x = new ve();
x.set(y.data.volume, y.data.muted);
let o = Q(), v = "title", ie = {}, k = ae, ne = "", D = [], I = [], R = performance.now(), E = 0, j = 0, V = 0, z = false;
const S = () => v === "play" && o.status === "run", L = pe(g("steer"), g("drift"), { active: S, begin: () => {
  S() && (I.push("begin"), x.play("press"));
}, release: () => {
  S() && I.push("release");
}, cancel: () => K(true), pause: () => K(), unlock: () => x.unlock() });
function K(e = false) {
  S() && (v = "pause", I = [], ee(o), e ? L.pauseKeys() : L.abort(), x.stop(), E = 0, M());
}
function N(e) {
  k && (L.abort(), I = [], o = Q(e), j = 0, D = [], v = "play", R = performance.now(), E = 0, x.unlock(), M());
}
const b = (e, a, i = false) => `<button id="${e}" ${i ? "disabled" : ""}>${a}</button>`;
function M() {
  if (g("layer").hidden = v === "play", g("steer").inert = v !== "play", g("drift").disabled = v !== "play", g("pause").disabled = v !== "play", H.tabIndex = v === "play" ? 0 : -1, v === "play") {
    H.focus();
    return;
  }
  const e = g("panel"), a = `<details><summary>音・演出</summary><label><input id="mute" type="checkbox" ${y.data.muted ? "checked" : ""}>消音</label><label>音量 <input id="volume" type="range" min="0" max="1" step=".05" value="${y.data.volume}"></label><label><input id="light" type="checkbox" ${y.data.light ? "checked" : ""}>弱い演出</label></details>`;
  v === "title" && (e.innerHTML = `<p class="eyebrow">DRIFT DELIVERY · 50秒</p><h1>横滑りで、<br>根こそぎ。</h1><p>曲がりながら拾う。<br>離した瞬間、積んだ分だけボーナス。</p><p>BEST <b>${y.data.best}</b></p><p class="artstatus">${k ? "画像の準備完了" : ne || "画像を読み込み中…"}</p><div class="actions">${b("start", "すぐ遊ぶ", !k)}${b("help", "説明を見る")}${b("practice", "練習する", !k)}</div>${a}`), v === "help" && (e.innerHTML = `<h1>向きと慣性で、横滑り。</h1><p>A/D・左右キーで操舵、Space保持でドリフト。スマホは左padの左/右を押して操舵し、もう1本の指でDRIFTを保持。左右を離すと直進します。</p><p>実速140以上・車の向きと速度の差15〜70°で有効ドリフト。火花灯が目印。保持して直進するだけなら通常回収です。通常は50点即確定、有効中は1個100点をバッグへ。</p><p>DRIFTを正しく離すと一括確定。5個で×2、10個で×3。壁/パイロンはLIFE−1、未確定バッグ半分切捨て、0.8秒無敵。取得IDは戻りません。</p><p>50秒で30個以上確定しLIFEを残せばclear。未確定は終了時に数えません。Sはclear・10個一括・無被弾、Aは8個一括。clear1000＋LIFE×300。</p><p>cancel/背景化/Escapeはpause、勝手に確定しません。再開後の新しいDRIFT press→releaseで残ったバッグを確定できます。練習は8個コーナー、5個以上を一度に確定で成功。</p><div class="actions">${b("start", "遊ぶ", !k)}${b("practice", "練習", !k)}${b("title", "タイトル")}</div>`), v === "pause" && (e.innerHTML = `<h1>休憩中</h1><p>時計とカートを停止。バッグ${o.bag.length}個は未確定のままです。<br>再開後に新しくDRIFTを押して離すと確定できます。</p><div class="actions">${b("resume", "再開")}${b("retry", "やり直す")}${b("title", "タイトルへ")}</div>${a}`), v === "result" && (e.innerHTML = `<p class="eyebrow">${o.practice ? "練習 · BEST対象外" : "配送場の回収結果"}</p><h1>${o.status === "clear" ? o.practice ? "滑って、確定成功！" : "回収クリア！" : "走行終了"}</h1><p class="resultscore">${o.score}<small>点 ${o.practice ? "" : fe(o)}</small></p><p>${o.reason}<br>確定 ${o.banked}個 · 最大一括 ${o.maxBank}個<br>LIFE ${o.car.hp} · 被弾${o.damage} · 衝突で失った未確定${o.lost}個</p><p>未確定バッグ${o.bag.length}個は得点/確定数に含めません。</p><div class="actions">${b("retry", o.practice ? "もう一度練習" : "もう一度遊ぶ")}${o.practice ? b("start", "本番へ", !k) : ""}${b("title", "タイトルへ")}</div>`);
  const i = (r, s) => e.querySelector(`#${r}`)?.addEventListener("click", s);
  i("start", () => N(false)), i("practice", () => N(true)), i("retry", () => N(o.practice)), i("help", () => {
    v = "help", M();
  }), i("title", () => {
    L.abort(), I = [], ee(o), x.stop(), v = "title", M();
  }), i("resume", () => {
    L.abort(), I = [], R = performance.now(), E = 0, v = "play", x.unlock(), M();
  }), e.querySelector("#mute")?.addEventListener("change", (r) => {
    y.data.muted = r.target.checked, y.write(), x.set(y.data.volume, y.data.muted);
  }), e.querySelector("#volume")?.addEventListener("input", (r) => {
    y.data.volume = Number(r.target.value), y.write(), x.set(y.data.volume, y.data.muted);
  }), e.querySelector("#light")?.addEventListener("change", (r) => {
    y.data.light = r.target.checked, y.write();
  }), e.querySelector("button:not(:disabled)")?.focus();
}
function re() {
  g("time").textContent = o.practice ? "練習" : `${Math.max(0, (O - o.tick) / W).toFixed(1)}秒`, g("score").textContent = `${o.score}点`, g("life").textContent = `LIFE ${o.car.hp}`, g("bag").textContent = `確定 ${o.banked}${o.practice ? "" : "/30"}個 · バッグ ${o.bag.length}個 ×${Math.min(3, 1 + Math.floor(o.bag.length / 5))}`, g("signal").textContent = o.effective ? "✦ 有効ドリフト：バッグへ100点/個" : o.drifting ? "DRIFT保持中 · 角度/速度の条件を満たすと有効" : "通常走行：50点/個を即確定", g("signal").classList.toggle("lit", o.effective), g("drift").setAttribute("aria-pressed", String(o.drifting)), g("feedback").textContent = o.tick >= O - 360 && !o.practice ? "離して確定！ 未確定分は終了時に入りません" : o.bag.length >= 5 ? "いま離せば倍率で確定。続けるほど衝突リスク" : "向きの矢印は白、速度の矢印は青", g("storage").textContent = y.persistent ? "BEST・設定はこのブラウザに保存" : "保存できません：このページ内の記録のみ";
}
g("pause").addEventListener("click", () => K());
function G(e) {
  if (z) return;
  const a = Math.max(0, (e - R) / 1e3);
  if (R = e, S()) if (a > 0.5) K();
  else for (E += a; E >= 1 / W && S(); ) {
    for (const i of I) i === "begin" ? ce(o) : ue(o);
    I = [], de(o, L.steer()), E -= 1 / W;
    for (const i of o.events.slice(j)) x.play(i.kind, i.n);
    j = o.events.length, o.effective && o.tick % 6 === 0 && (D.push({ x: o.car.x, y: o.car.y }), D.length > 120 && D.shift()), o.drifting && o.tick % 12 === 0 && x.slide($(o.car), Math.hypot(o.car.vx, o.car.vy)), o.status !== "run" && (L.abort(), y.result(o.score, o.practice), v = "result", M());
  }
  re(), ge(H, o, ie, ae, y.data.light || matchMedia("(prefers-reduced-motion: reduce)").matches, D), V = requestAnimationFrame(G);
}
M();
re();
V = requestAnimationFrame(G);
ye().then((e) => {
  ie = e, k = true, (v === "title" || v === "help") && M();
}).catch(() => {
  ne = "BLOCKED_ART：必要な画像がありません。通常プレイは準備中。", (v === "title" || v === "help") && M();
});
window.addEventListener("pagehide", () => {
  z = true, cancelAnimationFrame(V), x.dispose();
});
window.addEventListener("pageshow", (e) => {
  e.persisted && (z = false, R = performance.now(), E = 0, V = requestAnimationFrame(G));
});
