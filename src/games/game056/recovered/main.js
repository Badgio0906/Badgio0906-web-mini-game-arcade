(function() {
  const t = document.createElement("link").relList;
  if (t && t.supports && t.supports("modulepreload")) return;
  for (const o of document.querySelectorAll('link[rel="modulepreload"]')) a(o);
  new MutationObserver((o) => {
    for (const c of o) if (c.type === "childList") for (const s of c.addedNodes) s.tagName === "LINK" && s.rel === "modulepreload" && a(s);
  }).observe(document, { childList: true, subtree: true });
  function i(o) {
    const c = {};
    return o.integrity && (c.integrity = o.integrity), o.referrerPolicy && (c.referrerPolicy = o.referrerPolicy), o.crossOrigin === "use-credentials" ? c.credentials = "include" : o.crossOrigin === "anonymous" ? c.credentials = "omit" : c.credentials = "same-origin", c;
  }
  function a(o) {
    if (o.ep) return;
    o.ep = true;
    const c = i(o);
    fetch(o.href, c);
  }
})();
const H = ["M", "P", "C"], W = "M P C M M M M P C P P P P C M C C C C M P M P C".split(" "), F = [{ role: "M", name: "ドリル", shape: "▲", task: "金属壁", color: "#e3aa68", key: "1" }, { role: "P", name: "送風機", shape: "●", task: "紙の群れ", color: "#90d6de", key: "2" }, { role: "C", name: "マグネット", shape: "∪", task: "大きな貨物", color: "#e8c9b2", key: "3" }], P = 120, T = 240, se = Math.ceil(0.12 * P), _ = 8900;
function Z(e = false) {
  return { practice: e, tick: 0, index: 0, head: 0, pending: null, switchAt: 0, battery: [3, 3, 3], rear: [0, 0, 0], reserved: false, life: 4, success: 0, damage: 0, score: 0, trios: 0, history: [], status: "playing", last: null };
}
function re(e) {
  return e.status !== "clear" ? "—" : e.success >= 21 && e.damage === 0 && e.trios >= 2 ? "S" : e.success >= 20 && e.trios >= 2 ? "A" : "B";
}
function ne(e, t = {}) {
  if (e.status !== "playing") return [];
  const i = [];
  t.select !== void 0 && Number.isInteger(t.select) && t.select >= 0 && t.select < 3 && (t.select === e.head ? e.pending = null : e.pending !== t.select && (e.pending = t.select, e.switchAt = e.tick + se, i.push({ type: "switch", robot: t.select }))), t.retreat !== void 0 && t.retreat !== e.reserved && (e.reserved = t.retreat, i.push({ type: e.reserved ? "reserve" : "cancel" })), e.tick++;
  for (let d = 0; d < 3; d++) if (d === e.head) e.rear[d] = 0;
  else if (++e.rear[d] >= T) {
    e.rear[d] = 0;
    const u = e.battery[d];
    e.battery[d] = Math.min(3, u + 1), e.battery[d] > u && i.push({ type: "charge", robot: d });
  }
  if (e.pending !== null && e.tick >= e.switchAt && (e.head = e.pending, e.pending = null, e.rear[e.head] = 0, i.push({ type: "ready", robot: e.head })), e.tick % T === T - P / 2 && i.push({ type: "warning" }), e.tick % T !== 0) return i;
  const a = W[e.index];
  let o, c;
  e.reserved ? (o = "evade", c = "退避：電池を温存", e.history = []) : H[e.head] === a && e.battery[e.head] >= 1 ? (o = "success", c = "搬出成功", e.battery[e.head]--, e.success++, e.score += 200, e.history.push(a), e.history.length >= 3 && (new Set(e.history.slice(-3)).size === 3 ? (e.trios++, e.score += 500, e.history = [], i.push({ type: "trio" })) : e.history = e.history.slice(-2))) : (o = "damage", c = H[e.head] !== a ? "役割ちがい" : "電池切れ", e.life--, e.damage++, e.history = []), e.last = { kind: o, task: a, robot: e.head, reason: c, tick: e.tick }, i.push({ type: o, robot: e.head, task: a, reason: c }), e.reserved = false, e.index++;
  const s = e.practice ? 3 : 24;
  return (e.life <= 0 || e.index >= s) && (e.status = e.life > 0 && e.success >= (e.practice ? 3 : 18) ? "clear" : "over", e.status === "clear" && !e.practice && (e.score += 1e3 + e.life * 300), e.pending = null, i.push({ type: "finish", reason: e.status })), i;
}
function oe(e, t, i) {
  const a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set();
  let c = false, s = null;
  const d = (n) => n.code || { 1: "Digit1", 2: "Digit2", 3: "Digit3", " ": "Space", Escape: "Escape" }[n.key] || n.key, u = () => {
    const n = s;
    if (s = null, n) for (o.add(n.id), c = true; o.size > 8; ) o.delete(o.values().next().value);
    if (n && n.target.hasPointerCapture(n.id)) try {
      n.target.releasePointerCapture(n.id);
    } catch {
    }
  };
  window.addEventListener("pointerdown", (n) => {
    n.isPrimary && n.button === 0 && (o.delete(n.pointerId), c = false);
  }, true), window.addEventListener("click", (n) => {
    const b = n.pointerId;
    (typeof b == "number" && b >= 0 ? o.has(b) : c) && n.detail > 0 && (n.preventDefault(), n.stopImmediatePropagation());
  }, true);
  const p = (n, b) => {
    n.addEventListener("pointerdown", (l) => {
      !i.active() || s || !l.isPrimary || l.button !== 0 || (l.preventDefault(), i.unlock(), s = { id: l.pointerId, target: n, action: b }, n.setPointerCapture(l.pointerId));
    }), n.addEventListener("pointerup", (l) => {
      if (!s || s.id !== l.pointerId || s.target !== n) return;
      const R = s;
      s = null;
      const C = n.getBoundingClientRect();
      i.active() && l.clientX >= C.left && l.clientX <= C.right && l.clientY >= C.top && l.clientY <= C.bottom && R.action(), n.hasPointerCapture(l.pointerId) && n.releasePointerCapture(l.pointerId);
    });
    for (const l of ["pointercancel", "lostpointercapture"]) n.addEventListener(l, (R) => {
      s?.id === R.pointerId && u();
    });
    n.addEventListener("keydown", (l) => {
      d(l) === "Enter" && (l.preventDefault(), !(!i.active() || s || l.repeat || a.has("Enter")) && (a.add("Enter"), i.unlock(), b()));
    }), n.addEventListener("click", (l) => {
      l.detail === 0 && i.active() && !s && !a.has("Enter") && !a.has("Space") && (i.unlock(), b());
    }), n.addEventListener("contextmenu", (l) => l.preventDefault());
  };
  e.forEach((n, b) => p(n, () => i.select(b))), p(t, i.reserve), window.addEventListener("keydown", (n) => {
    if (n.target instanceof HTMLInputElement || n.ctrlKey || n.altKey || n.metaKey) return;
    const b = d(n);
    if (!["Digit1", "Digit2", "Digit3", "Space", "Escape"].includes(b)) return;
    const l = a.has(b);
    a.add(b), !(!i.active() || s || l || n.repeat) && (n.preventDefault(), b === "Escape" ? i.pause() : (i.unlock(), b === "Space" ? i.reserve() : i.select(Number(b.slice(-1)) - 1)));
  }), window.addEventListener("keyup", (n) => a.delete(d(n)));
  const m = () => {
    u(), a.clear(), i.pause();
  };
  return window.addEventListener("blur", m), window.addEventListener("resize", m), window.addEventListener("pagehide", m), document.addEventListener("visibilitychange", () => {
    document.hidden && m();
  }), matchMedia("(orientation:portrait)").addEventListener("change", m), { abort: u };
}
const J = "100gare:game056:rules1";
class ce {
  data = { rulesVersion: 1, best: 0, volume: 0.35, muted: false, light: false };
  persistent = true;
  storage = null;
  constructor(t) {
    try {
      this.storage = t ?? window.localStorage;
      const i = this.storage.getItem(J);
      if (i === null) return;
      const a = JSON.parse(i);
      if (!a || Array.isArray(a) || a.rulesVersion !== 1 || typeof a.best != "number" || !Number.isInteger(a.best) || a.best < 0 || a.best > _ || a.best % 100 !== 0 || typeof a.volume != "number" || !Number.isFinite(a.volume) || a.volume < 0 || a.volume > 1 || typeof a.muted != "boolean" || typeof a.light != "boolean") {
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
      this.storage.setItem(J, JSON.stringify(this.data));
    } catch {
      this.persistent = false;
    }
  }
  result(t, i) {
    !i && Number.isInteger(t) && t >= 0 && t <= _ && t % 100 === 0 && (this.data.best = Math.max(this.data.best, t), this.write());
  }
}
class le {
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
  set(t, i) {
    this.volume = t, this.muted = i, this.master && this.context && this.master.gain.setValueAtTime(i ? 0 : t, this.context.currentTime), (i || t === 0) && this.stop();
  }
  tone(t, i, a, o = 0, c = "triangle", s = 0.11) {
    const d = this.context;
    if (!d || !this.master || this.muted || this.volume === 0) return;
    for (this.trim(); this.voices.length >= 24; ) this.remove(this.voices[0]);
    const u = d.currentTime + o, p = d.createOscillator(), m = d.createGain();
    p.type = c, p.frequency.setValueAtTime(t, u), p.frequency.exponentialRampToValueAtTime(Math.max(1, i), u + a), m.gain.setValueAtTime(1e-4, u), m.gain.exponentialRampToValueAtTime(s, u + 8e-3), m.gain.exponentialRampToValueAtTime(1e-4, u + a), p.connect(m), m.connect(this.master);
    const n = { source: p, gain: m, until: u + a };
    this.voices.push(n), p.onended = () => this.remove(n, false), p.start(u), p.stop(u + a + 0.01);
  }
  noise(t, i) {
    const a = this.context;
    if (!a || !this.master || this.muted || this.volume === 0) return;
    for (this.trim(); this.voices.length >= 24; ) this.remove(this.voices[0]);
    const o = a.createBuffer(1, Math.ceil(a.sampleRate * t), a.sampleRate), c = o.getChannelData(0);
    for (let m = 0; m < c.length; m++) c[m] = (Math.random() * 2 - 1) * (1 - m / c.length);
    const s = a.createBufferSource();
    s.buffer = o;
    const d = a.createGain(), u = a.createBiquadFilter();
    u.type = "bandpass", u.frequency.value = i, s.connect(u), u.connect(d), d.connect(this.master), d.gain.setValueAtTime(0.14, a.currentTime), d.gain.exponentialRampToValueAtTime(1e-4, a.currentTime + t);
    const p = { source: s, gain: d, until: a.currentTime + t };
    this.voices.push(p), s.onended = () => {
      u.disconnect(), this.remove(p, false);
    }, s.start(), s.stop(a.currentTime + t + 0.01);
  }
  remove(t, i = true) {
    const a = this.voices.indexOf(t);
    if (!(a < 0)) {
      if (this.voices.splice(a, 1), i) try {
        t.source.stop();
      } catch {
      }
      t.source.disconnect(), t.gain.disconnect();
    }
  }
  trim() {
    if (this.context) for (const t of [...this.voices]) t.until < this.context.currentTime && this.remove(t);
  }
  stop() {
    for (const t of [...this.voices]) this.remove(t);
  }
  play(t) {
    if (!(!this.context || this.muted || this.volume === 0)) {
      if (t.type === "switch" && (this.tone(640, 220, 0.055, 0, "square", 0.06), this.tone(140, 80, 0.09, 0.035)), t.type === "ready" && this.tone(380, 760, 0.08), t.type === "charge" && (this.tone(880, 1100, 0.06, 0, "sine", 0.035), this.tone(1320, 1320, 0.08, 0.06, "sine", 0.035)), (t.type === "reserve" || t.type === "evade") && (this.tone(520, 150, 0.2), this.noise(0.16, 500)), t.type === "cancel" && this.tone(210, 310, 0.05), t.type === "warning" && (this.tone(260, 260, 0.06, 0, "square", 0.035), this.tone(260, 260, 0.06, 0.13, "square", 0.035)), t.type === "success" && (this.tone(110, 55, 0.22, 0, "sine", 0.2), t.task === "M" ? (this.noise(0.24, 1800), this.tone(170, 45, 0.28, 0, "sawtooth")) : t.task === "P" ? (this.noise(0.35, 600), this.tone(420, 1e3, 0.22, 0, "sine", 0.07)) : (this.tone(92, 68, 0.3, 0, "square"), this.tone(740, 180, 0.2, 0.06, "triangle")), this.tone(720, 960, 0.12, 0.08, "sine", 0.09)), t.type === "damage") {
        for (const i of this.voices) i.gain.gain.setTargetAtTime(0.015, this.context.currentTime, 0.015);
        this.noise(0.25, 160), this.tone(190, 45, 0.35, 0, "sawtooth", 0.14);
      }
      t.type === "trio" && [523, 659, 784, 1047].forEach((i, a) => this.tone(i, i, 0.3, 0.045 * a, "triangle", 0.09)), t.type === "finish" && (t.reason === "over" ? (this.tone(220, 165, 0.25), this.tone(147, 73, 0.4, 0.18, "triangle")) : (this.tone(392, 392, 0.25), this.tone(588, 588, 0.3, 0.12), this.tone(784, 784, 0.45, 0.24)));
    }
  }
  dispose() {
    this.stop(), this.context && this.context.close().catch(() => {
    }), this.context = null, this.master = null;
  }
}
const Q = ["factory", "robot-drill", "robot-fan", "robot-magnet", "attack-drill", "attack-fan", "attack-magnet", "wall", "paper", "cargo"];
async function de() {
  const e = await Promise.all(Q.map(async (t) => {
    const i = new Image();
    return i.src = new URL(`assets/${t}.webp`, document.baseURI).href, await i.decode(), [t, i];
  }));
  return Object.fromEntries(e);
}
const ue = (e) => e === "M" ? "wall" : e === "P" ? "paper" : "cargo", pe = ["robot-drill", "robot-fan", "robot-magnet"], fe = ["attack-drill", "attack-fan", "attack-magnet"];
function he(e, t, i, a, o, c) {
  const s = e.getContext("2d");
  if (!s) return;
  const d = Math.min(2, window.devicePixelRatio || 1), u = Math.max(1, Math.round(e.clientWidth * d));
  e.width !== u && (e.width = e.height = u), s.setTransform(u / 480, 0, 0, u / 480, 0, 0);
  const p = (f, v, $, y, x) => {
    s.font = `bold ${y}px system-ui,sans-serif`, s.textAlign = "center", s.fillStyle = x, s.fillText(f, v, $);
  };
  if (s.fillStyle = "#102735", s.fillRect(0, 0, 480, 480), i.factory && (s.globalAlpha = 0.55, s.drawImage(i.factory, 0, 0, 480, 480), s.globalAlpha = 1), Object.keys(i).length !== Q.length) {
    p("画像を準備中", 240, 240, 24, "#fff");
    return;
  }
  s.fillStyle = "#173e4acc", s.fillRect(18, 45, 444, 390), s.strokeStyle = "#afbead", s.lineWidth = 2, s.strokeRect(18, 45, 444, 390);
  const m = t.tick % T / T, n = m >= 0.75, b = W[Math.min(t.index, t.practice ? 2 : 23)], l = t.last && t.tick - t.last.tick < 85 ? t.last : null, R = 85 + m * 118;
  s.setLineDash([8, 8]), s.strokeStyle = "#e6c59b", s.beginPath(), s.moveTo(24, 231), s.lineTo(456, 231), s.stroke(), s.setLineDash([]), p(n ? "接触まで " + ((T - t.tick % T) / 120).toFixed(1) + "秒" : "搬出ライン", 240, 33, 21, n ? "#ffcf7e" : "#e4ede9");
  const C = (f, v, $, y) => {
    const x = i[ue(f)];
    x ? s.drawImage(x, v - y / 2, $ - y / 2, y, y) : (s.fillStyle = f === "M" ? "#a8bdc9" : f === "P" ? "#f4eed7" : "#c58e5e", s.fillRect(v - y * 0.45, $ - y * 0.35, y * 0.9, y * 0.7), p(f, v, $ + 10, 40, "#172732"));
  };
  if (t.status === "playing" && C(b, 240, R, 124), l) {
    const f = (t.tick - l.tick) / 85;
    if (l.kind === "success") {
      s.save(), s.globalAlpha = 1 - f;
      const v = o ? 25 : 100;
      for (const $ of [-1, 1]) s.save(), s.translate(240 + $ * v * f, 210 - 30 * f), s.rotate(o ? 0 : $ * f * 0.7), C(l.task, 0, 0, 100 * (1 - f * 0.25)), s.restore();
      s.restore();
    }
    p(l.reason, 240, 265, 26, l.kind === "damage" ? "#ff9b89" : "#fff0b4");
  }
  for (let f = 0; f < 3; f++) {
    const v = f === t.head, $ = v ? [240, 350] : f === (t.head + 1) % 3 ? [90, 372] : [390, 372];
    let [y, x] = $;
    if (t.reserved && v && (y += 30), !v && c >= 0 && t.tick - c < 100) {
      const O = o ? 0 : Math.sin(Math.PI * (t.tick - c) / 100);
      y += (240 - y) * 0.35 * O, x -= 75 * O;
    }
    const X = i[pe[f]], L = v ? 115 : 82;
    if (X ? s.drawImage(X, y - L / 2, x - L / 2, L, L) : (s.fillStyle = F[f].color, s.fillRect(y - L * 0.4, x - L * 0.4, L * 0.8, L * 0.8), p(F[f].shape, y, x + 12, 40, "#102735")), v && l?.kind === "success") {
      const O = i[fe[f]];
      O && s.drawImage(O, y - 65, x - 125, 130, 100);
    }
    p(v ? "先頭" : "後列", y, x + L / 2 + 22, 18, v ? "#ffe2a0" : "#c4d5da");
  }
  t.pending !== null ? p(`${F[t.pending].name}へ切替中`, 240, 459, 21, "#ffe2a0") : t.reserved ? p("この課題を退避予約中", 240, 459, 21, "#ffe2a0") : p("後列で2秒 → 電池＋1", 240, 459, 19, "#d6e3dd"), c >= 0 && t.tick - c < 120 && (s.fillStyle = "#112e3ee8", s.fillRect(30, 115, 420, 90), p("三位一体！ ＋500", 240, 170, 31, "#ffe19b"));
}
const me = document.querySelector("#app"), z = false;
me.innerHTML = `<header><a id="back" href="../../">一覧へ</a><span>からくり突撃隊</span><button id="pause" aria-label="一時停止">休憩</button></header><main><div class="hud"><span id="time"></span><b id="score"></b><span id="life"></span></div><div class="forecast" id="forecast"></div><div class="stage"><canvas aria-label="玩具工場の搬出ライン"></canvas></div><div class="cards" id="cards">${F.map((e, t) => `<button data-robot="${t}"><b>${e.key} ${e.shape} ${e.name}</b><span class="battery"></span><small></small></button>`).join("")}</div><button id="retreat">Space 退避を予約</button><p id="feedback" aria-live="polite"></p><small id="storage"></small></main><section id="layer" class="layer"><div class="panel" id="panel"></div></section>`;
const w = (e) => document.getElementById(e), K = document.querySelector("canvas"), ee = [...document.querySelectorAll("[data-robot]")], g = new ce(), E = new le();
E.set(g.data.volume, g.data.muted);
let r = Z(), te = {}, A = z, ie = "", h = "title", S = {}, D = performance.now(), I = 0, j = -1e3, B = 0, Y = false;
const N = () => h === "play" && r.status === "playing", q = oe(ee, w("retreat"), { active: N, select: (e) => {
  S.select = e;
}, reserve: () => {
  S.retreat = !(S.retreat ?? r.reserved);
}, pause: G, unlock: () => E.unlock() });
function G() {
  N() && (h = "pause", q.abort(), S = {}, E.stop(), I = 0, M());
}
function V(e) {
  A && (q.abort(), S = {}, I = 0, D = performance.now(), j = -1e3, r = Z(e), h = "play", E.unlock(), M());
}
function k(e, t, i = false) {
  return `<button id="${t}" ${i ? "disabled" : ""}>${e}</button>`;
}
function M() {
  const e = w("layer"), t = w("panel");
  if (e.hidden = h === "play", w("cards").inert = h !== "play", w("retreat").disabled = h !== "play", w("pause").disabled = h !== "play", K.tabIndex = h === "play" ? 0 : -1, h === "play") {
    K.focus();
    return;
  }
  const i = `<details><summary>音・演出</summary><label><input id="mute" type="checkbox" ${g.data.muted ? "checked" : ""}>消音</label><label>音量 <input id="volume" type="range" min="0" max="1" step=".05" value="${g.data.volume}"></label><label><input id="light" type="checkbox" ${g.data.light ? "checked" : ""}>弱い演出</label></details>`;
  h === "title" && (t.innerHTML = `<p class="eyebrow">FRONT SWITCH · 48秒</p><h1>先頭交代！<br>からくり突撃隊</h1><p>得意な一機を前へ。<br>次の2件を見て、電池切れの一戦は退避。</p><p>BEST <b>${g.data.best}</b></p><p class="artstatus">${A ? "画像の準備完了" : ie || "画像を読み込み中…"}</p><div class="actions">${k("すぐ遊ぶ", "start", !A)}${k("説明を見る", "help")}${k("練習する", "practice", !A)}</div>${i}`), h === "help" && (t.innerHTML = `<h1>得意な役割と、電池。</h1><p>金属壁▲→1 ドリル／紙●→2 送風機／貨物∪→3 マグネット。カードをタップしても選べます。</p><p>接触は2秒ごと。切替に0.12秒、その間は元の先頭で判定。成功で電池1消費、後列に連続2秒で1回復（最大3）。</p><p>Space／退避は今の1件を安全にスキップ。もう一度で取消。次へ持ち越しません。成功3件が連続して別の役割なら＋500。</p><p>全24件・18成功以上・LIFEを残すとクリア。成功200点、クリア1000＋残LIFE×300。S：21成功・無被害・連携2回。A：20成功・連携2回。</p><p>Escape／休憩で停止。練習はM/P/Cの3件、BEST対象外。</p><div class="actions">${k("遊ぶ", "start", !A)}${k("練習", "practice", !A)}${k("タイトル", "title")}</div>`), h === "pause" && (t.innerHTML = `<h1>休憩中</h1><p>時計・切替・電池回復は停止中。<br>退避予約は表示どおり保持しています。</p><div class="actions">${k("再開", "resume")}${k("やり直す", "retry")}${k("タイトルへ", "title")}</div>${i}`), h === "result" && (t.innerHTML = `<p class="eyebrow">${r.practice ? "練習 · BEST対象外" : "48秒の搬出結果"}</p><h1>${r.status === "clear" ? r.practice ? "練習成功！" : "搬出クリア！" : r.life <= 0 ? "編隊のLIFEが0" : "成功数が足りません"}</h1><p class="resultscore">${r.score} <small>点 ${r.practice ? "" : re(r)}</small></p><p>成功 ${r.success}/${r.practice ? 3 : 24} · 被害 ${r.damage} · 連携 ${r.trios}<br>LIFE ${r.life} · 退避 ${r.index - r.success - r.damage}</p><p>${r.practice ? "M/P/Cの役割と後列回復を本番で使おう。" : r.last?.reason || ""}</p><div class="actions">${k(r.practice ? "もう一度練習" : "もう一度遊ぶ", "retry")}${r.practice ? k("本番へ", "start", !A) : ""}${k("タイトルへ", "title")}</div>`);
  const a = (o, c) => t.querySelector(`#${o}`)?.addEventListener("click", c);
  a("start", () => V(false)), a("practice", () => V(true)), a("retry", () => V(r.practice)), a("help", () => {
    h = "help", M();
  }), a("title", () => {
    q.abort(), S = {}, E.stop(), h = "title", M();
  }), a("resume", () => {
    q.abort(), S = {}, D = performance.now(), I = 0, h = "play", E.unlock(), M();
  }), t.querySelector("#mute")?.addEventListener("change", (o) => {
    g.data.muted = o.target.checked, g.write(), E.set(g.data.volume, g.data.muted);
  }), t.querySelector("#volume")?.addEventListener("input", (o) => {
    g.data.volume = Number(o.target.value), g.write(), E.set(g.data.volume, g.data.muted);
  }), t.querySelector("#light")?.addEventListener("change", (o) => {
    g.data.light = o.target.checked, g.write();
  }), t.querySelector("button:not(:disabled)")?.focus();
}
w("pause").addEventListener("click", G);
function ae() {
  w("time").textContent = `${r.practice ? "練習" : `${Math.max(0, 48 - r.tick / P).toFixed(1)}秒`} · ${Math.min(r.index + 1, r.practice ? 3 : 24)}/${r.practice ? 3 : 24}`, w("score").textContent = `${r.score}点`, w("life").textContent = `LIFE ${r.life}`;
  const e = W.slice(r.index, r.practice ? 3 : 24);
  w("forecast").innerHTML = e.length ? e.slice(0, 3).map((t, i) => {
    const a = F[H.indexOf(t)];
    return `<span class="${i === 0 ? "now" : ""}"><small>${i === 0 ? "今回" : `次${i}`}</small> ${a.shape} ${a.task}</span>`;
  }).join("") : "<span>全課題を処理しました</span>", ee.forEach((t, i) => {
    t.classList.toggle("selected", r.head === i), t.classList.toggle("pending", r.pending === i), t.setAttribute("aria-pressed", String(r.head === i)), t.querySelector(".battery").textContent = `${"▰".repeat(r.battery[i])}${"▱".repeat(3 - r.battery[i])} ${r.battery[i]}/3`, t.querySelector("small").textContent = r.pending === i ? "切替中" : r.head === i ? "先頭 · 回復なし" : `後列 ${((T - r.rear[i]) / P).toFixed(1)}秒で＋1`;
  }), w("retreat").textContent = r.reserved ? "退避予約中 · Space／タップで取消" : "Space 退避を予約", w("retreat").setAttribute("aria-pressed", String(r.reserved)), w("feedback").textContent = r.last && r.tick - r.last.tick < 120 ? r.last.reason : "次の2件を見て、後列で電池を戻そう", w("storage").textContent = g.persistent ? "BEST・設定はこのブラウザに保存" : "保存できません：このページ内の記録のみ";
}
function U(e) {
  if (Y) return;
  const t = Math.max(0, (e - D) / 1e3);
  if (D = e, N()) if (t > 0.5) G();
  else for (I += t; I >= 1 / P && N(); ) {
    const i = ne(r, S);
    S = {}, I -= 1 / P;
    for (const a of i) E.play(a), a.type === "trio" && (j = r.tick), ["success", "damage", "evade"].includes(a.type) && q.abort();
    r.status !== "playing" && (q.abort(), S = {}, g.result(r.score, r.practice), h = "result", M());
  }
  ae(), he(K, r, te, z, g.data.light || matchMedia("(prefers-reduced-motion: reduce)").matches, j), B = requestAnimationFrame(U);
}
M();
ae();
B = requestAnimationFrame(U);
de().then((e) => {
  te = e, A = true, (h === "title" || h === "help") && M();
}).catch(() => {
  ie = "BLOCKED_ART：必要な画像がありません。通常プレイは準備中。", (h === "title" || h === "help") && M();
});
window.addEventListener("pagehide", () => {
  Y = true, cancelAnimationFrame(B), E.dispose();
});
window.addEventListener("pageshow", (e) => {
  e.persisted && (Y = false, D = performance.now(), I = 0, B = requestAnimationFrame(U));
});
