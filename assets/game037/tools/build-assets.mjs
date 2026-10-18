// Game037: copy hand-authored SVG sources to the served folder with comments and
// redundant whitespace removed, then print SHA-256 of source and served files.
// Run from repo root: node assets/game037/tools/build-assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const src = 'assets/game037/source';
const out = 'public/assets/game037';
fs.mkdirSync(out, {recursive: true});
const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');
const rows = [];
for (const name of fs.readdirSync(src).filter(f => f.endsWith('.svg')).sort()) {
  const raw = fs.readFileSync(path.join(src, name), 'utf8');
  const min = raw.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim() + '\n';
  fs.writeFileSync(path.join(out, name), min);
  rows.push({file: name, source_bytes: Buffer.byteLength(raw), source_sha256: sha(raw), served_bytes: Buffer.byteLength(min), served_sha256: sha(min)});
}
fs.writeFileSync('assets/game037/asset-hashes.json', JSON.stringify({generated_by: 'assets/game037/tools/build-assets.mjs', files: rows}, null, 2) + '\n');
console.table(rows.map(r => ({file: r.file, src: r.source_bytes, served: r.served_bytes})));
