# 落下キング 改訂03 実装報告

2026-10-05 日本時間。実装仕様は[IMPLEMENTATION_SPEC](IMPLEMENTATION_SPEC.md)。改訂02の等距離4.4〜4.6m配置を、2.1〜5.8mの安全な床間隔と10.6〜10.8mの深いクッション着地へ変更した。DOWNホールドは普通の床を通過し、落下距離をリセットせず、左右操作と同時に使える。ホールドを離すと次の石床で着地するため、欲張りすぎた着地は9m以上で失敗する。やわらかい床は12mまで耐えるが、深い着地では短い硬直がある。

中央トゲ・細い石床・可変幅・崩れる床・移動床を保ち、全段の安全経路を実際の飛行時間で制限。ゆっくり刻める経路と、途中の2段を飛ばす速い経路を同時に持つ。追走18→36px/秒と上端死亡を保持し、無限連続落下で12m以上の床を逃しても死亡する。理由は結果に表示する。

王様は改訂02のドット絵を使用。やわらかい床を青緑のクッションにしてSOFT CATCHを表示し、タイトル・操作ガイド・練習に連続降下と距離リスクを反映した。追加ImageGenなし。サムネイル更新は統合工程で実画面から行う。

## 検証

- `npx vitest run tests/unit/game015.test.ts tests/unit/game015-practice.test.ts`: **36/36 PASS**（モデル27、練習9）。既存の正確な6/9・9/12m境界、64seed×350m安全経路、1seed5000m／2seed1200m継続、生成700chunkと80seed×20chunkの全身着地湾を含む。
- 改訂03追加項目：押し続けた途中の普通床で衝撃をリセットしない／離して10m石床へ落ちると死亡／10.7mやわらかい床へのNICE着地とホールド再開／ホールド中もトゲ接触で死亡／全6パターンに距離差と深い着地を保持／実際のホールドと左右入力で深い経路へ到達／中央維持ホールド25seedが40m未満で終了。
- ブラウザ候補検証: **desktop1440×900／phone390×844／narrow320×568／landscape844×390の4/4 PASS**。通常PCキーと実タッチイベントで6段練習を完了し、2枚の床の通過、10.6〜10.8mクッション着地とNICE、ホールド解放、pauseの完全停止、待機による天井死亡、retryの保持入力解除、BEST保存、ポータル帰還を確認。[readonly診断とgeometry](QA/native-final/report.json)、[実行ログ](QA/candidate-native-final.log)、[候補source hash](QA/candidate-source.sha256)。対象015ソースは実行前後のhash一致。統合全体の最終production検証とは区別する。
- 初回ブラウザ候補はPC PASS、phone／320のホールド経路と横画面geometryがFAIL。タッチ側はQA harnessのCDP touchEndへ残る接点を渡し、DROPを解除してLEFTを残していたことをnative pointertraceで確認。終了する接点を渡す修正で解消し、ゲーム側のmulti-touch判定は変更していない。横画面は増えた説明行による本物のviewport超過を確認し、play gridの上端揃えとguide行間を修正。初回失敗ログ・画像は[QA/native](QA/native/)へ保持。
- 1440×900の実落下画像を`assets/portal/thumbnails/game015-risk-source.png`へ保存し、採用crop／配信thumb／台帳は統合担当へ渡した。
- TypeScript `npx tsc --noEmit` PASS。全体build・全単体・公開確認は統合工程の記録を参照する。

## 継承と残課題

Telemetryは実際の新BEST時にbest_update、死亡時にdeath_reason（impact／spike／needle／bird／scroll）、各DROP時にspecific_game_events（held／depth／platform_id）を記録する。BESTのキー／m単位、ジャンプなし、慣性、王様素材、音、CREDIT OFFを維持。練習は独立6段に更新し、共通開始選択の「すぐ遊ぶ／説明を見る／練習する」へ接続した。人間の面白さ、実機での同時押し・音・FPSは未評価。深い経路の発見しやすさと硬直の納得感は人間試遊で調整する。
