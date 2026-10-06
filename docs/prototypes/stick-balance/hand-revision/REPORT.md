# 手の描画修正 / 2026-10-07 JST

既存タスク・`codex/stick-balance-prototype`を継続。今回のベースは`27506f1`、試作元のmainは`c0c2941`。本人の「手が気持ち悪いので修正して」に対応。main反映、Game008置換、デプロイは行っていない。

## 変更と実画像

旧版のPC/phone実画像を最初に開いて比較。指が密に平行に並び、掌中央の閉じた親指輪郭、関節/爪状の細線、肌グラデーションが重なり生々しく不自然に見えた。SVGで指長の差を整理し、親指を外側輪郭へ接続、付け根を広げた。掌から手首/袖を連続した単純な形にし、肌/袖のグラデーションを削除。掌上面の小さな明色の平面と従来の接触影で支持位置を示す。

代表画像：[PC](QA/desktop-play.png) / [phone](QA/phone-play.png)。どちらも今回ソースを実際にChromium描画した画像。初回修正と限定修正後を実ピクセルで目視した。1366x900/1366x768/390x844/320x568/844x390も描画し、操作領域内収まりを確認。前回のQA画像は上書きしていない。

[独立レビュー](REVIEW.md)では旧版の肉感/閉じた親指形の改善を確認。限定修正後の親指と支持面も改善。一方、平たい手袋状の印象/奥行きの弱さは残り、本人の不快感が解消したとは断定しない。細線や陰影をさらに増やすより、現候補の比較確認を優先する。

## 範囲と検証

実行コード変更は `src/prototypes/stick-balance/main.ts` のSVG描画だけ。model.ts、style.css、入力、物理、難度、最高速度、得点、短縮時間、手首アニメーションは不変。スクリプト本体がベースとバイト一致することを確認（[SOURCE](QA/SOURCE.json)）。棒の接触座標(0,0)と接触影も維持。

- `npm run check`: PASS。
- 対象Vitest: 新試作7件＋既存Game008の5件＝12 PASS。SVG最終微修正後も型/専用build確認。物理等は変更していないため全352件の再実行はしていない。
- `npm run build`: PASS、対象外既存CSSのand(警告/Phaser大chunk警告は残存。[ログ](QA/BUILD.txt)。
- `npx vite build --config vite.stick.config.ts` / `node tests/prototypes/stick-package.mjs`: PASS、単独HTMLを更新。未配信。
- `tests/prototypes/stick-hand-review.mjs`: 5画面実描画、[LAYOUT](QA/LAYOUT.txt)。
- `tests/prototypes/stick-hand-smoke.mjs`: PC/phoneで通常D入力→手の移動→落下→retry、pageerror0。[SMOKE](QA/SMOKE.json)。
- 最初の画像取得は復帰直後の旧server/port競合・connection refusedで失敗、新規起動後に再実行。ゲーム修正で回避したものではない。
- Jevは本人の違和感を1findingとしてShadow記録。本人の美観判断をAPIの合否で置き換えない。

追加ファイルはこの報告/REVIEW/QA、再現用`stick-hand-review.mjs`と`stick-hand-smoke.mjs`。共通進捗資料は未統合試作の追記リンクだけ。

## iPhone試遊経路の調査（read-only）

**試作は操作可能だが、今回確認できたiPhone向け棒バランスURLはない。**

| 方法 | 確認結果・共有範囲 | 有効期限・制約 |
| --- | --- | --- |
| 既存Sites | `.openai/hosting.json`の既存Siteを確認。`https://orbit-shift-game001.badio.chatgpt.site`、以前のGame001、version5、更新2026-10-04。棒試作ではない。現在はcustom権限でowner1名のみ、他viewer/group/external visitorなし。`current_preview_url=null`。 | APIにこのSite URLの期限の記載なし。無期限の保証はしない。所有者ログインでiPhoneからアクセスする候補だが、棒の追加には別途デプロイが必要。 |
| 開発server | localhost5173で操作確認済み。現在使えるツールにiPhoneへ渡す認証付きport公開URLの発行手段なし。 | 環境/プロセス依存。外部から到達できるURLとは扱わない。 |
| 単独HTML | `artifacts/stick-balance/play-standalone.html`へ再生成済み。PC HTTPで再生する成果物。 | ファイル自体の期限なし。iOS上で受け取るだけで実行されることは未確認。ブラウザURLではない。 |
| GitHub画像 | 同じ試作branchへcommit/pushして閲覧用リンクを渡す。画像であり操作は不可。 | GitHubのrepositoryアクセス権に従う。短期署名URLではなく、commit/path保持中に参照可能。 |
| Library | 現行Libraryスキルのprepared uploadで代表画像2枚を新規保存しようとしたが、接続エラーで失敗。確認済みlibrary_file_idなし。 | 保存成功していないため共有URL/期限なし。Libraryに画像があってもゲーム操作URLとは別。 |

### 親への承認候補（未実行）

既存の所有者限定Sitesに `/prototype-stick.html` という試作ページだけを追加し、現在のGame001と所有者限定アクセスを保持したまま非公開デプロイする方法が候補。これなら同じ所有者アカウントでiPhoneからアクセスするURLを作れる見込み。ただしSitesでは非公開でもdeployは本番操作に当たり、今回の「デプロイしない」指示の範囲外なので未実行。既存Siteの保存ソースを確認し、旧内容を上書きしない追加配信の準備を別途行う必要がある。新規公開ホスティング、共有範囲の拡大、main反映は不要かつ未許可。

親がユーザーに確認する場合は「既存の所有者限定Sitesへ試作ページだけ追加し、非公開でデプロイする」対象/共有範囲を明示する。URLは実デプロイ成功後の返却値で確認し、成功前の推測URLを試遊URLとして渡さない。本人のiPhone実機での操作/ログイン/音/FPSはその後に確認。
