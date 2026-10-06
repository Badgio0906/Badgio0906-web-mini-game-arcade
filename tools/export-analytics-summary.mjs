#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { aggregateExport } from '../src/analytics-admin/export.ts';

// Only read already aggregated manager API JSON. Never accepts raw telemetry.
const [input, output, ...extra] = process.argv.slice(2);
if (!input || !output || extra.length) {
  console.error('Usage: node tools/export-analytics-summary.mjs <admin-summary.json> <aggregate-export.json>');
  process.exitCode = 1;
} else {
  try {
    if (input === output) throw new Error('Input and output must differ.');
    const summary = aggregateExport(JSON.parse(await readFile(input, 'utf8')));
    await writeFile(output, JSON.stringify(summary, null, 2) + '\n', { mode: 0o600 });
    console.log('Aggregate-only JSON exported. No Jev API request was made.');
  } catch {
    console.error('Export failed. Confirm valid schema_version=1 aggregate JSON, explicit environment, distinct input/output and writable output.');
    process.exitCode = 1;
  }
}
