import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

// Test-only HTTP mount, with no SPA fallback. Missing direct entries/assets genuinely return404.
const root=resolve(process.env.ARCADE_STATIC_DIR??'dist');
const port=Number(process.env.ARCADE_STATIC_PORT??4191);
const mount=`/${(process.env.ARCADE_STATIC_MOUNT??'').replace(/^\/+|\/+$/g,'')}`.replace(/\/?$/,'/');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon','.wasm':'application/wasm','.pck':'application/octet-stream','.wav':'audio/wav','.ogg':'audio/ogg'};
createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(!pathname.startsWith(mount)){res.writeHead(404);res.end('outside test mount');return;}
    let filename=resolve(root,pathname.slice(mount.length));
    if(filename!==root&&!filename.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    if((await stat(filename)).isDirectory())filename=resolve(filename,'index.html');
    const body=await readFile(filename),extension=extname(filename);
    const compress=/gzip/.test(req.headers['accept-encoding']??'')&&['.html','.js','.css','.json'].includes(extension);
    const delivered=compress?gzipSync(body):body;
    res.writeHead(200,{'Content-Type':mime[extension]??'application/octet-stream','Content-Length':delivered.length,'Cache-Control':'no-cache',...(compress?{'Content-Encoding':'gzip','Vary':'Accept-Encoding'}:{})});
    res.end(req.method==='HEAD'?undefined:delivered);
  }catch{res.writeHead(404);res.end('missing static file');}
}).listen(port,'127.0.0.1',()=>console.log(`Static test mount http://127.0.0.1:${port}${mount} -> ${root}`));
