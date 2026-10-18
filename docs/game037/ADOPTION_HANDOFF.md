# Game037 / Game003 採用準備の引継ぎ

対象branch`integrate/game037-game003-20261018`。PR9先端6123b39を基準に、採用製品cab8bef（037本体はPR9のまま）/QA記録0628dcb。main9e96d55とPR9のremote先端は作業末にも不変を実確認。正式採用の指示は受領したが、main統合/Pages公開は今回行わない。037の完成版指定と混同せずtrial、003だけ明示指定でcompleteへ。

[採用記録](ADOPTION.md)、[独立監査](ADOPTION_INDEPENDENT_REVIEW.md)、[003完成整理](../game003/COMPLETION_ADOPTION.md)を読む。差分は必要なCatalog/Portal/Vite/実thumb/台帳/ローカルBEST読取/関連expectation/生成catalogと文書。ゲーム本体/既存save/BEST/他game/Analytics/Worker/D1/広告/CREDIT/CI/Secretの直接変更0。037カードのイベント未発火で未登録外部送信を防ぎ、共通Analytics登録を広げていない。

検証：型/全体1110tests成功、BEST読取32byte整合fix後の対象7件/build成功、固定cab8befの既存実browser575/575、統合一覧4幅36checks成功。source不変/POST0。統合一覧は既存AdSense scriptの読取8試行を通信前にブロック、タグは変更していない。初回collectorの画像待ち・既存広告の期待値失敗も保持。人間/物理端末/実音/Safari/FPSは未実施。PRの過去CIは現在のlocal検査とは区別。

PUBLIC/標準runnerでも、Webhook403/外部連動・課金条件UNKNOWNのためpush保留。[監査JSON](QA/local-adoption/PUSH_COST_AUDIT.json)。mainpushはPages公開まで連動する。ユーザーの条件を満たすまでpushせず、PR操作/Actions起動・再実行・既存job取消/main merge/公開/deploy/workflow・予算等の変更もしない。

復元は `/workspace/100gare-next-stage.bundle` と隣のCHECKSUMを手元へ保存し、main9e96d55を含むcloneへfetchする。

```sh
git fetch /path/to/100gare-next-stage.bundle refs/heads/integrate/game037-game003-20261018:refs/heads/local-adoption
git switch local-adoption
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4939 --strictPort
```

`http://127.0.0.1:4939/index.html` の正式候補一覧から037へ入る。ここでの候補28本は現在の公開サイトへ反映済みではない。保存場所は `/workspace/arcade-adoption`。GitHubのバックアップではないので、作業環境破棄前にbundleを保存する。
