# 所有者限定の試遊配信 / 2026-10-07 JST

本人の「はい作ってください」により、既存の所有者限定Sitesへの試作ページ追加・非公開配信を実施。

**試遊URL:** https://orbit-shift-game001.badio.chatgpt.site/prototype-stick.html

公式save_version_and_deploy_privateがversion6を `succeeded` と返した。返却されたoriginは `https://orbit-shift-game001.badio.chatgpt.site`。保存・配信したarchiveの静的root `dist` に `prototype-stick.html` が存在し、ローカル同ルートで実操作を確認したため、そのoriginと既存ファイルルートを組み合わせた。外部ホストを推測したURLではない。公式配信結果は [PRIVATE_DEPLOYMENT.json](PRIVATE_DEPLOYMENT.json)。公開後のURLをagentブラウザで再取得せず、公式成功状態をホスティング検証の根拠とした。

配信前後にget_siteでcustom権限を確認。owner1名のみ、他viewer/editor/group/external visitor0、権限revision1のまま。所有者本人のアカウントでログインする。共有範囲変更、新規Site作成、creation_intent再分類なし。URLの有効期限は公式応答に示されていないため無期限の保証はしない。

## 保全と検証

- 使った試作は手修正済み `cb816ce2b95e251436159f710a3b53f11a8c3ea0` の単独HTMLそのまま。物理/操作/グラフィック再設計なし。
- 既存Siteの実ソース `ffa433c3bd3e475235f3cc235bf9bf29292e7aaf` を専用checkoutへ取得し、`public/prototype-stick.html` を追加。Siteソースcommit `ca321e4ea55144c50037ccba91f484b9479dfe89`。
- 既存Game001(root)〜Game010のソースは変更していない。追加前後のビルドで既存90配信ファイルすべて同hash、追加ファイル1件のみ。[保全証拠](private-hosting-QA/preservation.json)。旧配信archive自体は取得できず、比較対象は旧ソースの再ビルド。新旧ホスト配信bytesの直接比較ではない。
- PC1366x900とスマホ390x844で開始、キーボード/タッチ入力、手の移動、落下、再試行、UI安全領域、pageerror0。[操作証拠](private-hosting-QA/browser.json)。既存10ルートのHTTP200もローカル成果物で確認。
- 試遊ルートはゲーム内の「やってみる」から即操作でき、宣伝ページを挟まない。既存トップはGame001を保持し、無断で試作一覧へ置換しない。
- 100ガレ本番 `game100garage.com`、GitHub main、Game008本体は変更なし。pushしたmainはSites専用Gitリポジトリのsource branchであり、GitHubのmainではない。

Sitesの現行skillを確認したが、指定site-workflow.mjsはローカル/skill配布に存在しなかった。そのため認証情報をstdin/メモリだけで扱うGit操作で同じ取得→チェック→source push→static archive確認を行い、公式native private save/deployで配信。認証情報はファイル/ログに保存していない。新規scheduleなし。

iPhone実機Safariのログイン・操作感・音・FPSは未確認。ユーザーのブラウザで試せる配信URLを用意した段階であり、本人試遊の評価を技術QAで代替しない。
