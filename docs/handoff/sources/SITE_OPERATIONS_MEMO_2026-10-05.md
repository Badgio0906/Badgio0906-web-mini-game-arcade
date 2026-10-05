# GAME100 GARAGE 引き継ぎメモ
更新日: 2026-10-05

## 1. 公開サイト / ドメイン
- 独自ドメイン: `game100garage.com`
- Cloudflare Registrarで取得済み
- GitHub PagesのCustom domain設定済み
- GitHub Pages側のDNS check successful確認済み
- HTTPS設定も完了済み
- 正式公開URL: `https://game100garage.com`

## 2. GitHub
- リポジトリ: `Badgio0906/Badgio0906-web-mini-game-arcade`
- 既定ブランチ: `main`
- GitHub PagesはGitHub Actionsで`dist`をデプロイ
- `.github/workflows/pages.yml` は `main` pushでbuild/test/deploy
- `vite.config.ts` は `base: './'`
- 旧GitHub Pages URL固定の記述は確認時点で見当たらない

## 3. Cloudflare DNS
GitHub Pages向けに以下を設定済み。初期接続確認時はすべてDNS only。
- A `@` → `185.199.108.153`
- A `@` → `185.199.109.153`
- A `@` → `185.199.110.153`
- A `@` → `185.199.111.153`
- CNAME `www` → `badgio0906.github.io`
- GitHub Pages所有確認用TXTレコードも残している

## 4. Codex Cloud環境
- 対象環境: `Badgio0906-web-mini-game-arcade`
- インターネットアクセス: ON
- ネットワークシークレット: `OPENROUTER_API_KEY` 登録済み
- `JEV_API_KEY` を追加する必要はない
- Jev直APIではなくOpenRouter経由で使う運用
- `game100garage.com` をCodex Cloudの追加許可ドメインに入れる必要がある
- 念のため `www.game100garage.com` も許可推奨
- 既存許可ドメイン例: `api.github.com`, `badgio0906.github.io`, `openrouter.ai`
- 環境設定変更後は、既存タスクに反映されない場合があるため新しいCodexタスクで再開する

## 5. Game018 公開状況
- Game018は実装済みだが、まだ`main`未反映
- 候補ブランチ: `codex/game018-shoe-fly-high`
- 確認時点で候補ブランチは`main`より3コミット先行
- Game018の実装・QA自体ではなく、本番URL確認のネットワーク制限で公開工程が止まっていた
- 当時`game100garage.com`がCodex Cloudのallowed hostsに無く、公開URLへの接続が`CONNECT 403 Forbidden`
- そのため安全側で`main` pushを保留していた
- 引き継ぎ資料: `docs/game018/PUBLICATION.md`、`docs/game018/PUBLICATION_HANDOFF.md`、`docs/game018/QA/RELEASE_GATE.json`
- 公開工程再開時は、上記資料を読み、最新mainとの差分確認→必要検証→main反映→GitHub Pages deploy→`https://game100garage.com`で017/018確認、の順で進める
- 018を作り直す必要はない

## 6. Game018に関する確認済み事項
候補側の記録ではTypeScript check、単体248/248、build、PC / phone系、Game017回帰、runtime/public freeze、Jev shadow reviewを実施済み。人間による面白さ・実機操作感などは別途未実施。

## 7. AdSense
- Google AdSense登録を開始済み
- サイト: `game100garage.com`
- AdSenseホーム画面で「サイトをAdSenseにリンク」が未完了
- 次の操作: 右端カードの「開始」
- その後、Googleが提示するサイト所有確認方法からAdSenseコードスニペット等を取得
- コードを入れる場合は、基本的にHTMLの`<head>`内へ追加
- 既存ゲーム挙動・レイアウトは変更しない
- 将来的に`ads.txt`もドメイン直下で配信する想定
- Vite構成では`public/ads.txt`に置けばルート配信しやすい

## 8. 注意事項
- APIキーの実値はコード、ログ、チャット、GitHubへ出さない
- `OPENROUTER_API_KEY`はCodex Cloudのネットワークシークレット側で管理
- GitHub所有確認用TXTは削除しない
- 独自ドメイン移行後の正式URLは`https://game100garage.com`
- 既存ゲームへの不要な変更は避ける
