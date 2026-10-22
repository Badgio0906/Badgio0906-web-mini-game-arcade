// Local device preview only. No certificate installation, firewall changes or external service.
import http from 'node:http';
import https from 'node:https';
import {readFile,realpath,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i++){
 const key=args[i];if(['--http','--help'].includes(key))options[key]=true;
 else if(['--dir','--host','--port','--cert','--key'].includes(key)&&args[i+1])options[key]=args[++i];
 else throw Error('Unknown/missing option: '+key);
}
if(options['--help']){console.log('node tools/iphone-preview-server.mjs --dir dist [--host 127.0.0.1] [--port 8443] --cert leaf.pem --key leaf-key.pem\n--http is diagnostic only; it does not make LAN HTTP a secure context.\nNo CA installation/trust, firewall or tunnel changes are performed.');process.exit(0);}
const root=await realpath(options['--dir']||'dist'),host=options['--host']||'127.0.0.1',port=Number(options['--port']||8443);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid port');
if(!options['--http']&&(!options['--cert']||!options['--key']))throw Error('HTTPS requires --cert and --key. Obtain approval before device trust/firewall changes.');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.wasm':'application/wasm','.pck':'application/octet-stream','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const diagnostic=`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>iPhone試遊 接続検査</title><style>body{font:16px system-ui;margin:20px;overflow-wrap:anywhere}pre{white-space:pre-wrap}a{display:block;padding:14px}</style><h1>試遊接続の検査</h1><p>Game012はsecureContext、randomUUID、WebGL2、WebAssembly、fetch/streamが必要です。起動検査と音・保存・実機操作の合否は別です。</p><pre id="result"></pre><a href="/games/yokodori-days/index.html">Game012へ</a><a href="/game015.html">Game015へ</a><script>const canvas=document.createElement('canvas');let webgl2=false;try{webgl2=!!canvas.getContext('webgl2')}catch{}const r={origin:location.origin,isSecureContext,randomUUID:typeof crypto?.randomUUID==='function',WebAssembly:typeof WebAssembly==='object',fetch:typeof fetch==='function',ReadableStream:typeof ReadableStream==='function',WebGL2:webgl2,IndexedDB_API:typeof indexedDB==='object',crossOriginIsolated,SharedArrayBuffer_API:typeof SharedArrayBuffer==='function',AudioContext_API:!!(window.AudioContext||window.webkitAudioContext)};r.Game012_startup_prerequisites=r.isSecureContext&&r.randomUUID&&r.WebAssembly&&r.fetch&&r.ReadableStream&&r.WebGL2;document.querySelector('#result').textContent=JSON.stringify(r,null,2);</script></html>`;
const handler=async(req,res)=>{
 res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');res.setHeader('Cache-Control','no-store');
 // Preview never contacts production ads, analytics, records, or other external origins.
 res.setHeader('Content-Security-Policy',"default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'");
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://preview.invalid').pathname);
  if(pathname==='/__device-check'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(req.method==='HEAD'?'':diagnostic);return;}
  let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  file=await realpath(file);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if(!(await stat(file)).isFile())throw Error('not_file');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  if(req.method==='HEAD')res.end();else createReadStream(file).on('error',()=>res.destroy()).pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
};
const server=options['--http']?http.createServer(handler):https.createServer({cert:await readFile(options['--cert']),key:await readFile(options['--key'])},handler);
server.listen(port,host,()=>console.log(`Local preview: ${options['--http']?'http':'https'}://${host}:${port}/__device-check\nLAN access requires your Windows IP, a matching trusted certificate, and any separately approved firewall permission. No device settings were changed.`));
