// Local-only author preview. Does not install certificates, change firewall/policy,
// open tunnels, push Git, or create any external service.
import {execFileSync,spawnSync,spawn} from 'node:child_process';
import {writeFileSync,existsSync} from 'node:fs';
import {networkInterfaces} from 'node:os';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i++){
 const k=args[i];if(['--expected','--host','--port','--cert','--key'].includes(k)&&args[i+1])options[k]=args[++i];else throw Error('Unknown or missing option: '+k);
}
if(!/^[a-f0-9]{40}$/.test(options['--expected']||''))throw Error('--expected requires the exact 40-character candidate commit from the handoff');
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const revision=git('rev-parse','HEAD');if(revision!==options['--expected'])throw Error('Wrong checkout: '+revision+' (expected '+options['--expected']+')');
git('diff','--quiet');git('diff','--cached','--quiet');
if(!existsSync(path.join(root,'node_modules')))throw Error('Run npm ci in this checkout first. Dependencies are not installed automatically.');
if((!!options['--cert'])!==(!!options['--key']))throw Error('HTTPS requires both --cert and --key');
const host=options['--host']||'0.0.0.0',port=options['--port']||'8443';
if(!/^\d+$/.test(port)||Number(port)<1||Number(port)>65535)throw Error('Invalid port');
const build=spawnSync('npm',['run','build'],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
if(build.status!==0)throw Error('Build failed; preview not started');
const scheme=options['--cert']?'https':'http',dist=path.join(root,'dist');
const meta={schema:1,preview:'PR11 Game015 portrait integration',revision,built_at:new Date().toISOString(),main:'b419041a3702f1afceed11f912b73543c8904652',game:'game015',production:false};
writeFileSync(path.join(dist,'__pr11-version.json'),JSON.stringify(meta,null,2)+'\n');
writeFileSync(path.join(dist,'__pr11-preview.html'),`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PR11 落下キング 試遊版</title><style>body{font:16px/1.7 system-ui;margin:20px;overflow-wrap:anywhere}a{display:block;padding:15px;border:1px solid;margin:15px 0}pre{white-space:pre-wrap}</style><h1>PR11 落下キング 縦画面試遊版</h1><p>本番版ではありません。表示番号012・内部game015です。</p><p>commit: <code>${revision}</code></p><p>LAN HTTPでは入力・回転・端末内BESTのみを確認します。記録共有は操作しないでください。HTTPS限定APIと実iPhoneの対応可否は別です。</p><a href="game015.html?pr11=${revision}">このGame015試遊版を開く</a><a href="__pr11-version.json">配信元commitを確認</a><pre id="apis"></pre><script>document.getElementById('apis').textContent=JSON.stringify({origin:location.origin,isSecureContext,randomUUID:typeof crypto.randomUUID==='function',getRandomValues:typeof crypto.getRandomValues==='function',localStorage_API:typeof localStorage==='object',AudioContext_API:!!(window.AudioContext||window.webkitAudioContext)},null,2)</script></html>`);
const ips=host==='0.0.0.0'?Object.values(networkInterfaces()).flat().filter(x=>x&&x.family==='IPv4'&&!x.internal).map(x=>x.address):[host];
console.log('\nPR11 CANDIDATE '+revision+'\nNo certificate/trust/firewall settings were changed.');
for(const ip of ips)console.log(`${scheme}://${ip}:${port}/__pr11-preview.html`);
if(!options['--cert'])console.log('HTTP is not a secure context on iPhone LAN. Use it only for Game015 controls/rotation/local BEST. Do not use record sharing or follow links to production.');
const server=path.join(root,'tools','iphone-preview-server.mjs');
const serverArgs=['--dir',dist,'--host',host,'--port',port,...(options['--cert']?['--cert',options['--cert'],'--key',options['--key']]:['--http'])];
const child=spawn(process.execPath,[server,...serverArgs],{cwd:root,stdio:'inherit'});
process.on('SIGINT',()=>child.kill('SIGINT'));child.on('exit',code=>{process.exitCode=code??1;});child.on('error',e=>{throw e;});
