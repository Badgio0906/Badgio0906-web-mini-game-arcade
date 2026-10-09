import './style.css';
import { gameCatalog } from '../data/gameCatalog';
import { TelemetryService } from '../core/TelemetryService';
import { analyticsRuntime } from '../analytics/runtime';
import { observeCardImpressions } from '../analytics/impressions';
import { installPortalRecords } from '../records/PortalRecords';
import { mountRecordSharingSettings } from '../records/RecordSharing';

const telemetry = new TelemetryService(undefined, 'portal');
telemetry.trackEvent('portal_open');
const analytics = analyticsRuntime();
if (analytics?.consent.getState() === 'granted') telemetry.trackEvent('portal_view');
analytics?.consent.subscribe(state=>{if(state==='granted')telemetry.trackEvent('portal_view');});

const gallery = document.getElementById('game-gallery')!;
let cardPosition = 0;
for (const game of [...gameCatalog].sort((a, b) => a.releaseOrder - b.releaseOrder)) {
  const card = document.createElement('article');
  const imageLink = document.createElement('a'), playLink = document.createElement('a'), copyLink = document.createElement('a');
  imageLink.className = 'game-image-link'; playLink.className = 'game-play'; copyLink.className = 'game-copy-link';
  imageLink.href = playLink.href = copyLink.href = game.route;
  playLink.textContent = '▶ PLAY — ゲームを遊ぶ';
  imageLink.tabIndex = -1; imageLink.setAttribute('aria-hidden', 'true');
  playLink.setAttribute('aria-label', `${game.titleJa}を遊ぶ`);
  copyLink.setAttribute('aria-label', `${game.titleJa}を遊ぶ`);
  card.className = 'game-card'; card.dataset.gameId = game.id; card.dataset.cardPosition = String(++cardPosition);
  card.setAttribute('aria-label', game.titleJa);
  card.addEventListener('click', event => {
    const target = event.target as Element;
    if (target.closest('button')) return;
    if (!target.closest('a')) { playLink.click(); return; }
    telemetry.trackEvent('game_card_click', { selected_game: game.id }); telemetry.trackEvent('game_launch', { selected_game: game.id }); });
  const imageFrame = document.createElement('div'); imageFrame.className = 'game-image';
  const image = document.createElement('img'); image.src = game.thumbnail; image.alt = `${game.titleJa}のゲーム画面`;
  image.width = 640; image.height = 360; image.decoding = 'async'; image.loading = game.releaseOrder <= 4 ? 'eager' : 'lazy';
  const number = document.createElement('span'); number.className = 'game-number'; number.textContent = String(game.releaseOrder).padStart(2, '0');
  imageFrame.append(image, number);
  const content = document.createElement('div'); content.className = 'game-copy';
  const title = document.createElement('h2'); title.textContent = game.titleJa;
  const english = document.createElement('span'); english.className = 'game-english'; english.textContent = game.titleEn;
  const tagline = document.createElement('p'); tagline.textContent = game.tagline;
  const tags = document.createElement('ul'); tags.className = 'game-tags'; tags.setAttribute('aria-label', 'ゲームのタグ');
  for (const tag of game.tags.slice(0, 4)) { const badge = document.createElement('li'); badge.className = 'game-tag'; badge.dataset.tagId = tag.id; badge.textContent = tag.label; tags.append(badge); }
  content.append(title, english, tagline, tags); imageLink.append(imageFrame); copyLink.append(content); card.append(imageLink, playLink, copyLink); gallery.append(card);
}
document.getElementById('game-count')!.textContent = String(gameCatalog.length);
installPortalRecords(gallery);
mountRecordSharingSettings(document.getElementById('record-settings')!);

const saveRecords = document.getElementById('save-play-records');
saveRecords?.addEventListener('click', () => {
  const payload = telemetry.exportRecords();
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'arcade-play-records.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

if (analytics) {
  let disposeImpressions: (()=>void) | undefined;
  const install = () => { disposeImpressions?.(); disposeImpressions = observeCardImpressions(gallery.querySelectorAll<HTMLElement>('.game-card'),id=>analytics.seenImpression(id),id=>analytics.markImpression(id),(id,position)=>telemetry.trackEvent('game_card_impression',{selected_game:id,card_position:position,visible_duration_threshold:1000,catalog_version:`active${gameCatalog.length}-2026-10-08`,thumbnail_revision:'2026-10-06'}),()=>analytics.consent.getState()==='granted'); };
  install();
  window.addEventListener('pagehide',()=>{disposeImpressions?.();disposeImpressions=undefined;});
  window.addEventListener('pageshow',event=>{if(event.persisted)install();});
}
