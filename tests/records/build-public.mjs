import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
// Existing public compile settings may be supplied; this cannot enable records.
// Expected-SHA official workflow + served-byte hashes are verified separately afterward.
const selected={VITE_GA4_MEASUREMENT_ID:process.env.VITE_GA4_MEASUREMENT_ID??'',VITE_TELEMETRY_ENDPOINT:process.env.VITE_TELEMETRY_ENDPOINT??''};
const buildEnvironment={...process.env,...selected};
delete buildEnvironment.VITE_RECORDS_ENDPOINT; // Official workflow has no records env entry; unset differs from empty after optimization.
const output=execFileSync('npm',['run','build'],{env:buildEnvironment,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:8*1024*1024});
writeFileSync(process.env.RECORDS_BUILD_LOG??'/tmp/records-public-build.txt',output);
console.log(JSON.stringify({result:'PASS',records_endpoint_configured:false,reference:'clean source production build; official workflow and public byte verification required',telemetry_endpoint_configured:!!selected.VITE_TELEMETRY_ENDPOINT,ga4_configured:!!selected.VITE_GA4_MEASUREMENT_ID}));
