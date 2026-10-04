# Game007 / Game008 — Gameplay Readability Direction

2026-10-04 / [IMPLEMENTATION_SPEC](../IMPLEMENTATION_SPEC.md)44〜65・108〜109。大きな文字を追加するだけでなく、操作時に読む順番と実状態を一致させる。ゲームのmodelを変更する判断はGameplay/Root、UI/CSS/drawはUI Agentが所有する。

## 実際に見たBefore

旧保存[007 mobile](../../ten-game/screenshots/game007/mobile-gameplay.png)/[desktop](../../ten-game/screenshots/game007/desktop-gameplay.png)、[008 mobile](../../ten-game/screenshots/game008/mobile-gameplay.png)/[desktop](../../ten-game/screenshots/game008/desktop-gameplay.png)を実view。007は現在荷重と今回客が離れ、加算後の重量がない。008は距離と全残量がwalk-windowの外、内側のbody傾きが小字、方向meterは空の細い棒。旧Visual合格点は今回ユーザーの読取feedbackを覆さない。

## Game007 — 足し算を一つの視線に

**既存画像＋CODE UI**。retro wine/brass elevatorの素材を残し、新しい荷重dashboardをstage内の上〜中央へ。優先順位は現在/MAX→今回のkg→受諾後→2操作→Floor→Score。現在326/MAX450、残り124、今回82、受諾後408/450を読み順で連結。実modelの`load + currentParty.kg`を使う。overは総量と超過18kg等を文字でも示し、色だけで状態を表さない。

『今回の乗客』は現判断、『次の階の乗客/NEXT』は予測と明確に分ける。主操作は『見送る』『乗せる』、PC←/A・→/Dを下に併記。現在重量・今回重量・投影重量のD28〜40/M24〜32CSSpx程度、説明14〜16を出発点にする。実390/320/landscapeではkgを切らず1行、もしくは明示の2行で単位まで読める。

容量450kgとraw NEXT/destination/next unloadを残し、合法だから常に乗せるのが高得点という推奨ラベルは出さない。回答ボタンを現在客の正解に応じて明滅/色変更しない。warningのgold/inkとoverの文字で危険を説明し、受諾を自動判断させない。

降車は『8F / 2人降ります / −136kg』のように実party人数/荷物・kgをcodeで示し、load gaugeの移動が降車に対応する。capacity表示をいつの間にか変えない。人物絵を大きくするだけで情報を埋めない。practiceは200+60=260を乗せ、410+80=490の40overを見送る2操作。練習にのみ補助を付け、実runのrecommendationへ流用しない。

## Game008 — 液面とHUDを同じ場へ

**既存街画像＋CODE HUD/液体**。walk-window/canvas overlay内に方向・cup・距離・全杯残量を置く。距離はD32〜48/M26〜36CSSpx程度の『348 m』、数字とmを同じprimaryまとまりに。外のweb ledgerだけを読まないと進行が分からない構図にしない。Score/BESTはsecondaryで、重要な杯を縮めるほど増やさない。

方向の主状態は`bodyLean`という身体値だけでなく、実cupの相対液面と高い縁。現rendererの`surfaceTilt >= 0`は左縁の液体が高く左へspill、負なら右。Arrow/左・安定・右のmeterはこの実表示と照合する。横長中央安全域＋大きいpointer＋『液面 / 左にこぼれそう』等を用い、入力ボタンの矢印と状態矢印を取り違えさせない。codeの入力反応は慣性を持つため、通常runで常に正解方向を自動指示する設計にはしない。

複数杯の傾きを平均して相殺しない。主meterがworst risk杯を表すなら杯名を明記し、各独立window/残量も併せて残す。HUDとwindowは同一値から導出し、液体0/画面1%の旧矛盾を再発させない。percentageは小さな紙の下欄だけにしない。hazard予告はdirectionHUDとぶつからない位置/文量に。

practiceはfixed slow揺れ、実液面とmeter、反対入力で中央へ戻る体験。読む短文は大きく、見ているcupを指す。全杯追加や特殊地点は練習で説明しない。reduced-motionでもactual液面/残量/状態は残す。描画上の装飾swayだけを減らし、物理stateを示さなくなる対応を避ける。

## 実画面の判定

007：初見で現在/MAX/今回/投影、操作と降車を1視線で読める。320で3桁とkgが欠けない、NEXTが今回客に見えない。

008：PC/phoneで左右/安定をarrowと実液面から読める。距離/残量/方向が全てgame area内、三杯とhazard中もcup windowを覆わない。primary text大きさ、outside ledgerを見なくてよいことを実測/実画像で確認。

Rootexclusive browser release後に1440×900/390×844を最低、既存8viewportをQAで確認。独立80/F12/H12基準は維持するが、数値が通っても上の読取条件に失敗すれば修正。人間の即時理解・慣性操作の自然さはonboarding/本番を実playして初めて評価する。
