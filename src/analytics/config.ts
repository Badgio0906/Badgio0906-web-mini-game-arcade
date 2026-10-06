import type { AnalyticsEnvironment } from '../data/analyticsEnvelope';
const env = (import.meta as ImportMeta & { env?: Record<string, string | boolean> }).env ?? {};
export function runtimeEnvironment(): AnalyticsEnvironment {
  if (typeof location === 'undefined') return 'development';
  if (typeof navigator !== 'undefined' && navigator.webdriver) return 'qa';
  return ['game100garage.com', 'www.game100garage.com'].includes(location.hostname) ? 'production' : 'development';
}
export function validEndpoint(value: unknown, environment: AnalyticsEnvironment): string {
  if (typeof value !== 'string' || !value) return '';
  try { const url = new URL(value); if (url.username || url.password || url.search || url.hash || url.pathname !== '/v1/events') return '';
    if (url.protocol === 'https:' || (environment !== 'production' && url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))) return url.href;
  } catch { /* config absent/invalid disables transport */ }
  return '';
}
export const analyticsConfig = { environment: runtimeEnvironment(), endpoint: validEndpoint(env.VITE_TELEMETRY_ENDPOINT, runtimeEnvironment()), measurementId: typeof env.VITE_GA4_MEASUREMENT_ID === 'string' && /^G-[A-Z0-9]{6,20}$/.test(env.VITE_GA4_MEASUREMENT_ID) ? env.VITE_GA4_MEASUREMENT_ID : '' };
