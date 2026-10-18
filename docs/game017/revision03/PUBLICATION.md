# 表示014の雨ゲーム・Web公開準備

status: ローカル統合候補。**Web未公開・main未push**。公開依頼は受領したが、ユーザー指定の費用条件が未解決のため、公開開始の前で停止する。

## 対象と公開内容

- repo: Badgio0906/Badgio0906-web-mini-game-arcade（GitHub APIで現在PUBLIC/private=false確認）。
- ローカルbranch: release/rain014-web-preview、main基準9e96d557779c5de099fe54c51731ceb131e591a1。
- 採用元: b8fc0675ce6645a2c132d6a5d7c91b5ab822a60fの雨改良runtime/14画像/原本/検査だけ。003/037の採用準備を含めない。
- 公開予定: https://game100garage.com/game017-revision03.html 。GitHub Pages build_type=workflow、既存cname=game100garage.com、source=main、HTTPS有効。
- 旧game017.htmlとCatalog/rules2/公開board/旧BESTを維持し、改良候補rules3の記録は別保存。既存一覧は27作品のまま。
- 共有変更はViteのHTML入力へ候補を1個追加するだけ。workflow/runner/billing/Secret/Cloudflare/D1/Analytics/広告/CREDITは変更しない。

## 起動する処理と料金確認

mainへpushすると既存pages.ymlのbuild→deployを1回開始する予定。どちらも標準ubuntu-latestで、matrix/runner変数/再利用workflow/workflow_runはない。checkout、setup-node（npm cache）、npm ci、単体tests、offline Jev契約tests、endpointチェック、tsc/Vite build、configure-pages、upload-pages-artifact、deploy-pagesを順に呼ぶ。pr-validationはPR/手動専用で、PR操作を行わないため起動しない。

PUBLIC＋標準ランナーの実行時間はユーザー提示の無料条件を満たす。しかし、それだけで全処理の追加費用0とは断言しない。cache97,333,639bytes/2件、未失効artifact59,351,792bytes/1件はread APIで確認できたが、アカウント全体の保存容量の契約/残量/課金状況はbilling API403で確認できない。Webhook一覧も403のため、外部連動build/deployや有料APIの有無はUNKNOWN。

必要な判断：保存容量の料金条件とpush連動Webhook/外部サービスの契約を確認できる情報、または、この不明点を承知で今回の1回のPages公開を実行してよいというユーザーの明示判断。単なる公開依頼を、以前の「有料/不明ならpush前で止まる」という条件の解除とは解釈しない。前回の許可済みfeature branch pushと、今回初めて実行するmain push＋Pages artifact/deployを区別する。

## ローカル検証

型検査PASS、1,107tests/104files PASS、通常production build PASS。検査logは[QA/web-preview](QA/web-preview)。ソース採用元のnative89/compiled24は[過去の固定候補記録](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/tree/b8fc0675ce6645a2c132d6a5d7c91b5ab822a60f/docs/game017/revision03)であり、今回のmain基準の新実行と区別する。

通常buildの新compiled検査と独立公開差分レビューは追記する。人間/Windows実機/Safari/実音/連続FPS、GitHub CI、Pages deploy、配信URLの200/bytes確認は未実施。予定URLを公開済みURLとして案内しない。

## 再開

費用条件が解消/明示判断されたら、remote mainが基準から進んでいないことと対象差分を確認する。fast-forward可能なこの公開候補だけをmainへpushし、既存の自動Pages実行を1回観測する。無条件に再試行/CI再実行/他ジョブ取消をしない。成功後は公開HTML/JS/CSS/背景/14画像のSHAとブラウザ4幅を確認し、実URL・run・commitを記録する。
