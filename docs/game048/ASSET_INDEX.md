# Game048 4画像と音

rootがpublic/assets/game048へcourier.webp/parcel.webp/hook.webp/board.webpを配置。補助は存在/hashだけ記録し、ImageGen原本/生成prompt/権利/alpha/採否/実画面はrootが担当。生成済み情報を推測して補記しない。独立builderはこの4点をout/assetsへcopy、runtimeは./assets/name.webpから全decode後に開始可能。

|name|用途|補助の採否|
|---|---|---|
|courier|配達員、本体の中心点を明示|実表示未確認|
|parcel|運ぶ荷物とgoalの荷物記号|実表示未確認|
|hook|番号をcodeで重ねる接続先|実表示未確認|
|board|上向き配送路の背景装飾、当たり判定なし|実表示未確認|

仮図形を美術完成と扱わず、画像decode失敗時はplay/practiceをblock。qaでも美術代替はしない。

048のGAPS元exportは未提供。独自compound WebAudio、外部サンプル/声なし。hold機械音、hookの金属音/報酬、release風音/低音、失敗/配達成功を分離。24source上限、stop/mute/0 cleanupはmock機能検査。人間の聴感は未確認。
