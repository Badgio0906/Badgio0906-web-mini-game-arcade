# Game047 実装報告
基準6211019。自由移動の質量成長ゲーム。世界960²、論理視野480²、DPR2。円判定・固定240Hz、tick開始質量から取得集合を確定、ID順加点、終端はライフ0優先。
モデル5テスト（質量境界/順序/供給57objects/速度・半径/無敵）、モデル攻略16.1875秒/1688/HP3。通常入力QA成功はQA/browser-1793366584166（PCと390全編、全4幅の練習/開始/pause/retry/帰還）。PCは30秒性能待機を含み53.3秒クリア。
初回失敗controllerのログは保持。明示的に回り込むツアーで再成功、ルールは変えていない。
最終b3723c60はラベル可読性と終了後0.65秒演出のみを変更、攻撃/質量/得点は不変。
外部送信/広告/解析/既存保存/共通設定に接続しない。新しい保存key100gare:game047:rules1、練習と途中退出はBEST対象外。人間・実機・聴感は未実施。
起動: node tests/batches/dopa-nine-20261030-a/run-batch.mjs game047 → node tests/batches/dopa-nine-20261030-a/preview.mjs、/games/snowball_xl/。未公開。

最終ソース8a242384、モデル/音源1369f70f。初期雪1個を開始位置の外へ移し、無入力5秒のmass16/score0を単体確認。元モデルのログはMODEL_ROUTE.json、変更後はMODEL_ROUTE_ACTIVE_COLLECTION.json。6モデルテスト成功。最終通常touch全編・30秒性能: QA/browser-1793367180359。最終production4幅/cancel/blur/設定/5retry/診断不在/相対path/reload帰還: QA/production-1793367264795。
