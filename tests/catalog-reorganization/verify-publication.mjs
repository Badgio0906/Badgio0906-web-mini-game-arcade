import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { extname } from 'node:path';
const dist=process.env.PUBLICATION_DIST||'dist',out=process.env.PUBLICATION_OUT;if(!out)throw Error('PUBLICATION_OUT required');await mkdir(out,{recursive:true});
const files=[...(await readdir(dist)).filter(x=>x.endsWith('.html')||x.endsWith('.js')),...(await readdir(dist+'/assets')).filter(x=>['.js','.css'].includes(extname(x))).map(x=>'assets/'+x)];
async function walk(relative){try{const entries=await readdir(dist+'/'+relative,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?walk(relative+'/'+e.name):relative+'/'+e.name))).flat();}catch{return[];}}
for(const dir of ['assets/game003','assets/game017','assets/game033','assets/game034','assets/game035','assets/portal','fonts'])files.push(...await walk(dir));
const sha=b=>createHash('sha256').update(b).digest('hex');const results=[];
for(let i=0;i<files.length;i+=6){await Promise.all(files.slice(i,i+6).map(async file=>{const r=await fetch('https://game100garage.com/'+file,{cache:'no-cache'});const got=Buffer.from(await r.arrayBuffer());const want=await readFile(dist+'/'+file);results.push({file,status:r.status,local:sha(want),remote:sha(got),match:r.ok&&sha(want)===sha(got)});}));}
const report={at:new Date().toISOString(),commit:process.env.PUBLICATION_COMMIT,workflow:process.env.PUBLICATION_WORKFLOW,count:results.length,failed:results.filter(x=>!x.match).length,files:results};await writeFile(out+'/PUBLICATION_SHA.json',JSON.stringify(report,null,2));console.log({count:report.count,failed:report.failed});if(report.failed)process.exitCode=1;
