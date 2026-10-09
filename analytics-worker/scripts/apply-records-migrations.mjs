// Targeted transport workaround for REST D1 compound-statement parsing.
// Original migrations remain unchanged. No scores or participant fixtures.
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { unstable_splitSqlQuery } from 'wrangler';

const root = fileURLToPath(new URL('../', import.meta.url));
const known = ['0001_events.sql', '0002_records.sql', '0003_leaderboards.sql'];
const expected = [8, 11, 18];
const originalHashes = [
  '21cd3545e9b051dc36f96c2ccc65a58fc9c73abd5644f9c53814aaa40cfaf219',
  '7b4efac95c3ef7f1a0c3382d97e5f0d8faef32a3cc9f19bd83127eb7a679ce80',
  'ec811bd7ee747649d739f92b6def1465ee9616ad93bfe58d8f727d1927c2221f',
];
const protectedTokens = /(--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:""|[^"])*"|`(?:``|[^`])*`)|\b(CASE|END)\b/g;
export const normalizeTransport = sql => sql.replace(protectedTokens, (match, protectedText, keyword) => protectedText ?? ` ${keyword} `);
const sha = text => createHash('sha256').update(text).digest('hex');
const files = await Promise.all(known.map(name => readFile(root + 'migrations/' + name, 'utf8')));
assert.deepEqual((await readdir(root + 'migrations')).filter(name => name.endsWith('.sql')).sort(), known);
const original = new DatabaseSync(':memory:'), transported = new DatabaseSync(':memory:');
const plans = files.map((source, i) => {
  assert.equal(sha(source), originalHashes[i], 'Re-review any changed original migration before production use');
  original.exec(source);
  const sql = normalizeTransport(source), statements = unstable_splitSqlQuery(sql);
  assert.equal(statements.length, expected[i], 'Compound SQL statement boundary mismatch');
  for (const statement of statements) transported.exec(statement);
  return { name: known[i], source_sha256: sha(source), transport_sha256: sha(sql), statements: statements.length, sql };
});
const schema = db => db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY name").all().map(row => ({ ...row, sql: row.sql?.replace(/\s+/g, '') ?? null }));
assert.deepEqual(schema(original), schema(transported));
original.close(); transported.close();
const args = process.argv.slice(2), remote = args.includes('--remote');
const flag = name => args[args.indexOf(name) + 1];
if (!remote) {
  console.log(JSON.stringify({ result: 'PASS', mode: 'local-validation-only', plans: plans.map(({ sql, ...plan }) => plan) }));
} else {
  assert(args.includes('--backup') && args.includes('--report'), 'Private backup and unique report paths required');
  const config = JSON.parse(await readFile(root + 'wrangler.jsonc', 'utf8'));
  const db = config.d1_databases.find(binding => binding.binding === 'DB');
  assert.equal(config.name, 'game100-analytics');
  assert.equal(db.database_name, 'game100garage-production');
  assert.equal(db.database_id, '122c6f47-1f9e-4863-9b3d-54b066f17cc7');
  assert.equal(config.vars.RECORDS_ENABLED, 'false', 'Keep records disabled during migrations');
  const backup = JSON.parse(await readFile(flag('--backup'), 'utf8'));
  assert.equal(backup.database_id, db.database_id);
  assert(typeof backup.bookmark === 'string' && backup.bookmark.length > 8, 'Confirmed Time Travel bookmark required');
  assert(Date.now() - Date.parse(backup.at) < 3600000, 'Reconfirm old backup before applying');
  const reportPath = flag('--report');
  await writeFile(reportPath, JSON.stringify({ at: new Date().toISOString(), result: 'STARTED', production_writes_not_yet_attempted: true }) + '\n', { flag: 'wx' });
  const account = process.env.CLOUDFLARE_ACCOUNT_ID, token = process.env.CLOUDFLARE_API_TOKEN;
  assert(account && token, 'Use configured existing Cloudflare credentials');
  const api = async (path, payload) => {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${path}`, {
      method: payload === undefined ? 'GET' : 'POST', redirect: 'error',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: payload === undefined ? undefined : JSON.stringify(payload), signal: AbortSignal.timeout(60000),
    });
    const answer = await response.json();
    if (!response.ok || !answer.success) throw Error(`Cloudflare HTTP ${response.status}; codes ${answer.errors?.map(e => e.code).join(',') ?? 'unknown'}`);
    return answer.result;
  };
  const query = sql => api(`/d1/database/${db.database_id}/query`, { sql });
  const identity = await api(`/d1/database/${db.database_id}`);
  assert.equal(identity.uuid, db.database_id); assert.equal(identity.name, db.database_name);
  const before = (await query('SELECT name FROM d1_migrations ORDER BY id'))[0].results.map(row => row.name);
  assert(before.includes(known[0])); assert.deepEqual(before, known.slice(0, before.length));
  const counts = async () => (await query('SELECT (SELECT COUNT(*) FROM events) AS events_count,(SELECT COUNT(*) FROM daily_aggregates) AS daily_aggregates_count'))[0].results[0];
  const report = { at: new Date().toISOString(), database_id: db.database_id, method: 'One REST SQL request per normalized original migration plus its ledger INSERT',
    source_migrations_unchanged: true, score_submissions: 0, before_migrations: before, before_counts: await counts(), applied: [] };
  try {
    for (const plan of plans.slice(1)) {
      if (before.includes(plan.name)) continue;
      const sql = plan.sql + `\nINSERT INTO d1_migrations(name) VALUES ('${plan.name}');`;
      assert.equal(unstable_splitSqlQuery(sql).length, plan.statements + 1);
      const results = await query(sql);
      assert(results.every(result => result.success));
      const ledger = (await query('SELECT name FROM d1_migrations ORDER BY id'))[0].results.map(row => row.name);
      assert(ledger.includes(plan.name), 'Never infer successful migration');
      report.applied.push({ name: plan.name, source_sha256: plan.source_sha256, transport_sha256: plan.transport_sha256, sql_statements: plan.statements + 1, ledger_verified: true });
    }
    report.after_migrations = (await query('SELECT name FROM d1_migrations ORDER BY id'))[0].results.map(row => row.name);
    assert.deepEqual(report.after_migrations, known);
    report.after_counts = await counts();
    assert(report.after_counts.events_count >= report.before_counts.events_count);
    assert(report.after_counts.daily_aggregates_count >= report.before_counts.daily_aggregates_count);
    report.schema = (await query("SELECT type,name,tbl_name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name"))[0].results;
    report.foreign_key_violations = (await query('PRAGMA foreign_key_check'))[0].results.length;
    assert.equal(report.foreign_key_violations, 0);
    report.result = 'PASS';
  } catch (error) { report.result = 'FAIL'; report.error = error.message; throw error; }
  finally { await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n'); }
  console.log(JSON.stringify({ result: report.result, applied: report.applied.map(plan => plan.name), counts_preserved: true }));
}
