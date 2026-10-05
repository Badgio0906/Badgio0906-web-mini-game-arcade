> 2026-10-05更新：018は公開済み。Runtime803a884、Pages37315859362成功、公開PC/phone2PASS・asset一致。[現在の公開記録](PUBLICATION.md)／[統合修正報告](../game015/revision-02/IMPLEMENTATION_REPORT.md)を優先。以下は公開前の履歴として保持する。

# Game018公開 — 次のCloudタスクへの引き継ぎ

2026-10-05（日本時間）。目的は実装・検証済みの018をmainへ反映し、公開Portalの18カードと017／018のPC・phoneプレイを確認すること。公開依頼は継続して有効。このタスクでは引き継ぎを保存し、mainへの反映は行わない。

## 現在の状態

Repository：[Badgio0906/Badgio0906-web-mini-game-arcade](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade)。候補ブランチは **`codex/game018-shoe-fly-high`**。018はこのブランチへ実装済みで、**mainには未反映・未公開**。

| 項目 | 確認済みの状態 |
|---|---|
| main | `1ab4fcf5a35637b15554d7942d944763e79920c9`、017までの17本 |
| 017のPages | [run37283475701](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37283475701)のbuild／deploy成功。公開DOMはまだ未確認 |
| 018ソース採用commit | `90c8c68c64e36f761c8ad06a575778608b377c98` |
| 引き継ぎ編集直前の候補HEAD | `6ad8793437abf3655f24d9fde1374585cf276f5a`。その後にこの文書の保存commitが加わるため、取得時はremote branch最新HEADを使う |
| runtime／public freeze | `4e491ba21ec7f5b3bcfc86c1b5656e186d7dffc1f22fc94903afc1d19f27bfbd`、301ファイル。文書・検証コピーの保存はruntime変更ではない |

今回の文書保存commitはメッセージに`[skip ci]`を含めない。過去の候補HEADには`[skip ci]`付きcommitがあるため、古いHEADをmainへpushしてPagesが動くと仮定しない。最新HEADのメッセージとworkflow起動を確認する。

## 公開を止めているもの

旧公開URL `https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/index.html`は現在 **`http://game100garage.com/index.html`へ301転送**される。ユーザーがこの転送先を意図したURLと確認済み。カスタムドメイン設定を変更・解除しない。

最終通信確認は**enforced revision10**。許可ホストは`api.github.com`／`badgio0906.github.io`／`jev-ai.org`／`openrouter.ai`で、**`game100garage.com`が含まれていない**。Git fetch／push／ls-remote、GitHub APIは利用できるが、公開先HTTPSはproxy CONNECT403、旧URLからの転送先HTTPも403。[最終実通信記録](publication-qa/NETWORK_RECHECK_REVISION10.json)。Git認証失敗や018コード欠落ではない。

新タスクではCloud runtimeスキルに従い、environment_status、`/etc/codex/network-policy.json`、実通信を確認する。設定画面の値だけで適用済みと扱わない。`game100garage.com`を許可ホストに含め、wwwへ転送される場合はそのホストも許可されている必要がある。proxy回避、TLS検証無効化、APIキー交換で解決しない。

前の引き継ぎ条件どおり、**実際の公開PortalがHTTP200で読めることを確認してからmain反映へ進む**。まだ拒否される場合は転送先・HTTP結果・適用設定を記録し、通信許可の反映を待つ。Git pushだけを公開検証完了と報告しない。

## 保存済みの検証と未実施事項

今回の新環境でNode24.19.0、npm ci、check、248/248単体、build成功。301ファイルの個別SHA256は全一致。ローカルproduction root／subpath × PC1440×900／phone390×844で018が4件、017が4件PASS。[今回の集計](publication-qa/VALIDATION_SUMMARY.json)、[018原本](publication-qa/PRODUCTION_ROOT_SUBPATH.json)、[017再実行原本](publication-qa/GAME017_PRODUCTION_RETEST.json)。018の4段階練習→本番→結果→Retry→Portal帰還、017の経路描画練習→本番→結果→Retry→Portal帰還、18カード・640×360 thumbnail・font／script・保存reload・CREDIT OFFを確認した。

017の初回検証コピーはbrowser終了前のresponse.body取得待ちが不足し例外終了。[失敗log](publication-qa/GAME017_PRODUCTION.log)を保持し、検証側で取得完了を待った再実行は4件PASS。製品コードは変更していない。

実装時の独立Visual／Feel／QA、320／short-landscape、既存modern28経路の結果は[実装報告](IMPLEMENTATION_REPORT.md)と[実装時集計](QA/VALIDATION_SUMMARY.json)にある。今回再実行した8件と区別する。旧Godot3本は今回再プレイしていない。

**公開DOM・公開asset一致・018のPages deployは未実施**。人間の楽しさ、初見理解、JUST難度、実機親指操作・音・FPS・酔いも[フォーム](HUMAN_PLAYTEST.md)で未実施。自動入力成功を人間合格へ変換しない。

別途依頼されたOpenRouter疎通はHTTP200、実利用モデルID`typesafe/jev-1.13-20260917`。これは公開接続やゲームの合格証拠ではない。公開工程のためJevを再呼出する必要はなく、Jevだけで公開判断・コード変更をしない。`OPENROUTER_API_KEY`の値は表示・保存しない。

## 新タスクでの実行手順

最初に[AGENTS](../../AGENTS.md)→[PROJECT_CONTEXT](../PROJECT_CONTEXT.md)→[CURRENT_STATUS](../CURRENT_STATUS.md)→この引き継ぎ→[公開工程記録](PUBLICATION.md)を読む。`git status --short`で他の未commit作業を保護する。server、Chromium、dist、依存、認証が残っていると仮定しない。

最新のmainと候補を取得する。この環境ではoriginのfetchspecがmain限定だったため、通常のfetchだけで候補のremote tracking refが作られると仮定しない。

```sh
git fetch origin refs/heads/main:refs/remotes/origin/main refs/heads/codex/game018-shoe-fly-high:refs/remotes/origin/codex/game018-shoe-fly-high
git switch -c codex/game018-shoe-fly-high refs/remotes/origin/codex/game018-shoe-fly-high
git status --short
git log -4 --oneline
git rev-parse HEAD origin/main
```

既存local branchがある場合は`git switch codex/game018-shoe-fly-high`を使い、remoteとの進み具合を確認する。旧commitへreset・force-pushしない。mainが別commitへ進んでいたら差分を読み、必要な統合と回帰を行いfreeze変化を記録する。

実公開先への通信を確認する。HTTPSが利用できるか、旧URLの転送先がHTTPからHTTPSへ変わったかも実測し、以後の`PUBLIC_MOUNT`にはHTTP200になった正しい配信rootを使う。

```sh
curl -LsS --max-time 30 -o /tmp/game018-public-portal.html -w 'HTTP %{http_code}; URL %{url_effective}\n' https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/index.html
curl -LsS --max-time 30 -o /tmp/game018-custom-portal.html -w 'HTTP %{http_code}; URL %{url_effective}\n' https://game100garage.com/index.html
```

Node24で`npm ci`／`npm run check`／`npm test`／`npm run build`を新環境で実行する。新しい未使用の証拠ディレクトリ（例：`docs/game018/publication-qa-next/`）へ保存し、今回・過去の原本を上書きしない。[SOURCE_FREEZE](SOURCE_FREEZE.json)の個別ファイルhashを照合する。保存済みPASSを新環境の実行結果と呼ばない。

必要なローカルブラウザ検証は`tests/eleven-game/serve-static.mjs`で4191 root／4192 repo mountを起動する。`/usr/bin/chromium`を確認し、[018検証コピー](publication-qa/game018-production.mjs)／[017検証コピー](publication-qa/game017-production-retest.mjs)を新しい出力先へコピーして実行する。出力pathは固定なので、そのまま再実行して原本を上書きしない。

公開前条件を満たしたら、最新mainを再fetchして祖先確認後、候補をmainへfast-forward反映する。

```sh
git fetch origin refs/heads/main:refs/remotes/origin/main
git merge-base --is-ancestor origin/main HEAD
git push origin HEAD:refs/heads/main
```

祖先確認が失敗したらpushせず統合する。`[skip ci]`付きHEADなら、公開記録の準備など必要な変更を通常commitで保存しPagesを起動できるHEADにする。[Pages workflow](../../.github/workflows/pages.yml)の対象commit、run URL、npm test／build／deploy successを保存。gh認証がなければ接続済みGitHub toolまたは利用できるGitHub APIで確認する。workflow_dispatchを使う場合はその実行と対象commitを明記する。

## 公開後の確認と完了条件

PC1440×900とphone390×844でPortal18カード、017／018の正式タイトル・640×360実thumbnail・hrefを確認。カードから起動し、game017.html／game018.htmlを直接reloadしてHTTP200、font／script／console／404を検査する。CREDIT OFFの練習→本番→結果→Retry→Portal帰還を実入力する。017は経路描画、018はANGLE／SPIN／POWER／連続飛行の4段階練習を確認する。

公開検証コピーは[018](publication-qa/game018-public.mjs)／[017](publication-qa/game017-public.mjs)。構文確認まで実施済みだが、**実公開上ではまだ実行していない**。転送先がroot配信なら、以下のように正しいURLと未使用の出力先を指定する。HTTPS_PROXY／HTTP_PROXYは継承したまま実行する。

```sh
PUBLIC_MOUNT=https://game100garage.com/ PUBLIC_QA_OUT=docs/game018/publication-qa-next/public-attempt-01 node docs/game018/publication-qa/game018-public.mjs
PUBLIC_MOUNT=https://game100garage.com/ PUBLIC_QA_OUT=docs/game018/publication-qa-next/public-attempt-01 node docs/game018/publication-qa/game017-public.mjs
```

各コピーは両カードの検査、カード起動・直接reload、プレイ、スクリーンショットとresource SHA256を記録する。検証スクリプト問題が出たら初回失敗原本を保存し、製品バグと区別して検証側を修正する。公開HTML／JS／CSS／font／017・018 thumbnailのhashを同じ公開commitのローカルbuildまたはActions artifactと照合し、キャッシュと配信差分を分ける。

[PUBLICATION](PUBLICATION.md)、[RELEASE_GATE](QA/RELEASE_GATE.json)、[CURRENT_STATUS](../CURRENT_STATUS.md)、[README](../../README.md)を、018公開commit・CI run・実DOM結果・asset照合・未実施人間評価に分けて更新し、証拠と文書を保存する。文書保存で再deployする場合も実際の最終配信commitを区別する。公開Portalで017／018を起動・プレイできる実証まで完了として扱う。

前環境からの引き継ぎ原文は[保存版](PUBLICATION_HANDOFF_PREVIOUS.md)。最新の再開条件はこの文書を使う。
