import {expect,it} from 'vitest';
import {resolve} from 'node:path';
import config from '../../vite.config';
import {gameCatalog} from '../../src/data/gameCatalog';
it('emits every registered physical game route, including the third decade',()=>{
  const input=config.build?.rollupOptions?.input;
  expect(input&&typeof input==='object'&&!Array.isArray(input)).toBe(true);
  const entries=Object.values(input as Record<string,string>);
  for(const game of gameCatalog.filter(g=>/^\.\/game\d{3}\.html$/.test(g.route))) {
    expect(entries,game.id+' registered route must be a production build entry').toContain(resolve(process.cwd(),game.route.slice(2)));
  }
});
