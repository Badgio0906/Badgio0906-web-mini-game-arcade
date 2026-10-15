# ちいさな解体屋 ～DEMOLITION DAY～

今回指示書48–51章、56–61章に基づく初版。設計想定1–3分、未実測。

Core loop: 8現場のそれぞれで実部品を最大3か所選択→部品除去→8秒のMatter実物理崩壊→採点→次の現場。読みと実結果を見比べ、同じ現場をやり直せる。やり直し前の得点は合計へ入らない。8現場完了だけBESTと共有候補へ。

8種: ふたつ足の門、右ポケット工場、左重り時計塔、三つ足の橋、階段のお城、ふたこぶホテル、空中の四角い庭、ずれずれ本社。足の位置/数・高さ・上棟重心・密度・目標範囲・守る小屋側が異なる。玩具の個別矩形をそのまま描画・SAT colliderへ。支柱は地面へ固定された玩具の足、選んだ足はworldから外れる。梁と上部は着地後もdynamic。

操作: canvasの支点または44px以上の候補buttonでtoggle。4か所目は追加せず3つを保持。実行button/Spaceで解体。slowは0.35倍、実物理時間の上限は8秒。pause/blur/hiddenで物理・時間を停止。titleから説明/独立練習/すぐ遊ぶ。

物理: Matter.js0.20、120Hz固定、50msフレーム上限、position10/velocity8、friction0.65/static1.2、restitution0.02、sleep。組立状態を120step落ち着かせ基準座標を取得。選択中は進めず、実行後だけ進める。周辺小屋への実contactを記録。

採点: 可動残部品の質量を重みとして、実boundsの黄色範囲内比率×350、基準位置から12pxを超えて90px落下した比率×400、小屋無接触150。低く崩せた質量55%以上かつ小屋無接触なら(4-除去数)×60のeconomy。各現場難度1.00–1.56倍。構造の実崩壊をscoreへ反映し、成功animationで代用しない。

BESTは`web-mini-arcade:v1:game034:best-rules-v1`、全8現場の累積score、上限20000。練習は独立world、BEST/共有/本番runイベントへ入れない。muteは同namespace。旧ゲームの保存は不変。途中の世界resume保存は初版に含めない。

広告/CREDITなし。外部Analyticsは明示`remoteCollectionEnabled:false`、登録確認まで準備中。recordSessionは完了RUNのみcomplete。共通catalog/Vite/recordDefinitions/gameVersionsはroot担当。
