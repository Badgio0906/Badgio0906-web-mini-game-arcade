# PR #11競合解消・PR #13実機試遊準備

2026-10-22 JST / 2026-10-21 UTC。**ローカル統合・検証済み、未push、新HEADのCI未実施。本番変更なし。**

## 基準とGit保護

- 本番/latest origin/main: `537c6c384e0008da428ec395a3673c0fd63ae5dd`。ユーザー指定ac5304f/26本は036・038公開前の時点。現在は掲載28 / 完成9 / 試遊19、031保留、削除4、retired4を保持。
- PR11基準 `dbdf915a696b326f1247dd41c9f6cbf8765e9c56`、branch `codex/game015-mobile-landscape-ux`、tree `/workspace/arcade-game015-mobile`。
- PR13基準 `dfae1107b7c8ed8440fe8e44e239ca5840638532`、branch `codex/game012-mobile-visibility-fix`、tree `/workspace/arcade-game012-visibility`。
- 両方とも最新mainとの実mergeで競合したのは `docs/CURRENT_STATUS.md` のみ。main側履歴と各PR側履歴を両方残して解消。旧PRの変更・コミット履歴は維持。reset/clean/force/他作業破棄なし。
- PR13は必要なmain取り込みと文書競合解消のみ、ローカルmerge commit `3173faff26c9625be65f2cd7543417b067315f34`。Game012本体・wrapper・操作テストは旧PR HEADとbyte不変。HUD/ゲーム内容の再設計なし。
- PR11の最終SHAはcommit後の最終回答を参照（本書に自己参照SHAを埋めない）。元のmain作業tree `/workspace/Badgio0906-web-mini-game-arcade` は変更していない。

## PR11の機能保持と発見した修正

内部game015＝表示012「落下キング」。スマホ縦専用、横向き案内、回転入力解除/一時停止/明示再開、左右/ DROP長押し、PC通常プレイ、4:7・256×448を保持した。Game012とは別作品。

文書競合以外に自動mergeの衝突はない。ただし依頼された操作回帰で次を再現し、最小修正した。

1. **回転前から保持したEnter/Spaceが、本番/練習の「続きから」を押してしまう。** 実ブラウザの4 RED（2キー×2状態）を保存。Game015限定のcapture guardで、回転をまたぐ保持キーをkeyupまで無効化。新しく押したキー、横向き案内の設定/帰還は使える。4 GREENと独立レビューを確認。共通onboarding JSのキー処理は今回変更していない。
2. **既存mainの短い横画面用共有練習CSSが、閉じたdialogにもdisplay:gridを適用する。** Game001/005でopen=false・active=falseでも画面に残る2 RED。対象selectorに `[open]` を加える1行修正で解消。共有練習2件＋同意UIのkeyboard2幅、計4 GREEN。初回/許可/拒否/後での同意意味は変更しない。

最新mainのカタログ保存hashテストがPR11の承認済みGame015表示変更を旧hashで拒否するため、**main/styleの2キーだけ**レビュー済み固定hashを別fixtureへ追加。他の保存保護hashと過去manifestは不変。ブラウザの一覧カード数の古い27期待値は現行28に更新した。

今回の製品追加差分（旧PR11 HEADから）は `src/games/game015/main.ts`、`portrait.ts` と共有CSS1selector。既存PR11のFallBoard、入力解除、consentUIのpart追加などは保持した。物理/FallRun・難度・得点・BEST形式・RecordSharing・広告/CMP・Analytics/Telemetry送信意味・Worker/D1・他ゲーム本体・publicationStateを変更していない。

## ローカル検証

|確認|PR11|PR13|
|---|---|---|
|`npm run check`|成功|成功|
|`npm test`|108 files / 1041 tests成功|106 files / 1013 tests成功|
|`npm run build`|成功、最終CSS込み|成功|
|offline Jev helper|25 tests成功、APIなし|本工程では別途未実施（通常test/buildは実施）|
|ブラウザ操作|DEV9ケース224check、compiled7サイズ80check|matrix13ケース、lifecycle1、rotation gesture4ケース成功|
|長押し/解除|4サイズ115check成功、左右3秒/10秒・DROP・複数指・解除経路|既存横向き版を維持|
|回転保持key|RED4→GREEN4、解除後の新操作のみ再開|pointer/touch/Space/Enterの旧gesture持越し4ケース遮断|
|共有onboarding・同意UI|RED2→GREEN4|Game012独自shellを通常操作確認|
|実iPhone Safari / Windows LAN|**未実施**|**未実施**|

PR11 compiled対象: 390×844、375×667、320×568、844×390、932×430、667×375、1440×900。fine-pointer PC/大きいtabletの除外はDEVでも確認。safe-area・dynamic heightはChromium模擬であり、実Safariバーの合格ではない。縦・横案内・PCの最終スクリーンショットは `QA/portrait-compiled-final/`。

PR13は元960×540を実Godot起動で確認。縦は案内、横は明示開始、回転はiframe/sessionを**中断**し、戻しただけでは再開しない。fresh開始、一覧帰還、正規終了の0点/BEST 0保存・再読込、古い記録メッセージ拒否を確認。高得点BESTの実iPhone永続保存は作者確認が必要。Game015のpause/resumeとは挙動が異なる。

ビルドの大きいchunk等の既存警告を解消する設定変更はしない。Lighthouse/実GPU性能/実機の面白さ/音は未測定。

### 初回失敗の扱い

`QA/` に初回logも保全。sparse checkoutで欠けていた追跡fixtureのENOENT、古い27card期待値、旧固定hash、collectorの誤selector/非localhostネットワーク到達失敗は最終成功へ隠さず区別した。必要な追跡ファイルだけ復元し、依存は既存インストールを一時利用。実製品REDは上記保持key4件と閉じたdialog2件。CIを成功まで繰り返す操作は行っていない。

## iPhone実機試遊の準備

[LAN HTTPS手順](LAN_HTTPS_PREVIEW.md)、[作者確認票](IPHONE_PLAYTEST.md)、`tools/iphone-preview-server.mjs` を用意した。Windowsに両候補を別worktreeでbuildし、同一LANへHTTPS配信する。診断 `https://<PC-LAN-IP>:8443/__device-check`（PR11）、`:8444`（PR13）は**形式例で、発行・実機接続済みURLではない**。

Game012はfallbackなしのcrypto.randomUUIDに加え、Godot自身もsecure contextを要求する。非localhost HTTPのオフラインorigin fixtureでisSecureContext=false・UUID=false・開始時例外を再現。実loopback HTTPではsecure=true・UUID=trueで960×540起動。明示CAのTLS peer検証、MIME/404も成功。これはWindows LAN到達性・iPhone証明書信頼の証明ではない。

HTTPSには接続IP/SAN一致とiPhoneの信頼が必要。証明書導入/信頼・Firewall変更は**別途承認前に実行しない**。本環境は作者Windows LANへアクセスできず、今すぐ使える実iPhone URLは用意できない。公開トンネル、有料サービス、試遊用本番deployは使用していない。ツールはNode標準機能のみ、外部通信をCSPで遮断。試遊originのBESTは本番と別。

## GitHub状態・費用条件・公開禁止

確認時点のGitHubはPR11/13ともDraft、旧HEADのvalidate成功。ただしmain進行に伴いどちらも文書競合あり。今回のローカルmergeで解消したが、**未pushなのでGitHubの競合表示と新CIはまだ更新されない**。

- 旧PR11 CI: https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39417619403
- 旧PR13 CI: https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39524128355
- PUBLIC、既存PR validationはubuntu-latest標準runner、再利用workflow/matrixなし、npm check/test/buildとoffline helperのみ、deployなし。`setup-node` cacheあり。Pagesはmain pushのみで今回起動させない。
- Webhook一覧とbilling usage取得は今回も403。外部連動・cache保存容量の課金条件は**UNKNOWN**。以前の「不明ならpush前で停止」の指定に従い、ローカルcommitまで進め、今回2branch push/自動PR CIについて判断を待つ。過去の別タスクの了承を自動転用しない。
- mainへのmerge/push、本番Pages、AdSense再申請、有料API、契約/設定変更は行っていない。ローカルcommitはGitHubバックアップではない。

## 再審査前の残課題

1. 作者の実iPhone Safari試遊。特にGame012横画面HUDの読みやすさ/タップ、Game015の長押し解除/回転/ブラウザバー/保存。全項目未実施。
2. 両候補push後の最新HEAD CIとGitHub競合なしの再確認。
3. 実機不具合があれば限定修正して再確認。作者の公開承認まではmain統合しない。
4. Google内部の不承認理由はUNKNOWN。今回の修正・自動検証を再審査合格の保証として扱わない。

現在のローカル自動検証範囲では未解決P0相当を確認していない。実機未確認を「重大問題なし」に一般化しない。AdSense全サイト監査や別の改善を今回追加していない。
