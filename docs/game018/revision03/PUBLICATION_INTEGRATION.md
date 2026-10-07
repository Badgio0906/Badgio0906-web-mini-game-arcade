# Game018 revision03 — 公開統合の追補

2026-10-07 UTC。ユーザーが「修正済みの靴とばそ（Game018 revision03）も、安全に統合して本番公開してください」と追加承認したため、Game020の隔離作業ツリーへ既存候補を統合する。公開前までの記録であり、CI・本番反映は別途確認する。

## 採用範囲と証拠

- 元候補：`codex/game018-connected-angle-spin`、基準 `fd1d09a293cd8da1b9dbfeb73dc3e68e27ad7bcc`。元作業ツリーは読むだけで保全した。統合先は `codex/game020-pair-tile`。
- 採用runtimeは `ShoeBoard.ts`、`main.ts`、`shoePose.ts` の3ファイルのみ。独立Visualレビュー時のSHA256と全て一致し、今回追加の描画・物理変更はない。[コピー元と採用ハッシュ](QA/INTEGRATION_SOURCE_MANIFEST.json)。
- 新しいshoe-pose単体テスト1本と再現collector2本を採用。通常時計collectorには `SHOE018_COMPILED_REPORT_DIR` の出力先指定だけを追加し、過去のQA出力を上書きせず再実行できるようにした。
- `physics.ts`、`ShoeRun.ts`、`kickPose.ts`、`rarePresentation.ts`、`spinGuide.ts`、靴性能・型・Art・CSS・HTML・manifest・CREDIT設定は基準commitとbyte一致。[12ファイル保護確認](QA/INTEGRATION_PROTECTED_FILES.json)。保存キー、BEST、飛距離、SPIN物理、宇宙／レア抽選、入力方式は維持する。
- 改訂03の元報告・独立レビュー・Jevログ・成功と初回失敗の画像等175ファイルをそのままコピーした。画像とログは当時の証拠であり、今回の本番確認として扱わない。ロックファイルはコピーしない。[当時の変更と制約](IMPLEMENTATION_REPORT.md)。

## 今回の確認

統合後、`npx vitest run tests/unit/game018-shoe-pose.test.ts tests/unit/game018.test.ts tests/unit/game018-revision02.test.ts` を実行し、42件／3ファイル成功。コード差分を独立に読み、変更は全身表示の維持、同一足首transform、靴を根元にしたANGLE矢印・弧、選択値連動SPIN、LOCK値表示、設定角度cos/sinに沿う射出描画であることを確認した。既存骨格や基礎物理の変更はない。

指示文書の今回の読込は [INTEGRATION_INSTRUCTION_READS](QA/INTEGRATION_INSTRUCTION_READS.jsonl) に記録した。これは統合作業時の再読込であり、以前の作業開始時に読んだ証拠として使わない。

過去5行のJev記録をオフラインで照合し、各 `api_attempted=true`、`status=AVAILABLE`、HTTP200、resolved model、4回答と独立判断・採った証拠が存在することを確認した。[既存ログの照合](QA/INTEGRATION_HISTORICAL_JEV_CHECK.json)。今回のコピー・ハッシュ一致・単体PASSは新しいfindingではなく、Jevの追加呼出・再レビューは行っていない。Jevの回答を公開判定には使わない。

統合先の固定ビルドを5520で起動し、通常時計collectorを新しい `QA/integration-native/` へ実行した。PC1365×900でclickとSpace／Enter／clickの2RUN、390×844のタッチ相当でtapの2RUN、ANGLE→SPIN→POWER→kick→flight→結果→retryを成功した。全28captureの不透明画素比は1、pageerror0、production用debug hookなし。[今回の実操作記録](QA/integration-native/report.json)／[完了時のソース・ビルドentry hash](QA/INTEGRATION_COMPILED_FREEZE.json)／[今回の対象単体結果](QA/INTEGRATION_UNIT_RESULT.json)。

この統合担当がdesktop-run0-spin、phone-run0-spin、phone-run0-powerの実PNGを見た。SPINの少年全身と本人の足首からのリーダー線、固定支点・つま先の分離、方向と強さの値表示、POWERでも少年と確定SPIN値が残ることを確認した。厳密な同値の全ケース比較は以前の独立Visual証拠を参照し、今回の通常入力captureとは区別する。

元作業ツリーの182ファイル、git status、branch、HEADが開始時の保護snapshotと同じであることを照合した。[元作業保全](QA/INTEGRATION_ORIGINAL_PRESERVATION.json)。全体check・test・buildとCI・本番の確認は統合親担当が記録する。本追補時点では公開済みとは記載しない。

## 再現方法と残る限界

```sh
npm run build
npm run preview -- --port 5520
SHOE018_COMPILED_ORIGIN=http://127.0.0.1:5520 SHOE018_COMPILED_REPORT_DIR="$PWD/docs/game018/revision03/QA/integration-native/" node tests/game018/connected-native.mjs
```

ブラウザ実行はPlaywrightと `/usr/bin/chromium` が必要。collectorは通常時計・PC click／Space／Enterと390px touch相当で2回ずつ結果→リトライを確認する。QA相当で解析同意を拒否し、生の本番Analytics取得は行わない。

実機スマホ、音・FPS、人間による修正版の最終試遊、全フレーム動画のカメラ遷移評価は引き続き未確認。公開への追加承認をこれらの実施済み記録へ読み替えない。旧PC POWERの髪の部分遮蔽等の既知境界は当時の報告を維持する。
