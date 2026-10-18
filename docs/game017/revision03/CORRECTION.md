# 雨ゲームの対象訂正

ユーザーは一覧に表示される「014」の雨ゲームの改良を意図していた。実装者が新作と解釈しGame038を予約したのは誤り。2026-10-19にCatalogの実モジュールを読み、番号対応を確認した。

| 一覧の表示番号 | 内部ID | 現行作品・route |
|---|---|---|
| 014 | game017 | 雨って避けたら濡れないよね ～RAINSHIFT～ / game017.html |
| 011 | game014 | 指ハートチャレンジ / games/finger-heart-challenge/index.html |

雨の改良は内部Game017 revision03へ移管。内部014のGodot出力/route/保存は空差分。既存雨ゲームrules2と旧BESTを保持し、候補rules3は固有namespaceへ分離する。038の新作予約を解除し、新ゲームとして登録/件数加算しない。

移設基準は先のpush済み`2a6e36af3058559d69058d24728f4a9fb50cec0c`、ゲーム部分の元検証は`963956a`。前のGit履歴やraw QAを削除/書換えず、docs/game038と元割当には撤回表示を付けた。038の製品/asset/テストは017/revision03へ移し、同じ画像bytes/モデルを活用する。二重制作/再生成は行わない。

Game037採用準備とGame003完成指定はこの訂正で変更しない。main反映/公開/PR作成も行わない。旧branch名`feature/game038-rain-umbrella`の038は誤った分類が残った履歴名であり、新しいゲームIDを意味しない。正しいローカル作業branchは`revision/game017-umbrella-r3`。
