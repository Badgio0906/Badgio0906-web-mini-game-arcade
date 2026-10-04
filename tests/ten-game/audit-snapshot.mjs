import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
const game = process.argv[2] ?? 'game002';
if (!/^game00[2-9]$|^game010$/.test(game)) throw new Error('Expected game002 through game010');
const snapshotPath = resolve(process.argv[3] ?? '/workspace/scratch/ten002-frozen');
const root = process.cwd();
const allowFontGrowth = process.argv.includes('--allow-font-growth');
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
function walk(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path).flatMap(name => { const child = resolve(path, name); return statSync(child).isDirectory() ? walk(child) : [relative(root, child)]; });
}
const paths = [...['src/core', `src/games/${game}`, `public/assets/${game}`, 'public/fonts'].flatMap(path => walk(resolve(path))), `${game}.html`].sort();
const files = paths.map(path => {
  const liveSha256 = sha(resolve(root, path));
  const snapshotSha256 = existsSync(resolve(snapshotPath, path)) ? sha(resolve(snapshotPath, path)) : null;
  return { path, snapshotSha256, liveSha256, equal: snapshotSha256 === liveSha256, authorizedFontChange: allowFontGrowth && path === 'public/fonts/arcade-rounded-jp.woff2' && snapshotSha256 !== liveSha256 }; 
});
const report = { snapshotPath, checkedUtc: new Date().toISOString(), allowFontGrowth, allEqual: files.every(file => file.equal), allRequiredEqual: files.every(file => file.equal || file.authorizedFontChange), files };
writeFileSync(`docs/ten-game/QA/${game.toUpperCase()}_SNAPSHOT_AUDIT.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Snapshot audit ${game}: ${files.length} files; allEqual ${report.allEqual}`);
if (!report.allRequiredEqual) { console.error(files.filter(file => !file.equal && !file.authorizedFontChange)); process.exitCode = 1; }
