# 金脈、ぶち抜け。 作者改訂2
得点/5列80段/金脈6〜8連結/移動0.18秒/一段一移動は維持。取得金脈3つごとにOVERDRIVEが上がり、0..4の5段階で破片・枠・光条・ドリル反動・SEを増やす。金脈取得時の実セル座標をmodelのburstへ保存し、rendererはその位置から破片を出す。演出の採否で得点や入力規則を変えない。
粒子上限200（軽量60）、24voice、元の音量/消音保存、pause cleanup、reduced-motionで反動/光条削減。Canvas backingは実CSSpx×min(DPR,2)で設定。SCORE/BESTの基準は不変のためrules1を維持。
GAPS基盤の実体は未確認。現状のSEは明記したローカル合成であり、GAPS使用完了とはしない。GAPS_REQUIREMENTS参照。
