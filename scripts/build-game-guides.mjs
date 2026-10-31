import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { gameCatalog, developmentStatusLabels } from '../src/data/gameCatalog.ts';
import { gameGuides } from '../src/content/gameGuides.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const games = new Map(gameCatalog.map(game => [game.id, game]));
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const paragraphs = sections => sections.map(section => `<section><h2>${escape(section.title)}</h2><p>${escape(section.text)}</p></section>`).join('\n');
const link = (href, label, className = '') => `<a${className ? ` class="${className}"` : ''} href="${escape(href)}">${escape(label)}</a>`;
const nav = prefix => `<nav aria-label="サイト案内">${link(`${prefix}index.html`, 'ゲーム一覧')}${link(`${prefix}guide.html`, 'ゲームの選び方')}${link(`${prefix}about.html`, '100ガレについて')}${link(`${prefix}about.html#about-inquiry`, 'お問い合わせ')}${link(`${prefix}privacy.html`, 'プライバシー')}</nav>`;
function document(title, description, prefix, body) {
  return `<!doctype html>
<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#fff2d7"><title>${escape(title)} | 100ガレ</title><meta name="description" content="${escape(description)}"><link rel="stylesheet" href="/src/content/style.css"></head>
<body><a class="skip-link" href="#content">本文へ</a><div class="reading-shell"><header class="reading-header">${link(`${prefix}index.html`, '100ガレ', 'reading-brand')}${nav(prefix)}</header><main id="content">${body}</main><footer>${nav(prefix)}<p>100ガレ ～GAME100 GARAGE～</p></footer></div></body></html>
`;
}
function gamePage(game, copy) {
  const title = `${game.titleJa}の遊び方・コツ`;
  return document(title, copy.summary, '../', `
<nav class="breadcrumbs" aria-label="現在地">${link('../index.html', 'ゲーム一覧')} <span aria-hidden="true">/</span> ${link('../guide.html', '選び方・遊び方')} <span aria-hidden="true">/</span> <span>${escape(game.titleJa)}</span></nav>
<article><header class="guide-hero"><div><p class="eyebrow">${escape(game.titleEn)} · ${escape(developmentStatusLabels[game.developmentStatus])}</p><h1>${escape(game.titleJa)}</h1><p class="lead">${escape(copy.summary)}</p>${link(`../${game.route.replace(/^\.\//, '')}`, '▶ このゲームを遊ぶ', 'play-link')}<p class="play-note">無料・インストール不要。操作はゲーム内でも確認できます。</p></div><img src="../${escape(game.thumbnail.replace(/^\.\//, ''))}" width="640" height="360" alt="${escape(game.titleJa)}の実際のゲーム画面"></header>
<section class="controls"><h2>最初の操作</h2><dl><dt>PC</dt><dd>${escape(copy.controls.pc)}</dd><dt>スマートフォン</dt><dd>${escape(copy.controls.phone)}</dd></dl></section>
${paragraphs(copy.sections)}
<section><h2>終了と記録の見方</h2><p>${escape(copy.finish)}</p><p>${escape(copy.record)}</p></section>
<section class="related"><h2>違う遊び方も試すなら</h2><ul>${copy.related.map(item => `<li>${link(`./${item.id}.html`, games.get(item.id).titleJa)}<p>${escape(item.reason)}</p></li>`).join('')}</ul></section>
<p class="editor-note">遊び方・コツは公開版のルールをもとに編集しています。${link('../about.html#about-policy', '制作・編集方針')} · ${link('../about.html#about-inquiry', '説明の違い・不具合を報告')}</p></article>`);
}
const collections = [
  { title: 'ひとつの入力でも、判断は違う', intro: '押す瞬間、切り替える場所、離すまでの長さ。方向操作の少ない3作品を比べます。', items: [
    ['game001', '内側か外側か。前方の障害を見て軌道を切り替える。'],
    ['game014', '指ハートの形を見て、その瞬間に止める。'],
    ['game033', '長押しを離すタイミングで、花火の高さを合わせる。100秒間の打ち上げで得点を競う。'],
  ] },
  { title: '時間制限なしで、一手ずつ考える', intro: '急いで答えず、見えている情報から次の手を選びたいときに。', items: [
    ['game020', '同じ牌でも、上と左右の空き方で取れる順番が変わる。戻す・並べ直しあり。'],
    ['game025', '周囲8マスの数字から安全を考える。初級は推測不要を検証、理由付きヒントあり。'],
    ['game022', '赤黒交互の列を動かし、裏の札を開く。1枚めくり／3枚めくりを選べる。'],
  ] },
  { title: '動いた後を読む、物理の遊び', intro: '落とす、外す、投げる。操作を決めた後の揺れや衝突から次を考えます。', items: [
    ['game003', '建物の形を回し、重さの釣り合いを見て積み上げる。'],
    ['game034', '最大3か所の支えを外し、小屋を守って8つの建物を崩す。'],
    ['game035', '中心に寄せるか、青い石を弾くか。3エンド、各最大3投で配置を作る。'],
  ] },
  { title: '結果を振り返って、次の挑戦へ', intro: '得点だけでなく、釣果、連鎖、活動の記録など、違った積み重ね方があります。', items: [
    ['game032', '5分の釣行で場所と釣り方を変える。魚の最大サイズや履歴が端末に残る。'],
    ['game036', '落下地点の連鎖予告を比べ、4つつなげる。2連鎖を作る独立練習あり。'],
    ['game038', '月ごとの方針や決断を選び、配信者の活動を振り返る。人数や順位はゲーム内の仮定。'],
  ] },
];
const gameIndex = document('ゲームの選び方・遊び方', '100ガレのゲームを操作や目的で比較。時間制限のないパズル、1ボタンのタイミング、物理の遊びから選び、各作品の操作と判断のコツを確認できます。', './', `
<p class="eyebrow">FIND YOUR NEXT PLAY</p><h1>今日は、どんなひと遊び？</h1><p class="lead">短く区切って挑む日も、一手ずつ考える日も。<br>操作と目的の違いから、次のゲームを選べます。</p>
<nav class="page-jumps" aria-label="このページの案内">${link('#choices', '遊び方で選ぶ')}${link('#first-play', '初めての方へ')}${link('#all-guides', '全作品の遊び方')}</nav>
<div id="choices">${collections.map(collection => `<section class="collection"><h2>${escape(collection.title)}</h2><p>${escape(collection.intro)}</p><ul class="recommendations">${collection.items.map(([id, reason]) => `<li><h3>${link(`./guides/${id}.html`, games.get(id).titleJa)}</h3><p>${escape(reason)}</p>${link(games.get(id).route, 'すぐ遊ぶ →')}</li>`).join('')}</ul></section>`).join('\n')}</div>
<section id="first-play"><h2>初めて遊ぶ方へ</h2><dl class="faq"><dt>まず何をすればいい？</dt><dd>一覧のPLAYでゲームへ進みます。操作が気になったら「遊び方・コツ」へ。練習がある作品では、本番の記録に影響しない練習から始められます。</dd><dt>スマホの向きは？</dt><dd>「お前の仕事は俺の仕事」「タスク天国」は横向き、「落下キング」は縦向きで遊びます。途中で回転したら画面の中断・再開案内を確認してください。</dd><dt>完成版と試遊版は何が違う？</dt><dd>作者が試遊し完成と判断した作品が完成版、それ以前の作品が試遊版です。${link('./about.html#about-status', '状態の説明を読む')}。</dd><dt>BESTやお気に入りはどこに残る？</dt><dd>このブラウザの保存領域を使います。別の端末とは自動同期しません。作品によって保存する記録は異なります。全体記録の共有は、端末内のBESTと別の任意設定です。</dd><dt>遊べない・説明と違うときは？</dt><dd>ゲーム名、端末・ブラウザ、発生した操作を添えて${link('./about.html#about-inquiry', 'お問い合わせ')}へ。GitHub Issuesは公開投稿・ログインが必要です。</dd></dl></section>
<section id="all-guides"><h2>全${gameCatalog.length}作品の遊び方</h2><p>操作、終了条件、記録、作品ごとの判断を読む。</p><ul class="guide-directory">${gameCatalog.map(game => `<li>${link(`./guides/${game.id}.html`, game.titleJa)}<span>${escape(developmentStatusLabels[game.developmentStatus])}</span></li>`).join('')}</ul></section>`);

if (Object.keys(gameGuides).length !== gameCatalog.length || Object.keys(gameGuides).some(id => !games.has(id))) throw new Error('Guides must match the published catalog exactly');
for (const [id, copy] of Object.entries(gameGuides)) {
  if (!copy.summary || !copy.finish || !copy.record || !copy.controls.pc || !copy.controls.phone || !copy.sections.length || !copy.evidence.length) throw new Error(`Incomplete guide: ${id}`);
  for (const item of copy.related) if (!games.has(item.id) || item.id === id || !item.reason) throw new Error(`Invalid related game in ${id}`);
  // Sources can be files or directories (legacy source availability is recorded in the audit).
  for (const source of copy.evidence) {
    const { stat } = await import('node:fs/promises');
    await stat(resolve(root, source));
  }
}
const outputs = new Map([['guide.html', gameIndex], ...gameCatalog.map(game => [`guides/${game.id}.html`, gamePage(game, gameGuides[game.id])])]);
const existing = await readdir(resolve(root, 'guides')).catch(() => []);
if (existing.some(file => file.endsWith('.html') && !outputs.has(`guides/${file}`))) throw new Error('Unpublished or obsolete guide exists; review it explicitly');
for (const [path, html] of outputs) {
  if (check) {
    if (await readFile(resolve(root, path), 'utf8').catch(() => '') !== html) throw new Error(`Stale guide: ${path}. Run npm run guides:build`);
  } else {
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await writeFile(resolve(root, path), html);
  }
}
console.log(`${check ? 'Checked' : 'Generated'} ${outputs.size} editorial pages (${gameCatalog.length} games)`);
