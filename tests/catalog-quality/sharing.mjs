// Current participant-registration mock adapter for the older isolated UI harness.
// This is protocol regression evidence, never normal-play / human quality evidence.
import {build,loadConfigFromFile} from 'vite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const out=process.env.QA_OUT;if(!out)throw Error('New QA_OUT required');await mkdir(out,{recursive:true});
process.env.VITE_RECORDS_ENDPOINT='https://records-fixture.test';
const loaded=await loadConfigFromFile({command:'build',mode:'production'});
await build({...loaded.config,configFile:false,publicDir:false,build:{...loaded.config.build,outDir:resolve(out,'fixture'),rollupOptions:{input:{recordsFixture:resolve('tests/records/harness.html')}}}});
let script=await readFile('tests/records/sharing-browser.mjs','utf8');
script=script.replace("from'@playwright/test'",'from'+JSON.stringify(import.meta.resolve('@playwright/test')));
const marker='   const body=request.postDataJSON();';
if(!script.includes(marker))throw Error('Legacy mock changed; review adapter before use');
script=script.replace(marker,marker+"\n   if(url.pathname.endsWith('/participants'))return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'https://game100garage.com'},body:JSON.stringify({schema_version:1,public_label:'ガレージ住人 000000000001'})});");
script=script.replace("body:'{\"status\":\"withdrawn\"}'","headers:{'Access-Control-Allow-Origin':'https://game100garage.com'},body:'{\"status\":\"withdrawn\"}'");
const file=resolve(out,'current-protocol.mjs');await writeFile(file,script);
process.env.RECORDS_HARNESS_DIST=resolve(out,'fixture');process.env.RECORDS_QA_OUT=resolve(out,'report');
process.env.RECORDS_QA_ONLY='webdriver-excluded,manual-independent-dedup,automatic-explicit-off-purge,public-batched-cache-zero';
await import(pathToFileURL(file).href);
