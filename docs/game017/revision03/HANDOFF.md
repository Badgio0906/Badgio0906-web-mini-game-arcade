# 表示014の雨ゲーム・Web試遊公開準備

branch `release/rain014-web-preview`、作業tree `/workspace/arcade-rain-web`。基準main `9e96d557779c5de099fe54c51731ceb131e591a1`。採用元`b8fc0675ce6645a2c132d6a5d7c91b5ab822a60f`から雨改良だけを移入し、Vite通常buildへ候補HTMLを追加。003/037採用準備の変更は含めない。

候補は `https://game100garage.com/game017-revision03.html`（公開未実施）。正式旧雨ゲーム・Catalog・旧BEST/公開boardは維持。公開準備と費用確認は[PUBLICATION](PUBLICATION.md)、固有方針は[仕様](IMPLEMENTATION_SPEC.md)。

ローカルは`npm run dev -- --host 127.0.0.1 --port 4938`で起動し、`http://127.0.0.1:4938/game017-revision03.html`。sourceは既存改良候補とbytes一致。旧検証は[固定済み移設記録](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/tree/b8fc0675ce6645a2c132d6a5d7c91b5ab822a60f/docs/game017/revision03)を参照し、新しいmain基準での検査と区別する。

Webhookとbillingのreadが403である限り、全処理無料とは断言しない。ユーザーの費用条件が解消/判断されるまでmain push/公開開始は保留。PR/手動CI/無条件再実行/設定変更/既存job取消は行わない。
