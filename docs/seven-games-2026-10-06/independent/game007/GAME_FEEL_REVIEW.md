# Game007 独立 Feel / 技術成立

**技術的なループ成立 PASS。人間の楽しさの判定は未実施。** seven_coffeeが007実装者から固定sourceを受け、独自のcollectorで全4画面の通常キー／touch tapを使った。検証元、SHA、画像、行動とscoreは [report](report.json)、再現scriptは [review.mjs](review.mjs)。readonlyモデル情報で候補を選ぶ自動policyであり、人間の先読みや読み取り速度ではない。

全4画面で実練習1F→4F、70kg会社員を乗せて空きを残して出発し、次階180kg速達を選び550練習点。練習時に本番run_start/endが0件で、練習BEST保存の混同はない。続けて通常便1F→10Fを達成し、それぞれ3370点/12組、HTTP・console0。屋上nativeは今回独立RUNでは選ばず10Fで記録を確定した。

最初の70kg乗車後score0。遠い320kgの低得点荷物を見送り、2Fの180kg速達を乗せる。3Fで150kg/2組が降り、200点を初めて得る。120kg団体を乗せたあと植物を足すと560/450kgとなり、UIが超過を示し乗車を無効化する。重い300kg/720点の配送や310kg/650点の冷蔵庫を選べるため、軽い物を拾うだけの操作から行先/価値/空き/締切を読む判断へ移っている。

実装者の別 [model3scenario](../../game007/QA/POLICY_COMPARISON.json) はgreedy1190/2430/1760、軽量のみ1180/1440/1410、単純planning2940/1880/3340。reviewerはこの原本とシナリオ/支持コードを照合して、万能policyが無いことを確認した。この数値を独立native3370と混ぜず、瞬時simulationであることを保持する。屋上の320kgを乗せて90kgを見送り、次110kg速達のために空ける価値は実装者の [屋上native](../../game007/QA/roof-final/report.json) に別記録がある。独立では屋上攻略を新たに再実行していない。

良い変更：移動/乗車/見送り/降車の時間コストが一貫し、乗車は点を生まない。カードに予定重量が出るので暗算ではなく行先と将来の空きに注意を使える。目的階へ届いた時の降車票/減量/得点に行為の結果が見える。

残る限界：締切は2Fから登場するため、最初の画面の未来情報で既に複数概念を見る。専用練習はあるが、本人が初見で理解するかは未確認。3scenario周回は学べる反面、長期の再プレイ差が十分かも人間評価が必要。実スマホで未来の細字と親指操作、判断の面白さ、音/FPSを今回AIだけで合格にしない。

再実行時はrepo source/public/HTML/configを新snapshotにコピーしてからレビューscriptのsnapshot参照とURLを明示的に置き換える。node_modules symlink、snapshot固有cacheDir、--strictPortで固定する。report既定pathはこの実行原本なので新outへ変える。今回の/tmpや稼働serverを再開の前提にしない。
