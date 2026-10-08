// Public asset byte/decode verification. No Analytics API or synthetic ingest.
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';

const [out, expectedCommit] = process.argv.slice(2);
assert(out && /^[a-f0-9]{40}$/.test(expectedCommit), 'unique output and expected commit required');
await mkdir(out, {recursive: false});
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const ledger = JSON.parse(await readFile('assets/game031/textures-a/v1/source-index.json', 'utf8'));
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page = await browser.newPage();
const report = {at:new Date().toISOString(),expectedCommit,source:'expected source ledger and public same-origin assets',files:[],errors:[]};
try {
  for (const material of ledger.materials) for (const tier of ['standard','light']) {
    const file = material.outputs[tier], url = new URL(file.path, 'https://game100garage.com');
    url.searchParams.set('qa', expectedCommit.slice(0,12));
    const response = await fetch(url); assert.equal(response.status,200,file.path);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.length,file.bytes); assert.equal(digest(bytes),file.sha256);
    const decoded = await page.evaluate(async base64 => {
      const image = new Image(); image.src = 'data:image/webp;base64,'+base64;
      await image.decode(); return {width:image.naturalWidth,height:image.naturalHeight};
    }, bytes.toString('base64'));
    assert.equal(decoded.width,file.width); assert.equal(decoded.height,file.height);
    report.files.push({blockId:material.block_id,name:material.name,tier,path:file.path,status:200,bytes:bytes.length,sha256:digest(bytes),decoded});
  }
  const manifestPath = 'assets/game031/textures-a/v1/manifest.json';
  const response = await fetch(new URL(manifestPath+'?qa='+expectedCommit.slice(0,12),'https://game100garage.com/'));
  assert.equal(response.status,200);
  const bytes = Buffer.from(await response.arrayBuffer()), expected = await readFile('public/'+manifestPath);
  assert.equal(digest(bytes),digest(expected));
  report.files.push({path:manifestPath,status:200,bytes:bytes.length,sha256:digest(bytes)});
  assert.equal(report.files.length,17); report.result='PASS';
} catch (error) {
  report.result='FAIL'; report.errors.push(error instanceof Error?error.message:'asset_verification_failed');
} finally {
  await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n'); await browser.close();
}
console.log({out,result:report.result,files:report.files.length});
if(report.result!=='PASS')process.exitCode=1;
