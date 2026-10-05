# Game019 — 独立 Game Feel Review

実装者とは別の reviewer が、通常キー／touch入力で練習、上昇、転落、再開、100m達成、宇宙到達を確認した。DEV の9通りの読み取り専用 forecast を選択の補助として用いた。位置・足場・時計・保存を直接書き換えていない。これは入力とルールの成立を確認する技術的な操作証拠であり、人間の楽しさ・精密操作の難度を合格にする試験ではない。

**最終技術判定 PASS。** PC／phone／320の最初の合格と、CSS限定修正後の [最終 landscape 実行](QA/independent-final/report.json) の合格を照合した。初回と最初の再実行の失敗を保持した上で判定する。

## 初回の固定候補

[実行 script](../../tests/game019/review.mjs)、[report](QA/independent-native/report.json) の branch、基準 commit、各 source SHA256、開始／終了時刻、実操作列を参照。source は実行前後で一致。Game019の desktop 1440×900、phone 390×844、narrow 320×568 は PASS。844×390 landscape は練習の touch が失敗したため FAIL。

各合格 profile では小・中・大・風の4段練習を説明通りの方向と大きさで完了。本番の BEST を保存しなかった。初回「すぐ遊ぶ」は練習完了フラグを作らず直ちに本番へ進んだ。pause では model.time が固定され、ヘッダーにfocusした Space はジャンプを起こさなかった。

通常入力32ジャンプで100m→海／鳥→風の空→200mの宇宙へ到達。途中で30.4mの足場から外す大ジャンプを選び、ピーク39.4mから井戸の底へ転落した。「39.4mも落ちた！ ゲコーッ！ まだ跳べる。」の実表示と、終了せず次のジャンプができることを確認した。最終 BEST 200.0mを reload で保持し、retry は高さ／そのrunの最高を0へ戻した。run_end clear は1回、best_update、sky phase が実際に記録された。CREDIT や外部 API はこの進行を制限していない。

## 発見と修正

1. 大ジャンプの練習文が「直進」だが、対象足場は右側だった。ソース独立レビューで発見し、右方向の説明へ修正。PC／phone／320で指示通りの実着地を確認した。
2. ヘッダー focus 時の Space がジャンプにも流れた。UI owner が button／anchor と修飾キーを除外。実際に mute にfocusして Space を押し、足位置が変わらないことを確認した。
3. 初回 landscape は `.status` の透明な box が方向ボタンの pointer を遮った。[失敗画像](QA/independent-native/landscape-FAILURE.png)と report の locator timeout を保持。画面の見た目では重なっていなくても、練習を操作できない製品不具合。UI owner が controls と status を別の grid row に分離した。
4. 分離後の [最初の再実行](QA/independent-retest/report.json) は操作32〜33ジャンプと200m到達に成功したが、canvas の intrinsic size で document 高さが988pxとなり、390pxのviewportから蛙が外れた。[独立 viewport 判定](QA/independent-retest/VIEWPORT_REVIEW.json)で **FAIL** を明示。raw script の PASS は入力／モデルだけの判定であり、画面の合格ではない。撮影後に playing／practice の縦viewportと全操作の座標を assert するよう collector を強化した。

第2修正は縦canvasを相対container内の絶対配置にし、controlsを44pxのinline2行（計96px）、statusを別行へ配置。最終 landscape は4練習、井戸、sky、結果の document 高さが390pxちょうどで、全主要操作がviewportに入り、通常touch32ジャンプで転落回復→100m→200mに到達。読み取り専用の予測以外を変更していない。UI owner の [4profile 練習・bounds・hit-test](QA/ui-layout-fix/RESULTS.json)も別に保持し、独立最終実行の代用にはしていない。モデルの難度や操作を弱めて通した修正ではない。

## 体験上の評価範囲

小はほぼ高さを増やさず横へ動き、中・大は上の足場を目指す。決めた方向は空中で変わらず、苔の滑りと小ジャンプ、低い天井と大ジャンプ、崩れる細い shortcut に操作上の理由がある。風は横／上下の加速度として実際の軌道を変え、現在と次の風を可視化している。海で一度完了感を出してから続く構成も実操作で確認した。

ただし今回の自動入力は正確な予測を9通り比較している。初見の人が着地点を見切る時間、ジャンプの快感、戻る悔しさと再挑戦意欲、風を読む面白さ、100m到達の満足は未測定。人間の playtest で確認する。狭い練習画面の主役の小ささと、short landscape の title menu をスクロールする必要は UI 上の残る評価上限。
