// Run after: npx vite build --config vite.stick.config.ts
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve('artifacts/stick-balance');
const html=readFileSync(`${root}/prototype-stick.html`,'utf8')
 .replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/,(_,src)=>`<script type="module">${readFileSync(resolve(root,src),'utf8')}</script>`)
 .replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/,(_,src)=>`<style>${readFileSync(resolve(root,src),'utf8')}</style>`);
writeFileSync(`${root}/play-standalone.html`,html);
console.log('Standalone HTML: artifacts/stick-balance/play-standalone.html');
