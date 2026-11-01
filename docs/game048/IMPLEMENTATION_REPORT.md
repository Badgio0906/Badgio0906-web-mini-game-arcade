# Game048 補助実装報告

担当next10_review、開始観測52c5fc72fb24c77be48d1db1eae2eb0332727e99。game048許可pathだけ。model.tsと既存探索/全FAIL原本を保持、commit/index/remote/共有変更なし。

最初の重要finding：PASS原本1793375833379は元hooksではなく、find-route.mjsが実行時に変更したhooks上の解。元modelのoriginalにそのまま適用すると7.8秒のgrabが失敗し、next3で落下する。元コースの可解性が解決したとは言わない。rootが未公開の別コース設定として調整hooks採用を許可したためcourseModel.tsを作成。元physics本体byte一致と両コースのreplay差をunit固定。

調整コースでは原本17操作が全成功、15.004166秒/goal内/next9まで座標一致。game wrapperでも3601tick/3164点で成功。最後のgrab/releaseは同tickで、人間操作余裕を保証できない。最後保持1/4tickは成功、12/24tickは17秒時点でgoal未到達。元prefix固定の50ms刻み0〜2秒検査も成功0だけ。これを隠さずrootへ報告した。

root許可の有界スイープ：最後hook7→8の入力だけ変更、上限2M tick、実1,987,765tick/606候補/3030保持検査。最初7取得までは原本同一、release tick3948(16.45s)、最終grab3996(16.65s)で最後の保持100/150/200msにgoal到達。150ms列はgame開始から全replayし4222tick=17.591666秒/3219点/全9接続成功。250/300msはこの候補で未到達。サンプル3点から連続した100〜200ms全区間が安全と主張しない。native/人間成功ではない。

起動HTML、独立Vite、固定240Hz UI wrapper、上向きcamera、取得annulus、1指/Spaceの所有とfresh操作、cancel/pause保持と旧click遮断、strict個別BEST/音設定、compound SE、qa読取getter/直近frame/audio観測を追加。rootが4WebPを配置済み、loader/configは./assets/name.webpとout/assets/name.webpで一致。画像の実表示/採用を補助は認定しない。

検証は対象unit/strict tsc/未実行probe構文のみ。最初の入力module検証でabort関数の閉じ括弧不足を検出し修正、原本UI_UNIT_DRAFT.logを保持。ゲーム物理の限定修正は行っていない。最終件数/exit/timestampはQA/CHECKS.json、hashはQA/SOURCE_HASHES.json/PROTECTED.json。

Chrome/ImageGen/build/全体test/performance/nativeは未実施。原則UI sourceは完成時に固定し、有界検査以降はtests/docsのみ変更。rootの通常入力追試で成功しない場合は公開保留、モデル解から候補完成/人間面白さ/実機/聴感を認定しない。
