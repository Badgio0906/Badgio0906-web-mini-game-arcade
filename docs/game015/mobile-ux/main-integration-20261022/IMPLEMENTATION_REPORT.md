# PR11：最新main統合候補・実機試遊準備

2026-10-22 UTC。**ローカル統合・検証の候補。未push、PR11はDraftのまま、本番未変更。** 内部game015＝表示番号012「落下キング」。内部Game012とは別作品。

## Gitと競合

- 最新main/live main：`b419041a3702f1afceed11f912b73543c8904652`。PR18の共有練習P1修正とPR13/Game012横専用を公開済み。
- remote PR11：`dbdf915a696b326f1247dd41c9f6cbf8765e9c56`、`codex/game015-mobile-landscape-ux`。
- 保存済みlocal PR11：`3f199c3521c4a34564b1d022d6af2fa91ed940a3`。以前のmain取り込み・保持キー回転guard・共有CSS修正・検証証拠を含む。remoteだけを起点にしてこれらを失わない。
- 今回は `3f199c3` から独立worktree `/workspace/arcade-pr11-integration-20261022`、branch `integrate/pr11-main-b419041` を作り、最新mainを通常merge。
- 実競合は **`docs/CURRENT_STATUS.md` のみ**。mainの全文とlocal側の全文を歴史として両方保持し、先頭に今回の現状を追記。製品コード競合なし。
- `/workspace/arcade-shared-practice-dialog` の未push事後文書commit **`7fe1d9d` は保全し、今回の祖先へ取り込んでいない**。元のGame015 worktree/branchも変更しない。
- 最終SHAは自己参照を避け、最終回答および受け渡しZIPの `HANDOFF.json` で確認する。

## 保持した仕様・差分

Game015の既存製品はlocal `3f199c3` とbyte一致。スマホ縦専用、横向き案内、256×448/4:7、左右/ DROP長押し・押下表示、pointer ID/capture管理、touchend fallback、blur/visibility解除、回転中立化/一時停止、縦に戻って明示再開、説明/練習/結果状態とending残時間を保持した。

mainで公開済みの共有CSSはそのまま：

```css
#arcade-training[open][data-phase='practice'] {
  display: grid;
}
```

共有CSSはmain/local3f/統合候補のSHA256が一致。共有 `onboarding.ts` の `setSuspended()` と練習の明示再開も既存PR11のまま保持。Game015以外の初期suspendedはfalse。`consentUI.ts` のmainとの差はPR11既存の `part="settings"` / `part="privacy-link"` 追加だけで、同意・撤回・保存・送信処理を変更していない。Game033の現行コードはmainと一致。

物理 `FallRun.ts`、定数types、練習物理、得点、難易度、BEST形式、RecordSharing、core/data、Game033、public/旧Godot資産、広告/CMP、Worker/D1、workflowはmainから差分なし。[固定ソース照合](QA/SOURCE_SCOPE.json)。

今回追加したものは、自然入力による練習成功画面回転テスト、非secure HTTP-originテスト、SHAを照合してビルド・配信するローカル試遊launcher、報告・証拠。新たなゲーム機能は追加しない。

## ローカル検証

| 検証 | 今回の結果 |
|---|---|
| `npm run check` | 成功 |
| `npm test` | **108 files / 1,041 tests成功** |
| `npm run build` | 成功。既存chunk/非module script等の警告は保持 |
| Offline Jev helper | 25成功。有料API呼出なし |
| Game015 DEV | **9条件 / 224 checks成功**。3縦幅、横案内、PC/タブレット除外、回転停止、入力解除、説明/練習/結果、再挑戦、BEST |
| compiled | **7サイズ / 80 checks成功**。390×844、375×667、320×568、844×390、932×430、667×375、1440×900。Game005・016開始も確認 |
| 長押し・解除 | **4サイズ / 115 checks成功**。3秒/10秒、左右同時/複数指、DROP、capture喪失、touchend fallback、選択抑止、blur等 |
| 保持キー回転 | 4/4成功。Enter/Spaceが回転後の「続きから」を誤起動せず、keyup後の新しい操作で再開 |
| 練習成功画面 | 6段階を実キー・実時間で完了、success中の横回転で閉dialog非表示、縦へ戻ってsuccess復帰、終了→本番開始が成功 |
| 共有練習001/005 | **16/16成功**。横で閉じる、display:none/DOMRect0、開始tap、本編入力、再練習、回転、focus復帰、一覧帰還 |
| Game033同意UI | **19/19成功**。PC/mobile/横/320幅、許可・拒否・後で・privacy・撤回・storage拒否、開始/練習/帰還 |
| サイト | 28カード・完成9/試遊19。削除4/031保留/037未公開は404。Game012の縦案内・横960×540全景・回転中断 |
| LAN HTTP-origin | `isSecureContext=false` / UUID=false / subtle=falseのfixtureで、Game015開始・DROP/解除・回転pause/明示resume・自然結果・BEST777以上の保存/reloadが成功。JS例外0 |
| 実Windows / 実iPhone Safari | **未実施**。実機の長押し・バー・音・永続保存・操作感は作者確認待ち |

各ブラウザは対象の固定ローカル配信のみを許可し、外部広告/解析/記録通信とwriteを遮断。read-only debug以外のモデル・score・時計の注入なし。一部のcapture/blur等のイベント故障条件はcollector内で明示している。機械的な成功を作者の操作感合格とはしていない。

初回unitはsparse checkoutで既存 `AUTHORIZED_PRESENTATION_HASHES.json` を省略し1 suite import失敗（1,036 tests成功）。追跡済みfixtureをそのまま復元して全1,041成功を確認。過去のモデル/hashを変更して通してはいない。mainから取り込んだ旧logの末尾空白は歴史を改変せず保持する。

[縦DEV](QA/portrait-dev/results.json) / [compiled](QA/portrait-compiled/results.json) / [長押し](QA/long-holds/results.json) / [保持キー](QA/key-rotation/RESULTS.json) / [練習成功回転](QA/practice-success/REPORT.json) / [共有P1](QA/shared-main-p1/results.json) / [Game033](QA/consent033/REPORT.json) / [LAN HTTP](QA/lan-http/REPORT.json) / [サイト](QA/site/REPORT.json)。

画像：[390縦プレイ](QA/portrait-compiled/390x844-playing.png) / [375縦](QA/portrait-compiled/375x667-playing.png) / [320縦](QA/portrait-compiled/320x568-playing.png) / [844横案内](QA/portrait-compiled/844x390-notice.png) / [667横案内](QA/portrait-compiled/667x375-notice.png) / [PC](QA/portrait-compiled/1440x900-playing.png)。

## iPhone試遊の方式

[Windows手順](WINDOWS_IPHONE_PREVIEW.md) / [作者確認票](IPHONE_CHECKLIST.md)。

第一候補は**Game015入力・回転・端末内BESTに限定したLAN HTTP**。本体はsecure-context必須ではなく、非secure originでも上記実測が成功した。任意の記録共有は `crypto.randomUUID` / `crypto.subtle` 等を使うのでHTTPをHTTPS同等とはしない。記録共有を有効化/試験投稿しない。既存preview serverのCSPが外部サブリソース接続を制限するが、リンクを辿った外部ページ移動までは禁止しない。本番へ移動しないこと。

launcherは受け渡しの厳密なSHA・tracked差分なしを確認し、ローカルbuild後に `__pr11-preview.html` と `__pr11-version.json` を作る。本番の旧版を取り違えないよう、ページに候補SHAと「本番版ではない」を表示する。PCの全非loopback IPv4についてURLを出力する。

作者からWindows IPは「未確認」と回答済み。この環境から実IP・実接続済みURLは確定できない。起動後の `http://<Windows-LAN-IP>:8443/__pr11-preview.html` が実際の確認先となる。形式例を発行済みURLとは報告しない。

HTTPSが必要になった場合は既存証明書を `--cert` / `--key` で利用可能。新規CA作成/信頼、iPhoneへの証明書導入、Windows Firewall変更、外部トンネルは未実施で、必要なら別途作者承認が必要。

## GitHub保存と公開制限

既存PUBLIC/標準ubuntu-latest・PR検証のみのworkflowを再確認。今回pushすればPR11 synchronizeによる既存CI（npm cache、check/test/offline/build）が実行され、main pushではないのでPagesは起動しない。

Webhookとbilling usageは今回も403。cacheは97,333,639 bytes / 2件だが、外部連動費用と契約上の保存容量課金はUNKNOWN。以前の個別了承を流用せず**未push、候補HEADのGitHub CIは未実施**とする。GitHub上のPR11は旧dbdf915/Draftのままで、ローカル競合解消を反映していない。

本番main/Pagesはb419041のまま変更しない。Game015の本番公開、PR11のReady/merge、自動merge、AdSense再申請、サービス・契約・課金・runner/Webhook設定変更なし。

## 次の条件

1. 受け渡しファイルをWindowsへ取り出し、同一LANのiPhoneで候補SHAを確認。
2. 作者の実iPhone Safari試遊（入力固着、縦Canvas、回転/明示resume、バー、音、同じoriginのBEST保存）。
3. 追加pushの費用不明点について今回分の判断を得てPR11へ通常反映、CIを確認。
4. 公開承認後にのみ本番統合を別タスクで実施。
