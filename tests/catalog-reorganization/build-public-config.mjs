import { spawnSync } from 'node:child_process';
import { openSync, closeSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

// Reproduce the official public build without requiring access to Actions Variables.
// Read only known, already-public configuration. Never execute fetched JavaScript.
const root = process.env.PUBLIC_BUILD_ROOT;
const log = process.env.PUBLIC_BUILD_LOG;
if (!root || !log) throw Error('PUBLIC_BUILD_ROOT and PUBLIC_BUILD_LOG required');
const origin = 'https://game100garage.com/';
const htmlResponse = await fetch(new URL('game002.html', origin));
if (!htmlResponse.ok) throw Error('Public reference HTML unavailable');
const html = await htmlResponse.text();
const path = [...html.matchAll(/(?:src|href)="([^"]+\.js)"/g)]
  .map(match => match[1]).find(value => value.includes('/runtime-'));
if (!path) throw Error('Public runtime reference unavailable');
const url = new URL(path, origin);
if (url.origin !== new URL(origin).origin) throw Error('Unexpected reference origin');
const response = await fetch(url);
if (!response.ok) throw Error('Public runtime unavailable');
const js = await response.text();
const keys = ['VITE_GA4_MEASUREMENT_ID', 'VITE_TELEMETRY_ENDPOINT', 'VITE_RECORDS_ENDPOINT'];
const values = {};
for (const key of keys) {
  const match = js.match(new RegExp(key + '\\s*:\\s*(["\'])(.*?)\\1'));
  if (match) values[key] = match[2];
}
if (!values.VITE_TELEMETRY_ENDPOINT) {
  const endpoints = [...js.matchAll(/https:\/\/analytics\.game100garage\.com[^"'\s`)]*/g)].map(match => match[0]);
  if (endpoints.length === 1) values.VITE_TELEMETRY_ENDPOINT = endpoints[0];
}
values.VITE_RECORDS_ENDPOINT = 'https://analytics.game100garage.com'; // workflow validates this exact default
values.VITE_GA4_MEASUREMENT_ID ??= '';
if (values.VITE_TELEMETRY_ENDPOINT !== 'https://analytics.game100garage.com/v1/events') throw Error('Unexpected public telemetry configuration');
if (values.VITE_GA4_MEASUREMENT_ID !== '' && !/^G-[A-Z0-9]{6,20}$/.test(values.VITE_GA4_MEASUREMENT_ID)) throw Error('Unexpected public measurement configuration');
const env = { ...process.env };
for (const key of Object.keys(env)) if (key.startsWith('VITE_')) delete env[key];
Object.assign(env, values);
console.log({ referenceModule: path, configurationSha256: createHash('sha256').update(JSON.stringify(values)).digest('hex'), variableNames: keys, valuesLogged: false });
const fd = openSync(resolve(log), 'wx');
const result = spawnSync('npm', ['run', 'build'], { cwd: resolve(root), env, stdio: ['ignore', fd, fd] });
closeSync(fd);
console.log({ buildExit: result.status });
process.exitCode = result.status ?? 1;
