import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';

const manifest=JSON.parse(readFileSync('public/games/export-manifest.json','utf8'));
for(const game of manifest.games) {
  it(`${game.id}: keeps the managed entry and delivered shell metadata in sync`,()=>{
    const entry=game.shellFiles.find((file:{path:string})=>file.path.endsWith('/index.html'));
    const delivered=readFileSync(entry.path);
    const managed=readFileSync(`tools/legacy-record-shells/${game.slug}/index.html`);
    expect(delivered.equals(managed)).toBe(true);
    expect(entry.bytes).toBe(delivered.length);
    expect(entry.sha256).toBe(createHash('sha256').update(delivered).digest('hex'));
  });
}
