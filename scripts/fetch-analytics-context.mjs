import { pathToFileURL } from 'node:url';

const DEFAULT_BASE_URL = 'https://analytics.game100garage.com';
const ENVIRONMENTS = new Set(['production', 'development', 'qa', 'synthetic']);
const PRIVATE_KEYS = new Set(['event_id', 'browser_id', 'visit_id', 'session_id', 'run_id', 'ip', 'ip_address', 'user_agent', 'user-agent']);

function fail(code) { throw new Error(code); }

export function parseOptions(args) {
  const options = { days: 7, environment: 'production', includeRetired: false };
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (seen.has(flag)) fail('invalid_arguments');
    seen.add(flag);
    if (flag === '--include-retired') { options.includeRetired = true; continue; }
    if (!['--days', '--game', '--environment'].includes(flag) || i + 1 >= args.length) fail('invalid_arguments');
    const value = args[++i];
    if (flag === '--days') {
      if (!/^[1-9]\d*$/.test(value) || Number(value) > 90) fail('invalid_days');
      options.days = Number(value);
    } else if (flag === '--game') {
      if (!/^game(?:00[1-9]|01[0-9])$/.test(value)) fail('invalid_game');
      options.game = value;
    } else {
      if (!ENVIRONMENTS.has(value)) fail('invalid_environment');
      options.environment = value;
    }
  }
  return options;
}

function baseURL(value) {
  let url;
  try { url = new URL(value); } catch { fail('invalid_base_url'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') fail('invalid_base_url');
  return url;
}

function assertSafe(value, token) {
  if (typeof value === 'string' && value.includes(token)) fail('unsafe_response');
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (PRIVATE_KEYS.has(key.toLowerCase()) || key.includes(token)) fail('unsafe_response');
      assertSafe(item, token);
    }
  }
}

export async function fetchAnalyticsContext(args, env = process.env, fetcher = fetch, now = new Date()) {
  const options = parseOptions(args);
  const token = env.ANALYTICS_CODEX_TOKEN;
  if (!token) fail('missing_codex_token');
  // Treat the credential as opaque; a Cloud proxy may replace its placeholder.
  const base = env.ANALYTICS_BASE_URL || DEFAULT_BASE_URL;
  if (base.includes(token)) fail('invalid_base_url');
  const url = new URL(options.game ? `/v1/codex/game/${options.game}` : '/v1/codex/summary', baseURL(base));
  url.searchParams.set('from', new Date(now.getTime() - options.days * 86400000).toISOString());
  url.searchParams.set('to', now.toISOString());
  url.searchParams.set('environment', options.environment);
  if (options.includeRetired) url.searchParams.set('include_retired', '1');
  // Never follow redirects, echo a server error body, or print exception messages/URLs.
  let response;
  try {
    response = await fetcher(url, {
      method: 'GET', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      redirect: 'error', signal: AbortSignal.timeout(30000),
    });
  } catch { fail('analytics_request_failed'); }
  if (!response.ok) {
    const error = new Error('analytics_http_error');
    error.status = response.status;
    throw error;
  }
  let data;
  try { data = await response.json(); } catch { fail('invalid_analytics_response'); }
  if (!data || data.schema_version !== 1 || data.environment !== options.environment ||
      !data.period || data.period.from !== url.searchParams.get('from') || typeof data.period.to !== 'string' ||
      !Number.isFinite(Date.parse(data.period.to)) || Date.parse(data.period.to) > now.getTime() ||
      Date.parse(data.period.to) < now.getTime() - 300000 || Date.parse(data.period.to) <= Date.parse(data.period.from) ||
      !(options.game ? data.game?.game_id === options.game : data.summary && Array.isArray(data.games))) fail('invalid_analytics_response');
  assertSafe(data, token);
  const result = { source: 'GAME100 Analytics', fetched_at: new Date().toISOString(), period: data.period, data };
  assertSafe(result, token);
  return result;
}

const ERROR_CODES = new Set(['invalid_arguments', 'invalid_days', 'invalid_game', 'invalid_environment',
  'missing_codex_token', 'invalid_base_url', 'analytics_request_failed',
  'analytics_http_error', 'invalid_analytics_response', 'unsafe_response']);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await fetchAnalyticsContext(process.argv.slice(2)), null, 2));
  } catch (error) {
    const code = ERROR_CODES.has(error?.message) ? error.message : 'analytics_request_failed';
    const report = { error: code };
    if (code === 'analytics_http_error' && Number.isInteger(error.status)) report.status = error.status;
    console.error(JSON.stringify(report));
    process.exitCode = 1;
  }
}
