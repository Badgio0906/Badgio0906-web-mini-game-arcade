# PLAY優先・共通帰還の再開

最新の実装／公開結果は [IMPLEMENTATION_REPORT](IMPLEMENTATION_REPORT.md)、全30作品の変更表は [GAME_NAVIGATION_MATRIX](GAME_NAVIGATION_MATRIX.md)、独立判断は [INDEPENDENT_REVIEW](INDEPENDENT_REVIEW.md)。現在の会話・一時ログ・稼働serverに依存せず、このrepoの証拠から確認する。

## 共通部品

`public/arcade-navigation.css`／`.js`を各active HTMLのゲームentrypointより先に読み込む。通常headerは `.arcade-game-header`、ポータルanchorは `.arcade-portal-return`。物理HTMLを持たない001／003の生成箇所も参照。Godot wrapperは `tools/legacy-record-shells`とpublic側の双方を同期し、manifestのshell hashを更新する。runtimeFilesは変更しない。

pointer captureのfresh-gesture検証を遮断しない。開始gestureだけdocument bubbleで隔離し、releaseはheld-input cleanupへ渡す。native HTMLはviewport-fit=containを基本とし、safeなviewport内で既存高さ予算を使う。native modalの代理anchorは元anchorへclickを渡し、save／quit hookを通す。nonmodal menuを開いたときにheaderが負の画面座標なら、headerへ即時scroll復帰する（focusは変更しない）。nonmodal dialogには代理anchorを置かないため、長い説明がheaderを覆わないmenu寸法が必要。

## 再現コマンド

Node24、`npm ci`。`npm run dev -- --host 127.0.0.1`を起動し、新しい出力先を使う。browserは `/usr/bin/chromium`。browser群は順に実行し、software GPU負荷と単体runnerを重ねない。

```sh
npm run check
npm test
python3 -m unittest discover -s tests/jev -p 'test_*.py' -v
VITE_GA4_MEASUREMENT_ID='' VITE_TELEMETRY_ENDPOINT=https://analytics.game100garage.com/v1/events VITE_RECORDS_ENDPOINT=https://analytics.game100garage.com npm run build
NAV_QA_OUT=/tmp/navigation-layout node tests/navigation/layout.mjs
NAV_QA_OUT=/tmp/navigation-interactions node tests/navigation/interactions.mjs
NAV_QA_OUT=/tmp/navigation-portal node tests/navigation/portal.mjs
NAV_QA_OUT=/tmp/navigation-save031 node tests/navigation/save031.mjs
```

ranking probeはfixture endpoint専用build、legacy probeはcompiled preview8813を使う。各script冒頭の環境変数／REPORT provenanceを確認する。結果HTMLだけで実遷移成功としない。`NAV_IDS`／`NAV_WIDTHS`はinteractionsの限定再検証用。

公開確認は `RECORDS_EXPECTED_COMMIT=<40桁SHA> NAV_QA_OUT=<新出力先> node tests/navigation/public.mjs`。公式workflowのbuild／deployが同SHAでsuccess後、clean checkoutの同本番設定buildに対し `node tests/navigation/verify-public.mjs <SHA> <run番号> <新出力先>`を使う。前回の証拠に新runを上書きしない。公開GETは可能だが、架空スコア／参加資格／Analytics POSTを送らない。

## 人間確認と既存制約

物理スマホ、音の聴感、親指の誤タップ率、全作品の全終局完走は今回の自動QA結果から推測しない。001の320px練習buttonの下部clipは基準mainでも同量。旧Godot exportのsource checkoutがない環境では歴史migration監査を成功扱いせず、現manifestの実byte／template比較を使う。詳細と画像は報告に残した。

Worker／D1／migration／ゲームルール／得点／保存format／広告／GA4／CREDIT設定は今回変更していない。初回の失敗REPORT・timeoutログ・Jev原annotationも保持する。
