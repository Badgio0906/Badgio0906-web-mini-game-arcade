import type { ConsentService } from '../core/ConsentService';
/** Isolated shadow DOM prevents game-wide input/CSS rules from affecting settings. */
export function installConsentUI(consent: ConsentService, privacyHref: string): void {
  if (document.getElementById('analytics-settings-host')) return;
  const host = document.createElement('div'); host.id = 'analytics-settings-host';
  const shadow = host.attachShadow({mode:'open'});
  shadow.innerHTML = `<style>:host{display:block;position:relative;z-index:10000;font:14px/1.5 system-ui,sans-serif;color:#183746}*{box-sizing:border-box}.settings{display:flex;justify-content:center;gap:12px;padding:10px;background:#fff8e8;color:#183746}.panel{position:fixed;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);width:min(440px,calc(100vw - 20px));max-height:calc(100dvh - 20px);overflow:auto;padding:16px;border:2px solid #263949;border-radius:10px;background:#fff8e8;box-shadow:0 4px 14px #0005}.panel[hidden]{display:none}h2{font-size:16px;margin:0 0 8px}p{margin:8px 0;font-size:13px}.actions{display:flex;gap:10px;flex-wrap:wrap}button{font:inherit;min-height:44px;flex:1;padding:8px 12px;color:#183746;background:#fff;border:2px solid #263949;border-radius:6px;cursor:pointer;touch-action:manipulation}button:focus-visible,a:focus-visible{outline:3px solid #426eba;outline-offset:3px}a{color:inherit}.settings button{flex:none;font-size:12px}.settings a{display:flex;align-items:center;font-size:12px}.close{margin-top:10px;width:100%}@media(max-height:430px){.panel{padding:10px}h2{font-size:14px}p{font-size:12px}}</style>
    <section class="panel" aria-label="解析データ設定" hidden><h2>ゲーム改善のため、プレイデータを利用してもよいですか？</h2><p>遊ばれたゲーム、プレイ回数、到達状況、流入元、端末の大まかな種類を解析します。同意後は再訪を調べるランダムなブラウザIDを保存します。</p><p>許可しなくても、すべてのゲームを遊べます。</p><div class="actions"><button id="grant" type="button">許可する</button><button id="deny" type="button">許可しない</button></div><p><a href="${privacyHref}">プライバシーについて</a></p><button class="close" type="button" id="later">今は選ばず閉じる</button></section>
    <div class="settings"><button type="button" id="settings">解析データ設定</button><a href="${privacyHref}">プライバシー</a></div>`;
  document.body.append(host);
  for (const event of ['keydown','keyup','pointerdown','pointerup','click']) shadow.addEventListener(event,e=>e.stopPropagation());
  const panel = shadow.querySelector<HTMLElement>('.panel')!;
  const close = () => { panel.hidden = true; };
  shadow.getElementById('grant')!.addEventListener('click', () => { consent.setState('granted'); close(); });
  shadow.getElementById('deny')!.addEventListener('click', () => { consent.setState('denied'); close(); });
  shadow.getElementById('later')!.addEventListener('click', close);
  shadow.getElementById('settings')!.addEventListener('click', () => { panel.hidden = !panel.hidden; if (!panel.hidden) shadow.getElementById('grant')!.focus(); });
  if (consent.getState() === 'unknown') panel.hidden = false;
}
