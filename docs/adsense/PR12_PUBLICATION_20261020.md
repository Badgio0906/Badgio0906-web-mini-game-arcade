# PR #12 本番公開記録（2026-10-20 UTC）

ユーザーが指定HEADのReady・通常merge・既存Pages公開を明示承認した作業。第2段階の修正やPR #11を混ぜない。

|項目|確認結果|
|---|---|
|PR|[PR #12](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/12)、**MERGED**|
|承認・確認HEAD|`0b6fa55ec98439d57e33d56d017b1b8b9f47e901`、変更98ファイル、未承認追加なし|
|直前CI|[39426337774](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39426337774) 成功、競合なし・CLEAN|
|main merge SHA|**`619adc35a4339dc5d6f1ddc4e357d5f7eccde991`**|
|merge日時|2026-10-20 13:57:09 UTC|
|Pages|[39434884258](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39434884258)、head=main SHA、push起動・attempt1、**build/deploy成功**|
|build内容|npm ci、npm test、Offline Jev、build、Pages artifactの既存workflow成功。新しいrunner/workflow・再実行なし。|

CLI Ready操作は一時401で失敗し、Draftのままのmerge試行も拒否された（統合なし）。その後connectorでReadyを成功させ、状態とCIを再読取り、expected HEAD付き通常mergeを実行した。force push／他PR merge／手動CI起動は行わない。

## 本番配信

新規HTTP GET・no-cache headersにより39 URLを確認。26 publicゲーム、既存retired4、index/about/privacy/adsは200。下記5本は**全て404**、別サイトredirect／indexへの200 fallbackなし。

|URL|HTTP|
|---|---|
|https://game100garage.com/game026.html|404|
|https://game100garage.com/game028.html|404|
|https://game100garage.com/game029.html|404|
|https://game100garage.com/game030.html|404|
|https://game100garage.com/game031.html|404|

Game031は `on-hold` でゲーム本体の入口をbuildから除外、source・素材・保存形式は保持。一部非実行素材の配信は既知。今回確認した公開26ルートとbuild入力に、031の代替play入口は認めない。公開GitHub上のsource保全とゲーム本体の配信停止は別。

本番portalを1440×900／390×844／320×568／844×390の4サイズで**73チェック成功**：26掲載、完成9・試遊17、削除4＋保留031が不在、OR/ANDの結果集合、状態絞り込み、favorite優先でも非favorite表示、古いfavorite IDの保持、個人BEST、ランキングfixture、about・privacy・Issues公開投稿／login注意、広告tag、横overflow0、pageerror0。全26のPLAY先HTTP200。追加プローブで032/033/034/035の表示番号が023/024/025/026、lazy画像26枚全てdecode成功を確認した。retired004/007/010/021は既存案内を保持。

本番検証は解析同意を勝手に保存せず「今は選ばず閉じる」を使用。記録・ランキングはGETのローカル応答fixture、外部広告・APIを遮断し本番POSTを行わない。Adsenseをクリックしない。最初のcollectorはads取得時のNode APIrequest DNSで失敗したため原本を保存し、ブラウザproxy内fetchで再確認した。製品バグとしない。

`privacy.html`、`ads.txt`（`google.com, pub-2598150338179299, DIRECT, f08c47fec0942fa0`）、AdSense／CMP／Analytics／Telemetry／Worker/D1／CREDIT／RecordSharingを保全。PR #11未統合。ActionsのNode20廃止とubuntu-latest移行注記は既存依存の通知で、今回workflowを変更していない。

## 証拠・限界

`integration-20261020/` にHTTP JSON、portal JSON・画像、番号／画像probe、Pages記録を保存。今回26本を本番で全プレイしたわけではない。個別ゲームの技術監査はPR12の既存監査、追加修正は別候補とする。公開成功は人間の面白さ、Googleの認識更新・AdSense承認を意味しない。管理画面・再審査は操作しない。
