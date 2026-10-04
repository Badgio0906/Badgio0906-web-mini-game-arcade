import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const baseline = JSON.parse(readFileSync('docs/revisions/TITLE_UI_BASELINE.json', 'utf8'));
const files = baseline.files.map(({ path, sha256 }) => {
  const currentSha256 = createHash('sha256').update(readFileSync(path)).digest('hex');
  return { path, originalSha256: sha256, currentSha256, same: sha256 === currentSha256 };
});
const report = { baselineCommit: baseline.baselineCommit, checkedUtc: new Date().toISOString(), pass: files.every(file => file.same), files };
writeFileSync('docs/revisions/TITLE_UI_PROTECTED_AUDIT.json', `${JSON.stringify(report, null, 2)}\n`);
if (!report.pass) {
  console.error(JSON.stringify(files.filter(file => !file.same), null, 2));
  process.exitCode = 1;
} else console.log(`PASS: ${files.length} protected files byte-identical`);
