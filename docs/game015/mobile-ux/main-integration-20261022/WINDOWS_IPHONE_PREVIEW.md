# Windows → iPhone Safari：PR11候補の限定試遊

実Windows/iPhoneへ接続したとは扱わない。Windows IPは未確認。まずGit bundleをWindowsへ取り出せる必要がある。Git/Node/npmが未導入なら自動導入せず、利用者が準備する。証明書・信頼・Firewall・実行ポリシーを変更するコマンドは含めない。

## 1. 候補をWindowsの独立worktreeへ展開

最終回答のZIPをWindowsへ保存し、例えば `C:\ArcadePreview\handoff` へ展開する。ZIP内の `HANDOFF.json`、`.bundle`、`README_WINDOWS.md` を確認する。GitHubの旧PR11 HEADではなく、このbundleの候補を使用する。

既存100ガレcloneを使うPowerShell例（最初の3パスは自分の環境に合わせる）：

```powershell
$repo = 'C:\path\to\Badgio0906-web-mini-game-arcade'
$handoff = 'C:\ArcadePreview\handoff'
$trial = 'C:\ArcadePreview\pr11-candidate'
$meta = Get-Content (Join-Path $handoff 'HANDOFF.json') -Raw | ConvertFrom-Json
$bundle = Join-Path $handoff $meta.bundle
git -C $repo status --short
git -C $repo remote get-url origin
# originが対象repoであることを確認。既存変更をreset/cleanしない。
git -C $repo fetch origin main codex/game015-mobile-landscape-ux
git -C $repo bundle verify $bundle
if ($LASTEXITCODE -ne 0) { throw 'bundle prerequisite verification failed' }
$branch = 'preview/pr11-' + $meta.candidate.Substring(0,12)
git -C $repo fetch $bundle ($meta.ref + ':refs/heads/' + $branch)
if ($LASTEXITCODE -ne 0) { throw 'bundle import failed' }
git -C $repo worktree add $trial $branch
if ($LASTEXITCODE -ne 0) { throw 'use a new empty worktree path' }
Set-Location $trial
git rev-parse HEAD
# 上のSHAとHANDOFF.json.candidateが完全一致すること。
npm ci
if ($LASTEXITCODE -ne 0) { throw 'dependency installation failed' }
node tools/start-game015-preview.mjs --expected $meta.candidate --port 8443
```

既存cloneがなければ対象PUBLIC repoを新しい空フォルダへcloneしてから上の手順へ進む。`--depth` 付きの浅いcloneではbundle prerequisiteが不足し得る。verifyに失敗した場合は強制適用せず報告する。

launcherはtracked未保存差分・誤SHAを拒否し、buildする。成功後、PCの実IPv4から次の形のURLを表示する：

```
http://<実Windows-LAN-IPv4>:8443/__pr11-preview.html
```

**これは形式であり、現在接続済みのURLではない。** 複数URLが出た場合はiPhoneと同じWi-Fi/LANのWindowsアダプターを選ぶ。IPは `ipconfig` のIPv4や `Get-NetIPConfiguration` で読める。接続不可ならPCで `http://127.0.0.1:8443/__pr11-preview.html` が開くか確認し、iPhoneのエラーを記録する。Firewall/ルーター設定を自動変更しない。

## 2. iPhoneで候補を確認

同一LANに接続してSafariでlauncher出力URLを開く。ページのcommitが `HANDOFF.json.candidate` と一致し、「PR11 落下キング 縦画面試遊版」「本番版ではありません」と表示されることを確認。「このGame015試遊版を開く」から遊ぶ。

直接URLは `http://<実IP>:8443/game015.html?pr11=<候補SHA>`。query自体が候補を切り替えるわけではなく、**正しいbundle checkoutとlauncherのSHA検査が正本**。`game100garage.com/game015.html` は本番旧版なので今回の試遊先にしない。

Safariが保存アクセスを拒否するとlandingのAPI診断欄が空になる場合がある。候補SHAと静的リンクは残る。本体側の保存fallbackとは別なので、確認票の保存/reload結果を記録する。

LAN HTTPでは `isSecureContext:false`、`randomUUID:false`、`subtle`なしになり得る。Game015本体の入力・回転・端末内BEST限定の試遊で、これを起動失敗の条件にしない。旧 `/__device-check` にある `Game012_startup_prerequisites` は今回のGame015判定に使わない。記録共有を有効化・投稿しない。

preview serverはno-store・外部接続を制限するCSP・GET/HEADのみを使用する。広告クリックや本番サイトへのリンク移動は行わない。同意とBESTはorigin/IP/portごとで、本番の個人記録は自動移行されない。同じURLで保存/reloadを確認する。

## 3. HTTPSが別途必要な場合

既にiPhoneで信頼される証明書と秘密鍵がある場合は、同じlauncherに `--cert <leaf.pem> --key <leaf-key.pem>` を指定できる。新規証明書の作成/導入/信頼設定、Firewall変更、外部トンネルは今回行っていない。必要なら具体的な変更内容を示して作者承認後に別途実施する。証明書警告の無視・検証の無効化・秘密鍵の共有/commitをしない。

終了時はWindows serverをCtrl+Cで停止。今回のクラウド内loopbackテストはWindows到達性・iPhone信頼・実機操作の証明ではない。
