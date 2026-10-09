// Public/authorization compatibility probes only. Never register or submit scores.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { recordBoards } from '../../src/data/recordDefinitions.ts';
const [mode, out] = process.argv.slice(2);
assert(['off', 'on'].includes(mode) && out);
const base = 'https://analytics.game100garage.com', origin = 'https://game100garage.com';
const boards = recordBoards.filter(board => board.publicEnabled);
const report = { at: new Date().toISOString(), mode, base, checks: [], synthetic_submissions: 0, participant_registrations: 0, analytics_posts: 0 };
const check = (pass, name, extra = {}) => { report.checks.push({ name, pass: !!pass, ...extra }); assert(pass, name); };
const request = async (path, expected, headers = {}, method = 'GET') => {
  const response = await fetch(base + path, { method, headers, redirect: 'error', signal: AbortSignal.timeout(30000) });
  check(response.status === expected, method + ' ' + path + ' HTTP ' + expected);
  const data = response.status === 204 ? null : await response.json();
  return { response, data };
};
try {
  const health = await request('/v1/health', 200);
  check(health.data.status === 'ok' && health.data.environment === 'production', 'Existing Analytics health compatible');
  await request('/v1/admin/summary', 401);
  await request('/v1/records/admin/submissions', 401);
  check(!!process.env.ANALYTICS_CODEX_TOKEN, 'Configured existing Codex credential available, value hidden');
  const codexHeaders = { Authorization: 'Bearer ' + process.env.ANALYTICS_CODEX_TOKEN };
  await request('/v1/admin/summary', 401, codexHeaders);
  await request('/v1/records/admin/submissions', 401, codexHeaders);
  const now = Date.now(), period = `?from=${encodeURIComponent(new Date(now - 3600000).toISOString())}&to=${encodeURIComponent(new Date(now).toISOString())}`;
  const codex = await request('/v1/codex/summary' + period, 200, codexHeaders);
  check(codex.data.schema_version === 1 && Array.isArray(codex.data.games), 'Existing Codex aggregate reader works; credential preserved');
  // Never save the aggregate payload, raw IDs, or authentication header.
  const events = await request('/v1/events', 204, { Origin: origin, 'Access-Control-Request-Method': 'POST' }, 'OPTIONS');
  check(events.response.headers.get('Access-Control-Allow-Origin') === origin, 'Existing Analytics CORS preserved');
  await request('/v1/events', 405, { Origin: origin });
  const preflight = await request('/v1/records/submissions', 204, { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'Content-Type, X-Record-Credential' }, 'OPTIONS');
  check(preflight.response.headers.get('Access-Control-Allow-Origin') === origin && preflight.response.headers.get('Access-Control-Allow-Headers').includes('X-Record-Credential'), 'Sharing header allowed by exact production Origin');
  await request('/v1/records/public/bests', 403, { Origin: 'https://invalid-origin.example' });
  await request('/v1/records/public/bests', 401, { Authorization: 'Bearer invalid-public-probe' });
  const bests = await request('/v1/records/public/bests', mode === 'on' ? 200 : 503, { Origin: origin });
  check(bests.response.headers.get('Access-Control-Allow-Origin') === origin, 'Public response production CORS');
  if (mode === 'off') {
    check(bests.data.error === 'records_preparing' && bests.response.headers.get('Cache-Control') === 'no-store', 'OFF returns preparing, uncached');
    const rank = await request('/v1/records/public/leaderboard?board_id=game001.score.r1.all', 503);
    check(rank.data.error === 'records_preparing', 'OFF TOP10 remains preparing');
  } else {
    check(bests.data.schema_version === 1 && bests.data.definition_version === '1' && bests.data.cache_ttl_seconds === 60 && bests.data.boards.length === boards.length, 'BEST schema and exactly 20 registered boards');
    check(!/participant_id|credential|receipt|inspection_reason|browser_id|"ip"/.test(JSON.stringify(bests.data)), 'Public BEST contains no internal identity/secret fields');
    for (const board of boards) {
      const best = bests.data.boards.find(row => row.board_id === board.boardId);
      check(!!best && best.game_id === board.gameId && best.ruleset_id === board.rulesetId && best.mode_label === board.modeLabel && best.unit === board.unit, 'BEST comparison metadata ' + board.boardId);
      const { response, data } = await request('/v1/records/public/leaderboard?board_id=' + encodeURIComponent(board.boardId), 200, { Origin: origin });
      check(data.schema_version === 1 && data.board_id === board.boardId && data.game_id === board.gameId && data.ruleset_id === board.rulesetId && data.direction === board.direction && data.unit === board.unit && data.mode_label === board.modeLabel && Array.isArray(data.entries) && data.entries.length <= 10 && Number.isSafeInteger(data.revision), 'TOP10 schema and rules ' + board.boardId);
      check(Object.keys(data).sort().join(',') === ['schema_version','board_id','game_id','metric_label','mode_label','ruleset_id','direction','unit','generated_at','revision','cache_ttl_seconds','entries'].sort().join(','), 'TOP10 only permitted public fields ' + board.boardId);
      for (const [index, entry] of data.entries.entries()) check(Object.keys(entry).sort().join(',') === ['rank','public_label','value','received_at'].sort().join(',') && entry.rank === index + 1, 'Only public entry fields and rank');
      check(best.revision === data.revision && best.value === (data.entries[0]?.value ?? null), 'BEST equals TOP1, revision aligned ' + board.boardId);
      check(response.headers.get('Access-Control-Allow-Origin') === origin && response.headers.get('Cache-Control') === 'public, max-age=60, must-revalidate', 'Only normal public response cached ' + board.boardId);
    }
    await request('/v1/records/participants', 405, { Origin: origin });
    await request('/v1/records/public/leaderboard?board_id=unknown', 404);
    await request('/v1/records/public/leaderboard?board_id=game001.score.r1.all&limit=11', 400);
    report.public_boards = boards.length;
    report.empty_boards = bests.data.boards.filter(board => board.status === 'empty' && board.value === null).length;
    report.nonempty_boards = report.public_boards - report.empty_boards;
  }
  report.result = 'PASS';
} catch (error) { report.result = 'FAIL'; report.error = error.message; process.exitCode = 1; }
await writeFile(out, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ result: report.result, mode, checks: report.checks.length, error: report.error, empty_boards: report.empty_boards }));
