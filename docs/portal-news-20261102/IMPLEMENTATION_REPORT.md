# トップページ新着情報欄 — 2026-11-02 JST

基準main e8132c46cc4bce477f65fbe0d61001040bbdee92。branch feat/portal-news-20261102。

## 実装

index.htmlの紹介文とdiscovery-panelの間へ、見出し・日付(time datetime)・種別ラベル・内容とゲームへのリンクを追加。最新3件を新しい順に静的HTMLで掲載。JSが読み込めない場合も新着本文とリンクは残る。PCは日付/ラベル/本文を横並び、540px以下は本文を全幅の次行に配置。欄内はスクロール可能でtab focus/キーボードにも対応。自動送りなし。既存の配色・枠・影に合わせる。

初期掲載の根拠（公開日は日本時間）:
- 2026-11-02: 雷のSE強化/左下キャラクター。PR22/e0dfed9bとPR23/e8132c46。
- 2026-11-02: 046/050/060/061の元アート復帰。PR21/7921686e。
- 2026-11-01: 新規試遊版22作品。PR20/7209da2f（公開28+22=50）。

## 更新手順

正本はindex.htmlのportal-news-list。将来の追加・削除/公開終了・改修を公開した際、その公開日（JST）と利用者向けの短い内容を先頭へ追記する。同日内は新しいものが先頭。予約/未公開PRを公開済みとして書かない。
種別のclassはnews-kind--new（追加）、news-kind--update（更新）、news-kind--removed（公開終了）。削除したゲームの名称は通常テキストとし、404へのリンクは作らない。内容を増やす場合もスクロール枠の高さは固定上限を維持する。自動Gitログ転載や外部APIは使わない。

公開終了の追記形（以下は記入テンプレートであり実際の告知ではない）:
`<li><time datetime="YYYY-MM-DD">YYYY.MM.DD</time><span class="news-kind news-kind--removed">公開終了</span><p>ゲーム名の公開を終了しました。</p></li>`

## 検証

npm run check成功。npm run build成功。CSSのモバイル幅調整後にbuild/QAを再実行。
`TMPDIR=/dev/shm node tests/portal-news/browser.mjs`：1440x900/390x844/320x568/844x390の4ケースPASS。
- 3件の日付が新しい順であること、intro→news→discoveryの順、本文のモバイル全幅、横overflowなし。
- 全告知リンクHTTP200。
- 完成版フィルター9/解除50、お気に入り登録と再読み込み保持。
- JS無効時にも新着情報が存在。
- pageerror0。広告/解析等の外部接続はabortし実送信なし。画像はローカル本番構成distの実画面。
- 初回Chromiumは一時領域逼迫時にtarget crash。失敗記録をQA/initial-environment-crash.jsonへ保持し、TMPDIRを/dev/shmへ変更して再実行成功。製品の合格として初回失敗を隠さない。
- 320幅の初期本文余白を自己目視で発見し限定CSS修正。初期画像はQA/initial-mobile-spacing.pngに保持。最終PC/320幅画像を自己目視し、欠けや重なりなし。独立Visual/実iPhone評価は未実施。

カタログ/Portal JS/ゲーム/保存/広告/解析/Worker/D1不変。製品差分はindex.htmlとsrc/portal/style.cssのみ。

## Git/公開

ローカルcommitまで。既存作業・未push文書・node_modules symlinkを保全し別branchで実装。main/push/PR/Actions/本番変更なし。新規有料APIなし。前回公開の1回限定了承はこの機能へ流用しない。今回の公開判断は作者待ち。
次の3手：画面確認→今回のpush/公開承認→既存CIとPagesで通常公開し本番の新着/絞り込み/お気に入りを確認。
