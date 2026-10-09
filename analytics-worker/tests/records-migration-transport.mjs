// Actual local workerd/D1: atomic normalized migration + authoritative ledger.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { normalizeTransport } from '../scripts/apply-records-migrations.mjs';
const cwd = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const state = cwd + '/.wrangler/migration-transport-' + randomUUID();
await mkdir(state, { recursive: true });
const command = sql => execFileSync(cwd + '/node_modules/.bin/wrangler', ['d1', 'execute', 'DB', '--local', '--config', 'tests/wrangler.records.local.jsonc', '--persist-to', state, '--command=' + sql, '--json'], {
  cwd, env: { ...process.env, WRANGLER_SEND_METRICS: 'false' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
});
const read = sql => { const output = command(sql); return JSON.parse(output.slice(output.search(/^\s*\[/m)))[0].results; };
const source = name => readFile(cwd + '/migrations/' + name, 'utf8');
command(await source('0001_events.sql') + "\nCREATE TABLE d1_migrations(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE,applied_at TEXT DEFAULT CURRENT_TIMESTAMP);INSERT INTO d1_migrations(name) VALUES('0001_events.sql');");
command("INSERT INTO events(event_id,received_at,occurred_at,schema_version,browser_id,visit_id,session_id,game_id,event_name,game_version,rules_version,presentation_version,device_class,input_type,page,environment,data_json) VALUES('fixture-only','2026-10-09T00:00:00Z','2026-10-09T00:00:00Z',2,'local-fixture','local-fixture','local-fixture','game001','run_start','1','1','1','desktop','keyboard','game001.html','synthetic','{}');INSERT INTO daily_aggregates VALUES('2026-10-09','game001','synthetic','1','1','1','{}');");
const beforeEvents = read('SELECT * FROM events'), beforeDays = read('SELECT * FROM daily_aggregates');
const checks = [];
for (const name of ['0002_records.sql', '0003_leaderboards.sql']) {
  const sql = normalizeTransport(await source(name)) + `\nINSERT INTO d1_migrations(name) VALUES('${name}');`;
  const schemaBefore = read("SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY name");
  const ledgerBefore = read('SELECT * FROM d1_migrations ORDER BY id');
  assert.throws(() => command(sql + '\nSELECT nonexistent_transport_fixture_column;'));
  assert.deepEqual(read("SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY name"), schemaBefore);
  assert.deepEqual(read('SELECT * FROM d1_migrations ORDER BY id'), ledgerBefore);
  checks.push(name + ': failed batch rolls back schema and ledger');
  command(sql);
  assert.deepEqual(read('SELECT * FROM events'), beforeEvents);
  assert.deepEqual(read('SELECT * FROM daily_aggregates'), beforeDays);
  assert(read('SELECT name FROM d1_migrations').some(row => row.name === name));
  checks.push(name + ': real D1 successful migration preserves Analytics and ledger');
}
assert.equal(read('PRAGMA foreign_key_check').length, 0);
checks.push('D1 supported foreign-key check passes');
const report = { at: new Date().toISOString(), result: 'PASS', backend: 'Actual local workerd/D1 through Wrangler4.42', production_mutations: false, synthetic_only: true, checks };
if (process.env.RECORDS_TRANSPORT_REPORT) await writeFile(process.env.RECORDS_TRANSPORT_REPORT, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report));
