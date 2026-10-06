# Game008 独立 Game Feel Review

**技術・設計成立PASS。人間の面白さは未実施。** Reviewerは007実装者`seven_elevator`で、008コードを編集せず独自の[通常入力collector](QA/independent-elevator/review.mjs)を作成した。4画面のreadonly DEV診断で観測・方策を選び、通常キー/タップだけを送った。モデルの位置・score・時刻は書換えていない。

PCの最初10秒では、←を短く押すと左を上げ右側が低くなる。右を支えると逆へ戻り、押しすぎると反対へ傾く。実snapshotはbodyLeanとliquidAngleが別の値で、液体が器に完全固定されていない。正確な角度を読まなくても器と左右警告で低い/危ない縁を認識する構造。Spaceは1回でpace切替、慎重は立て直しに使う。

独立PCは直線で急ぎ、16m予告を確認して10m手前から慎重へ切り替え、左右を小さく補正。180mを29.669秒、残量99.939%、**2092点**で実配達した。配達choiceは250ms待ってもclock/snapshot不変。その後通常clickで2カップへ進み、同じ支え/paceのまま器と液量が2つになる実画面を確認してquitした。2杯の完配達はこの独立RUNでは行っておらず、担当自身のnative phone full RUN記録とは区別する。

phone相当viewportではnative pace tap、左右の実キーと短い保持、pause完全停止、実練習の左右→pace往復→段差慎重通過で`practice-done`、54m/練習score0を確認。320/横は実支え・pace・pauseと三操作44pxを確認した。これは実機の親指体験ではない。

担当のモデル比較では慎重のみ180/4=45秒は締切32秒を超える。急ぎのみ180/8=22.5秒は速いが、同じbalance feedbackでもspillが増える。mixedは配達し残量が上回る（[対象テスト](../../../tests/unit/game008.test.ts)、担当ログ）。モデル計算と独立PC実RUNの双方から、安全直線で急ぎ危険前に落ち着かせる選択が成立する。無予告の風/危険乱数はなく、段差48m・左角94m・継ぎ目142mは固定し、急ぎでも16m/8=2秒の予告。失敗を学べる構造である。

Visualは初回横canvasの伸縮を別問題としてFAILにし、担当CSS修正後の[限定横実入力](QA/independent-elevator-landscape-final/report.json)で再確認。これをphysicsの失敗や人間の認知評価へ言い換えない。

残る人間確認：32秒の圧が楽しいか、左右支えを本能的に理解できるか、2杯の液量に気を配る負荷、横letterboxと320meterの判読、実機親指・音・FPS。気持ちよさを自動完走で断定しない。新font統合後の文字coverageと公開経路はMainが別に確認する。
