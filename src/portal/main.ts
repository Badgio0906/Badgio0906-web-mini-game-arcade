import './style.css';
import { gameCatalog } from '../data/gameCatalog';
import { TelemetryService } from '../core/TelemetryService';

const telemetry = new TelemetryService(undefined, 'portal');
telemetry.trackEvent('portal_open');

const gallery = document.getElementById('game-gallery')!;
for (const game of [...gameCatalog].sort((a, b) => a.releaseOrder - b.releaseOrder)) {
  const card = document.createElement('a');
  card.className = 'game-card'; card.href = game.route; card.dataset.gameId = game.id;
  card.setAttribute('aria-label', `${game.titleJa}を遊ぶ`);
  card.addEventListener('click', () => { telemetry.trackEvent('game_card_click', { selected_game: game.id }); telemetry.trackEvent('game_launch', { selected_game: game.id }); });
  const imageFrame = document.createElement('div'); imageFrame.className = 'game-image';
  const image = document.createElement('img'); image.src = game.thumbnail; image.alt = `${game.titleJa}のゲーム画面`;
  image.width = 640; image.height = 360; image.decoding = 'async'; image.loading = game.releaseOrder <= 4 ? 'eager' : 'lazy';
  const number = document.createElement('span'); number.className = 'game-number'; number.textContent = String(game.releaseOrder).padStart(2, '0');
  imageFrame.append(image, number);
  const content = document.createElement('div'); content.className = 'game-copy';
  const title = document.createElement('h2'); title.textContent = game.titleJa;
  const english = document.createElement('span'); english.className = 'game-english'; english.textContent = game.titleEn;
  const tagline = document.createElement('p'); tagline.textContent = game.tagline;
  const play = document.createElement('span'); play.className = 'game-play'; play.innerHTML = 'PLAY <span aria-hidden="true">↗</span>';
  content.append(title, english, tagline, play); card.append(imageFrame, content); gallery.append(card);
}
document.getElementById('game-count')!.textContent = String(gameCatalog.length);
