import { ANALYTICS_UTM_KEYS } from '../data/analyticsEnvelope';
export type Attribution = Record<string, string>;
/** Only campaign tokens, never arbitrary query parameters, URLs or typed text. */
export function sanitizeAttribution(search: string, referrer = ''): Attribution {
  const params = new URLSearchParams(search), result: Attribution = {};
  for (const key of ANALYTICS_UTM_KEYS) {
    const raw = params.get(key)?.toLowerCase();
    if (raw && /^[a-z0-9_-]+$/.test(raw)) result[key] = raw.slice(0, 100);
  }
  try { const host = new URL(referrer).hostname.toLowerCase(); if (/^(?:[a-z0-9][a-z0-9-]*\.)+[a-z]{2,63}$/.test(host)) result.referrer_host = host; } catch { /* absent */ }
  return result;
}
