import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = new URL('../../', import.meta.url);
const baseline = JSON.parse(await readFile(new URL('docs/eleven-game/QA/GAMEPLAY_BASELINE.json', root), 'utf8'));
const records = [];
for (const entry of baseline.files) {
  const body = await readFile(new URL(entry.path, root));
  const actual = createHash('sha256').update(body).digest('hex');
  records.push({ ...entry, actualSha256: actual, actualBytes: body.length, byteEqual: actual === entry.sha256 });
}
const errors = records.filter(entry => entry.strictByteEquality && !entry.byteEqual).map(entry => entry.path);
const contractReview = records.filter(entry => !entry.strictByteEquality && !entry.byteEqual).map(entry => entry.path);
await writeFile(new URL('docs/eleven-game/QA/GAMEPLAY_AUDIT.json', root), `${JSON.stringify({
  checkedUtc: new Date().toISOString(), baselineCommit: baseline.baselineCommit,
  records, errors, contractReview,
}, null, 2)}\n`);
assert.deepEqual(errors, [], 'Existing pure gameplay/score/helper changes require an explicit authorized review; no historical hash is rewritten');
console.log(`Gameplay audit: ${records.filter(entry => entry.strictByteEquality).length} byte-strict files match; ${contractReview.length} contracts need presentation-API review`);
