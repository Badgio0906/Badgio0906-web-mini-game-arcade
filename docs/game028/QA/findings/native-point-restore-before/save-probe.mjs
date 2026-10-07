// src/games/game028/model.ts
function matchWinner(scores, mode) {
  if (Math.max(...scores) < mode) return null;
  if (mode === 11 && Math.abs(scores[0] - scores[1]) < 2) return null;
  return scores[0] > scores[1] ? 0 : 1;
}
function createMatch(mode = 11, difficulty = "easy", practice = false, seed = 28) {
  return { mode, difficulty, practice, scores: [0, 0], firstServer: 0, rally: { id: 1, ball: null, status: "ready", server: 0, winner: null, reason: "", returns: 0, scored: false }, paddles: [0, 0], maxRally: 0, points: 0, clock: 0, seed: seed >>> 0, cpu: { elapsed: 0, target: 0, rallyId: 1 } };
}

// src/games/game028/save.ts
var SAVE_KEY = "web-mini-arcade:v1:game028:state";
var uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
var freshSave = () => ({ version: 1, match: null, observerRunId: null, localReportId: null, active: false, reported: true, stats: { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, bestRally: 0, reportedIds: [] } });
var finite = (x, max = 1e9) => typeof x === "number" && Number.isFinite(x) && Math.abs(x) <= max;
var natural = (x) => finite(x) && Number.isInteger(x) && x >= 0;
function validMatch(raw) {
  if (!raw || typeof raw !== "object") return false;
  const m = raw;
  const r = m.rally;
  if (![5, 11].includes(m.mode) || !["easy", "normal", "hard"].includes(m.difficulty) || typeof m.practice !== "boolean" || m.practice || !Array.isArray(m.scores) || m.scores.length !== 2 || !m.scores.every(natural) || ![0, 1].includes(m.firstServer) || !r || !natural(r.id) || !["ready", "live", "point", "let", "over"].includes(r.status) || ![0, 1].includes(r.server) || r.winner !== null && ![0, 1].includes(r.winner) || typeof r.reason !== "string" || r.reason.length > 150 || !natural(r.returns) || typeof r.scored !== "boolean" || !Array.isArray(m.paddles) || m.paddles.length !== 2 || !m.paddles.every((x) => finite(x, 0.46)) || !natural(m.maxRally) || !natural(m.points) || !finite(m.clock) || m.clock < 0 || !natural(m.seed) || m.seed > 4294967295 || !m.cpu || !finite(m.cpu.elapsed, 1) || !finite(m.cpu.target, 0.46) || m.cpu.rallyId !== r.id) return false;
  if (r.ball) {
    const b = r.ball;
    if (!finite(b.x, 2) || !finite(b.y, 2) || !finite(b.z, 4) || b.z < 0 || ![b.vx, b.vy, b.vz].every((x) => finite(x, 8)) || ![0, 1].includes(b.lastHit) || ![0, 1].includes(b.expected) || b.lastHit === b.expected || !natural(b.bounces) || b.bounces > 2 || typeof b.serve !== "boolean" || ![0, 1, 2].includes(b.stage) || typeof b.netTouched !== "boolean") return false;
  } else if (r.status === "live") return false;
  const winner = matchWinner(m.scores, m.mode);
  if (r.status === "over") {
    if (winner === null || r.winner !== winner || !r.scored || r.ball === null) return false;
  } else {
    if (winner !== null) return false;
    if (r.status === "point") {
      if (r.winner === null || !r.scored || m.scores[r.winner] < 1 || r.ball === null) return false;
    } else if (r.winner !== null || r.scored) return false;
  }
  if ((r.status === "ready" || r.status === "let") && (r.ball !== null || r.returns !== 0)) return false;
  if (r.status === "live" && r.ball.bounces > 1) return false;
  if (m.points !== m.scores[0] + m.scores[1] || m.maxRally < r.returns) return false;
  return true;
}
function decodeSave(raw) {
  try {
    if (raw === null) return freshSave();
    if (raw.length > 5e4) return null;
    const s = JSON.parse(raw);
    if (s.version !== 1 || typeof s.active !== "boolean" || typeof s.reported !== "boolean" || s.observerRunId !== null && !uuid.test(s.observerRunId) || s.localReportId !== null && (typeof s.localReportId !== "string" || !/^[a-z0-9-]{1,90}$/.test(s.localReportId)) || !s.stats || ![s.stats.wins, s.stats.losses, s.stats.pointsFor, s.stats.pointsAgainst, s.stats.bestRally].every(natural) || !Array.isArray(s.stats.reportedIds) || s.stats.reportedIds.length > 100 || !s.stats.reportedIds.every((x) => typeof x === "string" && /^[a-z0-9-]{1,90}$/.test(x)) || s.match !== null && !validMatch(s.match) || s.active && (!s.match || s.reported || !s.localReportId) || s.match && !s.active && !s.reported || s.active === s.reported || s.active && s.localReportId !== null && s.stats.reportedIds.includes(s.localReportId) || s.match && !s.active && (s.match.rally.status !== "over" || !s.localReportId || !s.stats.reportedIds.includes(s.localReportId))) return null;
    return s;
  } catch {
    return null;
  }
}
function parseSave(raw) {
  return decodeSave(raw) ?? freshSave();
}
var MatchStore = class {
  memory = freshSave();
  memoryOnly = false;
  backend;
  constructor(backend) {
    try {
      this.backend = backend ?? window.localStorage;
    } catch {
      this.memoryOnly = true;
    }
  }
  read() {
    if (!this.memoryOnly) {
      try {
        const decoded = decodeSave(this.backend?.getItem(SAVE_KEY) ?? null);
        if (decoded === null) this.memoryOnly = true;
        else this.memory = decoded;
      } catch {
        this.memoryOnly = true;
      }
    }
    return structuredClone(this.memory);
  }
  write(s) {
    this.memory = structuredClone(s);
    try {
      if (!this.memoryOnly) this.backend?.setItem(SAVE_KEY, JSON.stringify(s));
    } catch {
      this.memoryOnly = true;
    }
  }
};
function finishReport(s, m) {
  if (!s.active || s.reported || !s.localReportId) return false;
  s.active = false;
  s.reported = true;
  const id = s.localReportId;
  if (s.stats.reportedIds.includes(id)) return false;
  s.stats.reportedIds = [...s.stats.reportedIds, id].slice(-100);
  if (m.rally.status === "over") {
    if (m.scores[0] > m.scores[1]) s.stats.wins++;
    else s.stats.losses++;
  }
  s.stats.pointsFor += m.scores[0];
  s.stats.pointsAgainst += m.scores[1];
  s.stats.bestRally = Math.max(s.stats.bestRally, m.maxRally);
  return true;
}
function abandon(s, m) {
  finishReport(s, m);
  s.match = null;
  s.active = false;
  s.reported = true;
  s.observerRunId = null;
  s.localReportId = null;
}
function initialMatch() {
  return createMatch();
}
export {
  MatchStore,
  SAVE_KEY,
  abandon,
  decodeSave,
  finishReport,
  freshSave,
  initialMatch,
  parseSave,
  validMatch
};
