# Windows PC → 実iPhone Safariの試遊準備

## 現在の到達点と制約

**実iPhoneから接続・証明書検証済みのURLはまだない。** この作業環境はクラウドLinux `/workspace` で、利用者のWindows PCや同一Wi-Fi上にない。WindowsのLAN IP・証明書・iPhoneの信頼設定・Firewall状態は未確認。クラウドの127.0.0.1を案内してもiPhoneには届かない。公開トンネルや追加サービスは使わない。

推奨はWindowsで候補branchをbuildし、同一LANへHTTPS配信する方式。`tools/iphone-preview-server.mjs` をPR11に用意した。Node標準ライブラリのみ、既定は127.0.0.1、TLS証明書を明示指定する。診断ページ `/__device-check`、正しいHTML/JS/WASM MIME、実404、COOP/COEP、外部広告/解析/記録通信を遮断するCSPを付ける。証明書生成/インストール/信頼設定/Firewall/トンネル/本番環境は変更しない。

利用者の指示「証明書のインストール・信頼設定、Windowsファイアウォール変更など、利用者の端末設定を変更する前には必ず承認」に従い、**下記の端末設定を伴う工程は別途承認後に実行する**。現在は手順と検査用ツールの準備だけ。

## HTTPとHTTPSの比較

|方式|判定|
|---|---|
|Windows自身の `http://localhost` / 127.0.0.1|通常secure context扱い。PC単体確認用で、iPhoneへ共有されるURLではない|
|iPhoneの `http://Windows-LAN-IP:port`|推奨不可。非secure originではUUIDが使えず、さらにGodot自身がsecure contextを要求|
|同一LANの正しく検証できるHTTPS|推奨。アクセスIP/hostnameと証明書SANが一致し、iPhoneで信頼されていることが必要|
|USBだけでWindows localhostへ接続|標準の確立済み経路として案内できない。iOS Safariの標準リモート検査はMac側Safariが前提|
|公開トンネル・別Pages/Workerサービス|今回は禁止。用意していない|

`public/games/yokodori-days/index.html` はfallbackなしで `crypto.randomUUID()` を使用。Godotの `index.js` のfeature checkも `window.isSecureContext===true` を要求する。UUIDだけを置換してもHTTP問題は解決しない。今回ゲームコードを変更して回避しない。

Game012は元960×540、`GODOT_THREADS_ENABLED=false`。WebGL2、WebAssembly、fetch/Response stream、secure context、wrapperのUUIDが必要。**SharedArrayBuffer/crossOriginIsolatedはこの非thread exportの必須条件ではない**。COOP/COEPを付けてもHTTPがsecureになるわけではない。IndexedDB/APIが存在しても永続保存成功は別、AudioContext/AudioWorkletの音も実機で確認する。

## 承認後にWindowsで行う工程

1. PCとiPhoneを信頼できる同一LANへ接続し、`ipconfig` でPCのIPv4を読む。以下の `<PC-LAN-IP>` は実値に置き換える。ゲストWi-Fi/AP isolation/VPNで相互接続できるとは保証しない。ネットワーク設定を勝手に変更しない。
2. 両branchの今回のHEADを取得し、別worktreeへ展開する。PR11は `codex/game015-mobile-landscape-ux`、PR13は `codex/game012-mobile-visibility-fix`。各worktreeで `npm ci`、`npm run build`。実行前に最終報告のSHAと一致させる。未pushならGitHubの旧HEADを今回の検証済み版と扱わない。
3. 既にiPhoneで信頼される適切な証明書がなければ、無料のmkcert等でローカルCA/leafを準備する方式がある。**導入・`mkcert -install`・iPhoneへのCA導入/明示信頼は未承認の端末変更なので今は行わない。** 例（承認後のみ）：

   ```powershell
   mkcert -install
   mkcert -cert-file C:\ArcadePreviewTLS\lan.pem -key-file C:\ArcadePreviewTLS\lan-key.pem <PC-LAN-IP> localhost 127.0.0.1
   mkcert -CAROOT
   ```

   leafは実IP/hostnameをSANに含める。iPhoneへ渡すのはCAの公開証明書のみ。CA秘密鍵・leaf秘密鍵を共有/commit/`dist`へ置かない。iOSのプロファイル導入と証明書信頼設定は、対象CAを確認し承認後に利用者が行う。警告の無視やブラウザ検証無効化は使わない。
4. WindowsでNodeのLAN待受を許可する必要があれば、そのFirewall変更も承認後に限定して行う。自動変更コマンドは用意していない。公開ネットワークへ無制限に許可しない。
5. 例えばworktreeを `C:\arcade-pr11` と `C:\arcade-pr13` に置いた場合：

   ```powershell
   # Game015 / PR11（別PowerShell）
   cd C:\arcade-pr11
   node tools\iphone-preview-server.mjs --dir dist --host 0.0.0.0 --port 8443 --cert C:\ArcadePreviewTLS\lan.pem --key C:\ArcadePreviewTLS\lan-key.pem

   # Game012 / PR13（別PowerShell。ツールだけPR11のものを利用）
   cd C:\arcade-pr13
   node C:\arcade-pr11\tools\iphone-preview-server.mjs --dir dist --host 0.0.0.0 --port 8444 --cert C:\ArcadePreviewTLS\lan.pem --key C:\ArcadePreviewTLS\lan-key.pem
   ```

6. iPhoneで `https://<PC-LAN-IP>:8443/__device-check` と `https://<PC-LAN-IP>:8444/__device-check` を開く。これは**書式例であり発行済みURLではない**。証明書警告なし・`isSecureContext:true`・`randomUUID:true`・WebGL2/WebAssembly/fetch/ReadableStreamがtrueであることを記録。false/接続不能なら中断して原因を確認する。
7. Game015：`https://<PC-LAN-IP>:8443/game015.html`、Game012：`https://<PC-LAN-IP>:8444/games/yokodori-days/index.html`。[実機票](IPHONE_PLAYTEST.md)を実施する。試遊用origin/IP/portは本番と別なので、本番BESTは自動移行されない。端末内記録・同意も各originごと。再読込での保存確認は同じURLで行う。
8. 終了したら両serverをCtrl+Cで停止する。証明書/信頼/Firewallの後片付けも利用者が承認範囲内で行う。

## この環境での検証と未確認

非localhost HTTP originのローカルdistをPlaywrightで返すオフラインfixtureで、secure-context=false・UUIDなし・開始失敗を確認した（実LAN接続の検証ではない）。実127.0.0.1 HTTP serverではsecure-context=true・UUIDあり・960×540起動を確認した。ローカルserverのMIME/404/外部遮断、明示CAによるTLS peer検証も成功した。ローカル証明書をOSやiPhoneへ導入していない。これらは**実Windows/iPhoneの信頼・到達性・操作の代替合格ではない**。実デバイス設定の承認とLAN情報が得られるまで、実iPhone試遊は未実施。
