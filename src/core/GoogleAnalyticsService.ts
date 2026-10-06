import type { ConsentService } from './ConsentService';
import type { Attribution } from '../analytics/attribution';
interface AnalyticsWindow extends Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; }
const gaEvents: Record<string,string> = { portal_view:'portal_view', game_card_click:'game_card_click', game_launch:'game_launch', run_start:'game_start', run_end:'game_end', retry:'game_retry', return_to_portal:'return_to_portal' };
/** Basic Consent Mode: no Google tag exists until a real grant and configured ID. */
export class GoogleAnalyticsService {
  private loaded = false;
  constructor(private consent: ConsentService, private id: string, private enabled = true, private attribution: () => Attribution = () => ({})) {
    consent.subscribe(state => { if (state === 'granted') this.load(); else this.revoke(); });
    if (consent.getState() === 'granted') this.load();
  }
  private load(): void {
    if (!this.enabled || !/^G-[A-Z0-9]{6,20}$/.test(this.id) || this.consent.getState() !== 'granted' || typeof window === 'undefined') return;
    const w = window as AnalyticsWindow; (w as unknown as Record<string,unknown>)[`ga-disable-${this.id}`] = false;
    w.dataLayer ??= []; w.gtag ??= (...args: unknown[]) => w.dataLayer!.push(args);
    w.gtag('consent', 'update', { analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied' });
    w.gtag('js', new Date());
    const attribution = this.attribution();
    const campaign = { campaign_source:attribution.utm_source, campaign_medium:attribution.utm_medium, campaign_name:attribution.utm_campaign, campaign_content:attribution.utm_content, campaign_term:attribution.utm_term };
    w.gtag('config', this.id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: location.origin + location.pathname, page_referrer: attribution.referrer_host ? `https://${attribution.referrer_host}/` : '', ...campaign });
    w.gtag('event','page_view',{send_to:this.id,page_location:location.origin+location.pathname,page_referrer:attribution.referrer_host ? `https://${attribution.referrer_host}/` : '',...campaign});
    if (this.loaded) return;
    this.loaded = true;
    const script = document.createElement('script'); script.id = 'garage-ga4'; script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${this.id}`; document.head.append(script);
  }
  track(name: string, game: string, attribution: Attribution): void {
    if (this.consent.getState() !== 'granted' || !this.enabled || !this.loaded || !gaEvents[name]) return;
    (window as AnalyticsWindow).gtag?.('event', gaEvents[name], { game_id: game, send_to:this.id, page_location: location.origin + location.pathname, page_referrer: attribution.referrer_host ? `https://${attribution.referrer_host}/` : '',
      campaign_source: attribution.utm_source, campaign_medium: attribution.utm_medium, campaign_name: attribution.utm_campaign, campaign_content: attribution.utm_content, campaign_term: attribution.utm_term });
  }
  private revoke(): void {
    if (typeof window === 'undefined' || !this.id) return;
    const w = window as AnalyticsWindow; (w as unknown as Record<string,unknown>)[`ga-disable-${this.id}`] = true;
    // Remove pending pre-load analytics instructions as well as future tracking.
    if (w.dataLayer) w.dataLayer.length = 0;
    for (const cookie of document.cookie.split(';')) { const name = cookie.split('=')[0].trim(); if (!/^_ga(?:_|$)|^_gid$|^_gat/.test(name)) continue;
      const parts = location.hostname.split('.'); for (let i=0;i<parts.length-1;i++) { const domain = parts.slice(i).join('.'); document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${domain}; SameSite=Lax`; document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${domain}; SameSite=Lax`; }
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    }
  }
}
