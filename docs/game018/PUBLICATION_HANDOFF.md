# Game017／Game018 — 公開前の引き継ぎ書

2026-10-05 UTC。次タスクの目的は、準備したGame018候補をmainへ反映して、公開Portalに017と018が載り、PC／phoneで起動・プレイできることを確認すること。ユーザーの公開依頼は継続して有効。Jevだけで公開判断やコード変更を行わない。

## 現在の成果

Repository: `Badgio0906/Badgio0906-web-mini-game-arcade`。
公開先: https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/index.html

- **017**：mainの`1ab4fcf5a35637b15554d7942d944763e79920c9`へ反映済み。Pages [run37283475701](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37283475701)のbuild／deploy success確認済み。[公開記録](../game017/PUBLICATION.md)、[connector jobs](../game017/QA/PUBLIC_ACTIONS_RUN.json)。公開DOM確認は未実施。
- **018**：実装・ローカルPortal18本登録済み、公開前候補ブランチ **`codex/game018-shoe-fly-high`** に保存する。mainへの反映・Pages deployはこの作業では行わない。最新commitはこのbranchのHEAD、ソース採用commitは下の追記を参照。`work`は前環境のローカル名に過ぎない。
- 最新runtime/public freeze **`4e491ba21ec7f5b3bcfc86c1b5656e186d7dffc1f22fc94903afc1d19f27bfbd`**（301 files）。[実装報告](IMPLEMENTATION_REPORT.md)、[最終技術集計](QA/VALIDATION_SUMMARY.json)、[Gate](QA/RELEASE_GATE.json)、[Visual](VISUAL_REVIEW.md)、[Feel](GAME_FEEL_REVIEW.md)、[Jev](JEV_SHADOW_REPORT.md)。資料・tests更新をruntime hashの変更と混同しない。

248/248単体、TypeScript/build、PC/phone/320/short-landscapeのnative導線、独立最終PC SKY2投＋phone5靴7投、caption/実物SKY10hold、production root/sub0184件・0174件・既存modern28経路が最終技術集計に記録される。旧Godot3本は今回操作を再検証していない。人間の楽しさ／実機の指／音／FPS／酔いは[フォーム](HUMAN_PLAYTEST.md)で未実施。

## 現環境の外部接続

ユーザーは`badgio0906.github.io`／`api.github.com`を許可へ追加したと回答。しかし稼働環境は**enforced revision8**、custom allowed_hostsは`jev-ai.org`／`openrouter.ai`、presetはpackage_managersのまま。公開URLはHTTP CONNECT403。設定の新revisionがこの起動中プロセスへ適用されていない。[実通信記録](QA/PUBLICATION_NETWORK_BLOCK.json)。Git push／ls-remoteは成功しており、Git認証の失敗ではない。proxy回避やtoken/API key交換はしない。

ユーザーの「それでも通らなければ新タスクを立ち上げるので、サイトへのアップの前段階で引き継ぎ書を作成」という指示に従い、018は公開前で引き継ぐ。新環境でnetwork policyを確認し、公開URLへHTTP200でアクセスできるようになってから以下を進める。OPENROUTER_API_KEYを表示・保存しない。公開工程のためJevを再呼出する必要はない。

## 新Cloud taskでの実行手順

最初に[AGENTS](../../AGENTS.md)→[CURRENT_STATUS](../CURRENT_STATUS.md)→この引き継ぎと018報告を読む。`git status`で他の未commit作業を保護し、HEAD／branch／origin/mainを確認する。server、dist、Chromium、認証情報が残っている前提にしない。

```sh
git fetch origin main codex/game018-shoe-fly-high
git switch --track origin/codex/game018-shoe-fly-high
git log -3 --oneline
git status --short
```

既存local branchがあれば`git switch`先を適宜選ぶ。mainが依然1ab4fcfなら候補はfast-forward可能。別commitが増えていたら変更を読んで統合し、source freezeの変化・必要回帰を記録する。force-pushや旧HEADへ戻す操作はしない。

Node24で依存を準備し、`npm run check`／`npm test`／`npm run build`。保存済み成功を、新環境で再実行した結果と呼ばない。Chromium pathは各probeの`/usr/bin/chromium`を確認。必要ならVite5181／dist root4191／subpath4192を新しく起動する。QA出力は新しい`publication-qa/`等へ保存し、初回失敗や今回の合格原本を上書きしない。018 static probeの出力pathは現状fixedなので、再実行時はコピーscriptで出力先を変更する。

候補をレビューし、最新mainからfast-forwardであることを確認後、公開依頼に沿って反映する。

```sh
git merge-base --is-ancestor origin/main HEAD
git push origin HEAD:refs/heads/main
```

上の祖先確認が失敗した場合はpushせず統合する。Pages build／test／deployのsuccess、対象commit、run URLを保存する。GitHub APIが許可されてもgh認証がなければ接続済みGitHub toolでjobsを取得する。単なるpushやdeploy successだけで公開DOM確認済みと書かない。

## 公開URLで必ず確認すること

PC1440×900／phone390×844でPortalの**18カード**、017／018の正式タイトル・640×360実thumbnail・リンクを確認。各カードから起動し、直接game017.html／game018.htmlへのreload、font／scripts／console／404、CREDIT OFFで練習→本番→Retry→Portal帰還を確認する。017は経路描画、018はANGLE/SPIN/POWERの4段階練習をそれぞれ実入力する。公開assetのhashをローカルbuildまたはActions artifactと比較し、キャッシュと配信差分を分ける。

最新公開記録・Gate・CURRENT_STATUS・READMEを更新し、018公開commit／CI run／実DOM結果／未実施人間評価を分けて報告する。ユーザーへJev結果だけで公開可否を決めたと説明しない。
