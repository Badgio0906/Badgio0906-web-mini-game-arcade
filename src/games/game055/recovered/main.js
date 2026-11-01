(function() {
  const t = document.createElement("link").relList;
  if (t && t.supports && t.supports("modulepreload")) return;
  for (const n of document.querySelectorAll('link[rel="modulepreload"]')) a(n);
  new MutationObserver((n) => {
    for (const l of n) if (l.type === "childList") for (const o of l.addedNodes) o.tagName === "LINK" && o.rel === "modulepreload" && a(o);
  }).observe(document, { childList: true, subtree: true });
  function i(n) {
    const l = {};
    return n.integrity && (l.integrity = n.integrity), n.referrerPolicy && (l.referrerPolicy = n.referrerPolicy), n.crossOrigin === "use-credentials" ? l.credentials = "include" : n.crossOrigin === "anonymous" ? l.credentials = "omit" : l.credentials = "same-origin", l;
  }
  function a(n) {
    if (n.ep) return;
    n.ep = true;
    const l = i(n);
    fetch(n.href, l);
  }
})();
const T = [{ p: [[100, 140], [380, 140], [380, 340], [100, 340]], target: 50 }, { p: [[100, 140], [380, 140], [380, 340], [100, 340]], target: 25 }, { p: [[240, 100], [400, 360], [80, 360]], target: 60 }, { p: [[240, 90], [400, 240], [240, 390], [80, 240]], target: 40 }, { p: [[240, 90], [390, 190], [340, 360], [140, 360], [90, 190]], target: 33 }, { p: [[160, 100], [320, 100], [410, 240], [320, 380], [160, 380], [70, 240]], target: 67 }, { p: [[150, 120], [330, 120], [410, 360], [70, 360]], target: 50 }, { p: [[100, 140], [300, 100], [400, 220], [320, 370], [120, 340]], target: 30 }].map((e) => ({ polygon: e.p.map(([t, i]) => ({ x: t, y: i })), target: e.target })), p = 1e-8, b = { x: 20, y: 460 }, _ = (e) => Math.abs(e.reduce((t, i, a) => {
  const n = e[(a + 1) % e.length];
  return t + i.x * n.y - n.x * i.y;
}, 0)) / 2;
function A(e, t, i) {
  return (i.x - t.x) * (e.y - t.y) - (i.y - t.y) * (e.x - t.x);
}
function Z(e, t, i, a = 1) {
  const n = [];
  for (let l = 0; l < e.length; l++) {
    const o = e[l], c = e[(l + 1) % e.length], f = A(o, t, i) * a, r = A(c, t, i) * a;
    if (f >= -p && n.push({ ...o }), f > p && r < -p || f < -p && r > p) {
      const s = f / (f - r);
      n.push({ x: o.x + (c.x - o.x) * s, y: o.y + (c.y - o.y) * s });
    }
  }
  return n;
}
function ee(e, t, i) {
  const a = Math.hypot(i.x - t.x, i.y - t.y);
  if (a < 40) return { valid: false, cancel: true, reason: "40px以上の線を引こう", ratio: 0, piece: [] };
  const n = A(b, t, i);
  if (Math.abs(n) <= p * a) return { valid: false, cancel: true, reason: "皿印を通る線は選べません", ratio: 0, piece: [] };
  const l = Z(e, t, i, Math.sign(n)), o = _(e), c = _(l);
  return { valid: c > p && c < o - p, cancel: false, reason: c <= p || c >= o - p ? "ケーキを二つに分けよう" : "", ratio: o ? c / o * 100 : 0, piece: l };
}
function te(e) {
  const t = Math.sin(e.angle), i = Math.cos(e.angle), a = 240 + Math.cos(e.angle) * e.offset, n = 240 - Math.sin(e.angle) * e.offset;
  return { a: { x: a - t * 300, y: n - i * 300 }, b: { x: a + t * 300, y: n + i * 300 } };
}
function ue(e, t) {
  const i = [], { a, b: n } = t;
  if (Math.hypot(n.x - a.x, n.y - a.y) <= p) return null;
  for (let o = 0; o < e.length; o++) {
    const c = e[o], f = e[(o + 1) % e.length], r = A(c, a, n), s = A(f, a, n);
    if (Math.abs(r) <= p && i.push({ ...c }), r > p && s < -p || r < -p && s > p) {
      const g = r / (r - s);
      i.push({ x: c.x + (f.x - c.x) * g, y: c.y + (f.y - c.y) * g });
    }
  }
  const l = i.filter((o, c) => i.findIndex((f) => Math.hypot(o.x - f.x, o.y - f.y) <= p) === c);
  return l.sort((o, c) => (o.x - c.x) * (n.x - a.x) + (o.y - c.y) * (n.y - a.y)), l.length < 2 ? null : { a: l[0], b: l[l.length - 1] };
}
const E = 120, N = 624, ie = 96, J = 9e3;
function ne(e = false) {
  return { tick: 0, time: 0, index: 0, started: 0, servingUntil: 0, phase: "aim", practice: e, status: "run", guide: { offset: 0, angle: 0 }, draft: null, score: 0, perfect: 0, good: 0, safe: 0, miss: 0, streak: 0, triples: 0, outcomes: [], notice: "左下の皿印側が取り分。一本の線で指定割合を狙おう", events: [] };
}
function fe(e) {
  return e <= 3 + p ? "PERFECT" : e <= 8 + p ? "GOOD" : e <= 15 + p ? "SAFE" : "MISS";
}
function I(e) {
  return e.status === "run" && e.phase === "aim";
}
function ae(e) {
  return e.practice ? null : Math.max(0, (N - (e.tick - e.started)) / E);
}
const L = (e) => Number.isFinite(e.x) && Number.isFinite(e.y), de = (e) => ({ a: { ...e.a }, b: { ...e.b } });
function pe(e, t) {
  return !I(e) || e.draft || !L(t) ? false : (e.draft = { a: { ...t }, b: { ...t } }, true);
}
function he(e, t) {
  return !I(e) || !e.draft || !L(t) ? false : (e.draft.b = { ...t }, true);
}
function me(e, t = true) {
  e.draft = null, t && I(e) && (e.notice = "操作を取消。時間はそのまま進みます", e.events.push({ kind: "cancel", n: 0 }));
}
function re(e, t) {
  const i = { ...t, id: e.index, at: e.tick, target: T[e.index].target, bonus: 0 };
  i.grade === "PERFECT" ? (e.perfect++, e.streak++, e.streak === 3 && (e.streak = 0, e.triples++, i.bonus = 500, e.events.push({ kind: "triple", n: e.triples }))) : (e.streak = 0, i.grade === "GOOD" ? e.good++ : i.grade === "SAFE" ? e.safe++ : e.miss++), e.score += i.points + i.bonus, e.outcomes.push(i), e.draft = null, e.phase = "serve", e.servingUntil = e.tick + ie, e.events.push({ kind: i.grade.toLowerCase(), n: 1 }), e.notice = i.ratio === null ? i.reason : `${i.grade} · 実際 ${i.ratio.toFixed(1)}％ / 目標 ${i.target}％${i.bonus ? " · 三連 +500" : ""}`;
}
function le(e, t) {
  if (!I(e) || !e.practice && e.tick - e.started >= N || !L(t.a) || !L(t.b)) return "blocked";
  const i = T[e.index], a = ee(i.polygon, t.a, t.b);
  if (a.cancel) return e.draft = null, e.notice = a.reason, e.events.push({ kind: "cancel", n: 0 }), "cancel";
  const n = a.valid ? Math.abs(a.ratio - i.target) : null, l = n === null ? "MISS" : fe(n), o = a.valid ? Z(i.polygon, t.a, t.b, -Math.sign(A(b, t.a, t.b))) : i.polygon.map((c) => ({ ...c }));
  return e.events.push({ kind: "cut", n: 1 }), re(e, { ratio: a.valid ? a.ratio : null, error: n, grade: l, points: l === "PERFECT" ? 1e3 : l === "GOOD" ? 500 : l === "SAFE" ? 200 : 0, reason: a.valid ? "" : a.reason, line: de(t), piece: a.valid ? a.piece : [], other: o }), "accepted";
}
function ge(e, t) {
  if (!e.draft) return "blocked";
  if (!L(t)) return e.draft = null, "blocked";
  const i = { a: { ...e.draft.a }, b: { ...t } };
  return e.draft = null, le(e, i);
}
function ye(e) {
  return e.draft ? "blocked" : le(e, te(e.guide));
}
function xe(e, t = 0, i = 0) {
  if (e.status === "run") {
    if (e.phase === "aim" && !e.draft) {
      const a = Number.isFinite(t) ? Math.max(-1, Math.min(1, t)) : 0, n = Number.isFinite(i) ? Math.max(-1, Math.min(1, i)) : 0;
      e.guide.offset = Math.max(-280, Math.min(280, e.guide.offset + a * 120 / E));
      const l = e.guide.angle + n * 1.2 / E;
      e.guide.angle = Math.atan2(Math.sin(l), Math.cos(l));
    }
    if (e.tick++, e.time = e.tick / E, e.phase === "aim" && !e.practice && (e.tick - e.started === N - E && e.events.push({ kind: "warning", n: 1 }), e.tick - e.started >= N && re(e, { ratio: null, error: null, grade: "MISS", points: 0, reason: "時間切れ。ケーキはそのまま配膳します", line: null, piece: [], other: T[e.index].polygon.map((a) => ({ ...a })) })), e.phase === "serve" && e.tick >= e.servingUntil) {
      if (e.practice || e.index === T.length - 1) {
        e.status = e.perfect + e.good >= (e.practice ? 1 : 5) ? "clear" : "over";
        return;
      }
      e.index++, e.started = e.tick, e.phase = "aim", e.guide = { offset: 0, angle: 0 }, e.draft = null, e.notice = `第${e.index + 1}皿。取り分${T[e.index].target}％を狙おう`, e.events.push({ kind: "plate", n: e.index + 1 });
    }
  }
}
function be(e) {
  return e.status !== "clear" ? "C" : e.practice ? "練習成功" : e.perfect >= 6 && e.miss === 0 ? "S" : e.perfect >= 4 ? "A" : "B";
}
function ve(e, t, i) {
  let a = null;
  const n = /* @__PURE__ */ new Set(), l = (r) => r.code || { " ": "Space", ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", ArrowUp: "ArrowUp", ArrowDown: "ArrowDown", Escape: "Escape" }[r.key] || r.key, o = (r = false) => {
    const s = a;
    if (a = null, n.clear(), i.cancel(r), e.removeAttribute("data-drag"), s !== null && e.hasPointerCapture(s)) try {
      e.releasePointerCapture(s);
    } catch {
    }
  }, c = (r) => {
    const s = e.getBoundingClientRect();
    return { x: Math.max(0, Math.min(480, (r.clientX - s.left) / Math.max(1, s.width) * 480)), y: Math.max(0, Math.min(480, (r.clientY - s.top) / Math.max(1, s.height) * 480)) };
  };
  e.addEventListener("pointerdown", (r) => {
    !i.active() || a !== null || !r.isPrimary || r.button !== 0 || (r.preventDefault(), a = r.pointerId, n.clear(), e.setPointerCapture(a), e.setAttribute("data-drag", ""), i.unlock(), i.begin(c(r)));
  }), e.addEventListener("pointermove", (r) => {
    a === r.pointerId && i.active() && (r.preventDefault(), i.drag(c(r)));
  }), e.addEventListener("pointerup", (r) => {
    if (a !== r.pointerId) return;
    const s = a;
    a = null, e.removeAttribute("data-drag"), i.active() ? i.release(c(r)) : i.cancel(false), e.hasPointerCapture(s) && e.releasePointerCapture(s);
  });
  for (const r of ["pointercancel", "lostpointercapture"]) e.addEventListener(r, (s) => {
    a === s.pointerId && o(true);
  });
  e.addEventListener("contextmenu", (r) => r.preventDefault()), t.addEventListener("pointerdown", (r) => {
    !i.active() || a !== null || !r.isPrimary || r.button !== 0 || (r.preventDefault(), i.unlock(), i.confirm("button"));
  }), t.addEventListener("keydown", (r) => {
    l(r) === "Enter" && (r.preventDefault(), !(!i.active() || a !== null || r.repeat || n.has("Enter")) && (n.add("Enter"), i.unlock(), i.confirm("enter")));
  }), t.addEventListener("click", (r) => {
    r.detail === 0 && i.active() && a === null && (i.unlock(), i.confirm("accessibility"));
  }), window.addEventListener("keydown", (r) => {
    if (r.target instanceof HTMLInputElement || r.ctrlKey || r.metaKey || r.altKey) return;
    const s = l(r);
    if (s === "Escape") {
      r.repeat || i.pause();
      return;
    }
    !i.active() || a !== null || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(s) || (r.preventDefault(), !(r.repeat || n.has(s)) && (n.add(s), i.unlock(), s === "Space" && i.confirm("space")));
  }), window.addEventListener("keyup", (r) => n.delete(l(r)));
  const f = () => {
    o(), i.pause();
  };
  return window.addEventListener("blur", f), window.addEventListener("resize", f), window.addEventListener("pagehide", f), document.addEventListener("visibilitychange", () => {
    document.hidden && f();
  }), matchMedia("(orientation:portrait)").addEventListener("change", f), { abort: o, axes: () => a === null ? { translate: Number(n.has("ArrowRight")) - Number(n.has("ArrowLeft")), rotate: Number(n.has("ArrowUp")) - Number(n.has("ArrowDown")) } : { translate: 0, rotate: 0 } };
}
class ke {
  context = null;
  voices = /* @__PURE__ */ new Set();
  peak = 0;
  master = null;
  noise = null;
  volume = 0.35;
  muted = false;
  rewardUntil = 0;
  async unlock() {
    try {
      if (this.context ??= new AudioContext(), !this.master) {
        const t = this.context;
        this.master = t.createGain();
        const i = t.createDynamicsCompressor();
        i.threshold.value = -18, i.ratio.value = 9, this.master.connect(i).connect(t.destination), this.noise = t.createBuffer(1, t.sampleRate, t.sampleRate);
        const a = this.noise.getChannelData(0);
        let n = 5516;
        for (let l = 0; l < a.length; l++) n = Math.imul(n, 1664525) + 1013904223 >>> 0, a[l] = n / 2147483648 - 1;
      }
      this.master.gain.value = this.muted ? 0 : this.volume * 0.45, await this.context.resume();
    } catch {
    }
  }
  note(t, i, a, n, l = 0, o = "sine") {
    const c = this.context, f = this.master;
    if (!c || !f || c.state !== "running" || this.muted || this.volume === 0 || this.voices.size >= 24) return;
    const r = c.createOscillator(), s = c.createGain(), g = c.currentTime + l;
    r.type = o, r.frequency.setValueAtTime(t, g), r.frequency.exponentialRampToValueAtTime(i, g + a), s.gain.setValueAtTime(1e-4, g), s.gain.linearRampToValueAtTime(n, g + 5e-3), s.gain.exponentialRampToValueAtTime(1e-4, g + a), r.connect(s).connect(f), this.voices.add(r), this.peak = Math.max(this.peak, this.voices.size), r.onended = () => {
      this.voices.delete(r), r.disconnect(), s.disconnect();
    }, r.start(g), r.stop(g + a + 0.01);
  }
  swish(t, i, a) {
    const n = this.context, l = this.master;
    if (!n || !l || !this.noise || n.state !== "running" || this.muted || this.volume === 0 || this.voices.size >= 24) return;
    const o = n.createBufferSource(), c = n.createBiquadFilter(), f = n.createGain();
    o.buffer = this.noise, c.type = "highpass", c.frequency.value = t, f.gain.setValueAtTime(a, n.currentTime), f.gain.exponentialRampToValueAtTime(1e-4, n.currentTime + i), o.connect(c).connect(f).connect(l), this.voices.add(o), this.peak = Math.max(this.peak, this.voices.size), o.onended = () => {
      this.voices.delete(o), o.disconnect(), c.disconnect(), f.disconnect();
    }, o.start(), o.stop(n.currentTime + i);
  }
  play(t) {
    const i = this.context;
    if (!i || this.muted || this.volume === 0) return;
    const a = i.currentTime < this.rewardUntil ? 0.45 : 1;
    if (t === "cut") this.swish(2400, 0.12, 0.07 * a), this.note(700, 190, 0.11, 0.025 * a, 0, "triangle");
    else if (t === "perfect") {
      this.rewardUntil = i.currentTime + 0.35, this.note(160, 95, 0.13, 0.055, 0, "triangle");
      for (let n = 0; n < 3; n++) this.note([659, 880, 1175][n], [659, 880, 1175][n], 0.21, 0.05, n * 0.045);
    } else if (t === "good") this.note(450, 670, 0.15, 0.05), this.note(880, 1100, 0.1, 0.03, 0.03);
    else if (t === "safe") this.note(330, 440, 0.12, 0.04, 0, "triangle");
    else if (t === "triple") {
      this.rewardUntil = i.currentTime + 0.5, this.swish(1800, 0.22, 0.035);
      for (let n = 0; n < 5; n++) this.note([392, 523, 659, 784, 1047][n], [392, 523, 659, 784, 1047][n], 0.26, 0.05, n * 0.045);
    } else if (t === "miss") this.note(240, 100, 0.17, 0.045, 0, "triangle"), this.note(720, 510, 0.09, 0.02, 0.04);
    else if (t === "cancel") this.note(360, 300, 0.06, 0.02, 0, "triangle");
    else if (t === "warning") this.note(680, 620, 0.06, 0.02), this.note(680, 620, 0.06, 0.02, 0.14);
    else if (t === "clear") for (let n = 0; n < 5; n++) this.note([330, 440, 554, 660, 880][n], [330, 440, 554, 660, 880][n], 0.27, 0.05, n * 0.06);
    else t === "over" ? this.note(330, 180, 0.24, 0.04, 0, "triangle") : this.note(540, 680, 0.06, 0.025);
  }
  set(t, i) {
    this.volume = Math.max(0, Math.min(1, t)), this.muted = i, (i || this.volume === 0) && this.stop(), this.master && (this.master.gain.value = i ? 0 : this.volume * 0.45);
  }
  stop() {
    for (const t of this.voices) try {
      t.stop();
    } catch {
    }
    this.voices.clear();
  }
}
const X = "100gare:game055:rules1";
class we {
  data = { rulesVersion: 1, best: 0, volume: 0.35, muted: false, light: false };
  persistent = true;
  storage = null;
  constructor(t) {
    try {
      this.storage = t ?? window.localStorage;
      const i = this.storage.getItem(X);
      if (i === null) return;
      const a = JSON.parse(i);
      if (!a || a.rulesVersion !== 1 || typeof a.best != "number" || !Number.isInteger(a.best) || a.best < 0 || a.best > J || a.best % 100 !== 0 || typeof a.volume != "number" || !Number.isFinite(a.volume) || a.volume < 0 || a.volume > 1 || typeof a.muted != "boolean" || typeof a.light != "boolean") {
        this.persistent = false;
        return;
      }
      this.data = { rulesVersion: 1, best: a.best, volume: a.volume, muted: a.muted, light: a.light };
    } catch {
      this.persistent = false;
    }
  }
  write() {
    if (this.persistent && this.storage) try {
      this.storage.setItem(X, JSON.stringify(this.data));
    } catch {
      this.persistent = false;
    }
  }
  result(t, i) {
    !i && Number.isInteger(t) && t >= 0 && t <= J && t % 100 === 0 && (this.data.best = Math.max(this.data.best, t), this.write());
  }
}
const Se = ["patisserie", "chef-normal", "chef-pose", "cake-1", "cake-2", "cake-3", "cake-side", "plate"];
async function Me(e) {
  const t = {};
  return await Promise.all(Se.map(async (i) => {
    const a = new Image();
    a.src = `./assets/${i}.webp`, await a.decode(), t[i] = a;
  })), t;
}
function O(e, t) {
  if (e.beginPath(), !!t.length) {
    e.moveTo(t[0].x, t[0].y);
    for (const i of t.slice(1)) e.lineTo(i.x, i.y);
    e.closePath();
  }
}
function V(e, t, i, a, n, l) {
  const o = Math.min(n / t.naturalWidth, l / t.naturalHeight), c = t.naturalWidth * o, f = t.naturalHeight * o;
  e.drawImage(t, i + (n - c) / 2, a + (l - f) / 2, c, f);
}
function D(e, t, i, a, n = { x: 0, y: 0 }) {
  if (t.length < 3) return;
  e.save(), e.translate(n.x, n.y + 9), O(e, t), e.fillStyle = "#d8b68a", e.fill(), i["cake-side"] && (e.save(), e.clip(), e.drawImage(i["cake-side"], 0, 0, 480, 480), e.restore()), e.translate(0, -9), O(e, t), e.fillStyle = "#fff3d8", e.fill(), e.save(), e.clip();
  const l = i[`cake-${a % 3 + 1}`];
  if (l) e.drawImage(l, 0, 0, 480, 480);
  else {
    e.fillStyle = "#d96b76";
    for (let o = 105; o < 390; o += 51) for (let c = 90; c < 410; c += 53) e.beginPath(), e.arc(c, o, 7, 0, Math.PI * 2), e.fill();
  }
  e.restore(), O(e, t), e.strokeStyle = "#a66556", e.lineWidth = 2, e.stroke(), e.restore();
}
function Ee(e, t, i, a) {
  const n = t.line;
  if (!n || t.piece.length < 3) {
    D(e, t.other, a, t.id);
    return;
  }
  const l = n.b.x - n.a.x, o = n.b.y - n.a.y, c = Math.hypot(l, o), f = Math.sign(A(b, n.a, n.b)), r = { x: -o / c * f, y: l / c * f }, s = Math.min(12, i * 25);
  D(e, t.other, a, t.id, { x: -r.x * s, y: -r.y * s }), D(e, t.piece, a, t.id, { x: r.x * s, y: r.y * s });
}
function Te(e, t, i, a, n) {
  const l = e.canvas, o = l.parentElement, c = Math.max(1, Math.min(o.clientWidth - 2, o.clientHeight - 2));
  l.style.width = `${c}px`, l.style.height = `${c}px`;
  const f = Math.max(1, Math.floor(c * Math.min(devicePixelRatio || 1, 2)));
  if ((l.width !== f || l.height !== f) && (l.width = f, l.height = f), e.setTransform(f / 480, 0, 0, f / 480, 0, 0), e.fillStyle = "#fff1e5", e.fillRect(0, 0, 480, 480), i.patisserie && (e.drawImage(i.patisserie, 0, 0, 480, 480), e.fillStyle = "#fff5e8ba", e.fillRect(0, 0, 480, 480)), !i["chef-normal"]) {
    e.fillStyle = "#864850", e.font = "19px system-ui", e.textAlign = "center", e.fillText("美術素材を準備しています", 240, 260), e.textAlign = "left";
    return;
  }
  const r = T[t.index], s = t.phase === "serve" ? t.outcomes.at(-1) : null, g = s ? Math.min(1, (t.tick - s.at) / ie) : 0;
  e.fillStyle = "#a74354", e.font = "bold 31px system-ui", e.fillText(`目標 ${r.target}％`, 18, 38), e.fillStyle = "#785e54", e.font = "18px system-ui", e.fillText(`${t.index + 1}/${t.practice ? 1 : 8} 皿`, 370, 33);
  const K = ae(t);
  if (e.font = "15px system-ui", e.fillText(t.phase === "serve" ? "両側とも配膳中" : K === null ? "練習 · 時間無制限" : `あと ${K.toFixed(1)} 秒で切断`, 18, 64), i.plate ? V(e, i.plate, 42, 82, 396, 326) : (e.fillStyle = "#fffaf1", e.strokeStyle = "#cfb88a", e.lineWidth = 3, e.beginPath(), e.ellipse(240, 261, 196, 156, 0, 0, Math.PI * 2), e.fill(), e.stroke()), s ? Ee(e, s, a ? Math.min(g, 0.3) : g, i) : D(e, r.polygon, i, t.index), s) {
    if (e.textAlign = "center", e.font = "bold 24px system-ui", e.fillStyle = s.grade === "PERFECT" ? "#a47d20" : s.grade === "MISS" ? "#9c5361" : "#8c675b", e.fillText(s.grade, 240, 87), e.font = "17px system-ui", e.fillText(s.ratio === null ? s.reason : `実際 ${s.ratio.toFixed(1)}％ · 誤差 ${s.error.toFixed(1)}pt`, 240, 416), s.grade === "PERFECT" && !a) {
      e.strokeStyle = "#d4ac49", e.lineWidth = 3, e.globalAlpha = Math.max(0, 1 - g), e.beginPath(), e.arc(240, 240, 85 + g * 50, 0, Math.PI * 2), e.stroke();
      for (let h = 0; h < 24; h++) {
        const v = h * 2.39996, S = 35 + g * 100;
        e.fillStyle = h % 2 ? "#ffe4b4" : "#e8b3b7", e.beginPath(), e.arc(240 + Math.cos(v) * S, 240 + Math.sin(v) * S * 0.55, 3, 0, Math.PI * 2), e.fill();
      }
      e.globalAlpha = 1;
    }
    if (s.bonus) {
      e.fillStyle = "#aa7b24", e.font = "bold 18px system-ui", e.fillText("三段プレート +500", 240, 112);
      for (let h = 0; h < 3; h++) e.fillStyle = "#fff6dc", e.strokeStyle = "#c49b45", e.lineWidth = 2, e.beginPath(), e.ellipse(420, 439 - h * 14, 24 - h * 4, 6, 0, 0, Math.PI * 2), e.fill(), e.stroke();
    }
    e.textAlign = "left";
  } else {
    const h = t.draft ?? te(t.guide), v = ee(r.polygon, h.a, h.b);
    !v.cancel && v.piece.length >= 3 && (O(e, v.piece), e.fillStyle = "#b34e7130", e.fill());
    const S = Math.hypot(h.b.x - h.a.x, h.b.y - h.a.y) >= 40 ? ue(r.polygon, h) : null;
    e.strokeStyle = v.cancel ? "#8f7b77" : v.valid ? "#a13c55" : "#ad6b58", e.lineWidth = 3, e.beginPath();
    const P = S ?? (t.draft ? h : null);
    if (P && (e.moveTo(P.a.x, P.a.y), e.lineTo(P.b.x, P.b.y), e.stroke()), S) for (const z of [S.a, S.b]) e.fillStyle = "#fff8e6", e.beginPath(), e.arc(z.x, z.y, 4, 0, 7), e.fill(), e.stroke();
  }
  i.plate ? V(e, i.plate, b.x - 13, b.y - 11, 26, 22) : (e.fillStyle = "#fff8df", e.strokeStyle = "#a77f38", e.lineWidth = 2, e.beginPath(), e.ellipse(b.x, b.y, 13, 8, 0, 0, Math.PI * 2), e.fill(), e.stroke()), e.fillStyle = "#8c3d54", e.beginPath(), e.arc(b.x, b.y, 3, 0, 7), e.fill(), e.font = "14px system-ui", e.fillText("← 皿印側が取り分", 40, 466);
  const B = i[s?.grade === "PERFECT" || t.status === "clear" ? "chef-pose" : "chef-normal"];
  B && V(e, B, 365, 400, 70, 77);
}
const d = (e) => document.getElementById(e), F = document.querySelector("canvas"), Ae = F.getContext("2d"), k = d("layer"), $e = false, m = new we(), x = new ke();
let oe = {}, M = "";
try {
  oe = await Me($e);
} catch {
  M = "美術素材を準備中です。通常版は素材を配置してから遊べます。";
}
let u = ne(), y = "title", U = performance.now(), $ = 0, G = false, w = () => {
};
x.set(m.data.volume, m.data.muted);
function W(e) {
  document.body.classList.toggle("playing", e), d("control-panel").inert = !e, F.tabIndex = e ? 0 : -1, d("pause").disabled = !e;
}
function Y() {
  return `<div class="settings"><label><input id="mute" type="checkbox" ${m.data.muted ? "checked" : ""}>消音</label><label>音量<input id="volume" type="range" min="0" max="1" step=".05" value="${m.data.volume}"></label><label><input id="light" type="checkbox" ${m.data.light ? "checked" : ""}>軽量演出</label></div>`;
}
function j() {
  for (const e of ["mute", "volume", "light"]) d(e).oninput = () => {
    m.data.muted = d("mute").checked, m.data.volume = +d("volume").value, m.data.light = d("light").checked, m.write(), x.set(m.data.volume, m.data.muted);
  };
}
function C(e = false) {
  M || (w(), x.stop(), u = ne(e), y = "run", G = false, $ = 0, U = performance.now(), k.hidden = true, W(true), F.focus({ preventScroll: true }), x.unlock().then(() => {
    y === "run" && x.play("ui");
  }));
}
function q() {
  w(), x.stop(), y = "title", R();
}
function R() {
  k.hidden = false, W(false), y === "title" ? (k.innerHTML = `<article class="card"><span class="badge">CAKE CUT SHOW / 試遊版</span><h1>ケーキ、<br>ピタ斬り。</h1><p>このケーキの33％、一刀でどうぞ。切る場所と角度を見積もり、両側ともおいしく配膳。</p>${M ? `<p class="warning">${M}</p>` : ""}<div class="actions"><button id="play" ${M ? "disabled" : ""}>すぐ遊ぶ</button><button id="practice" ${M ? "disabled" : ""}>50％を練習</button><button id="help">遊び方を見る</button><a href="../../">ゲーム一覧へ</a></div>${Y()}<p class="small">BEST ${m.data.best} / 保存<span id="save-state">${m.persistent ? "端末内" : "不可・ページ内のみ"}</span></p></article>`, d("play").onclick = () => C(), d("practice").onclick = () => C(true), d("help").onclick = () => {
    y = "help", R();
  }, j()) : y === "help" ? (k.innerHTML = `<article class="card"><h2>左下の皿へ、指定の取り分を。</h2><p>ケーキ上をドラッグし、離すと一本の直線で切ります。短い線や皿印を通る線は取消で、時間は進みます。切る前に実際の割合や正解位置は表示しません。</p><p>左下の皿印側が取り分。薄い着色で側を確かめてください。線はケーキ両端まで延長され、描いた向きで取り分は反転しません。PCは左右で平行移動、上下で傾き、Space/切断ボタンで確定します。</p><p>誤差3pt以内PERFECT1000、8pt以内GOOD500、15pt以内SAFE200、それ以外/無効/時間切れはMISS。PERFECT三連で一度500点追加。8皿中GOOD以上5皿で成功です。</p><p>各皿5.2秒、配膳0.8秒。早く切れば次へ進み、最大48秒。練習は50％矩形を時間無制限で一度切り、GOOD以上で成功。練習/途中退出はBESTへ書きません。</p><div class="actions"><button id="practice" ${M ? "disabled" : ""}>練習する</button><button id="title">タイトルへ</button></div></article>`, d("practice").onclick = () => C(true), d("title").onclick = q) : y === "pause" ? (k.innerHTML = `<article class="card"><h2>ひと休み</h2><p>ケーキ・入力期限・配膳を止めています。途中の指の線とキーは解除しました。新しい操作から続けてください。</p><div class="actions"><button id="resume">続きから</button><button id="title">タイトルへ（記録なし）</button></div>${Y()}</article>`, d("resume").onclick = () => {
    w(), y = "run", $ = 0, U = performance.now(), k.hidden = true, W(true), F.focus({ preventScroll: true }), x.unlock();
  }, d("title").onclick = q, j()) : y === "result" && (k.innerHTML = `<article class="card"><span class="badge">${u.practice ? "練習 / 記録なし" : u.status === "clear" ? "八皿、配膳完了！" : "次は切る位置と角度を変えてみよう"}</span><h2>${u.practice ? u.status === "clear" ? "取り分、配膳完了！" : "もう一度50％を見積もろう" : `RANK ${be(u)}`}</h2><div class="result-score">${u.score.toLocaleString()} pt</div><p>PERFECT ${u.perfect} / GOOD ${u.good}<br>SAFE ${u.safe} / MISS ${u.miss}<br>三連 ${u.triples}回 · 経過 ${u.time.toFixed(1)}秒<br>BEST ${m.data.best}</p><div class="actions">${u.practice ? '<button id="play">本番へ</button>' : ""}<button id="retry">もう一度</button><button id="title">タイトルへ</button><a href="../../">ゲーム一覧へ</a></div></article>`, u.practice && (d("play").onclick = () => C()), d("retry").onclick = () => C(u.practice), d("title").onclick = q), k.querySelector("button:not(:disabled)")?.focus({ preventScroll: true });
}
function H() {
  y === "run" && (w(), x.stop(), y = "pause", R());
}
function Q(e, t) {
  t === "accepted" && w();
}
const se = ve(F, d("confirm"), { active: () => y === "run" && I(u), begin: (e) => {
  pe(u, e);
}, drag: (e) => {
  he(u, e);
}, release: (e) => Q("release", ge(u, e)), confirm: (e) => Q(e, ye(u)), cancel: (e) => me(u, e), pause: H, unlock: () => {
  x.unlock();
} });
w = se.abort;
d("pause").onclick = H;
window.addEventListener("pagehide", () => x.stop());
R();
function ce(e) {
  performance.now();
  const t = (e - U) / 1e3;
  if (U = e, y === "run") if (t > 0.8) H(), $ = 0;
  else {
    for ($ += t; $ >= 1 / E; ) {
      const n = u.phase, l = u.index, o = se.axes();
      xe(u, o.translate, o.rotate), $ -= 1 / E, (n !== u.phase || l !== u.index) && w();
    }
    for (const n of u.events.splice(0)) x.play(n.kind);
    u.status !== "run" && (w(), G || (G = true, m.result(u.score, u.practice), x.play(u.status === "clear" ? "clear" : "over")), y = "result", R());
  }
  Te(Ae, u, oe, m.data.light || matchMedia("(prefers-reduced-motion:reduce)").matches);
  const i = ae(u);
  d("time").textContent = u.phase === "serve" ? "配膳" : i === null ? "∞" : i.toFixed(1), d("plate-number").textContent = `${u.index + 1}/${u.practice ? 1 : 8}`, d("target").textContent = `${T[u.index].target}％`, d("score").textContent = String(u.score), d("good-count").textContent = `${u.perfect + u.good}/${u.practice ? 1 : 5}`, d("notice").textContent = u.notice, d("confirm").disabled = y === "run" && u.phase !== "aim";
  const a = document.getElementById("save-state");
  a && (a.textContent = m.persistent ? "端末内" : "不可・ページ内のみ"), requestAnimationFrame(ce);
}
requestAnimationFrame(ce);
