# 14ゲーム移行 QA

2026-10-04。旧3作品のローカル移行検証は合格。現行11ゲーム＋14カードのポータルは最終24コンテキスト検証も合格。公開先の検証は公開後に追記する。人間によるプレイ評価、実機のFPS、全ステージ攻略の確認は含まない。

## 現在の証拠

| 検証 | 実行結果 |
|---|---|
| 旧3作品、PCキー／844×390のネイティブタッチ | 6個別ケース合格 |
| 14カードの表示・14経路の起動／再読込／ポータル復帰、PC／横向きモバイル | 4個別ケース合格 |
| 旧3作品のルート／`/repo/`直アクセス・WASM/PCK読み込み・再読込／復帰 | 3個別ケース合格、6マウント観測 |
| 上記合計 | 13個別ケース合格、同一配送検証のモバイルプロジェクト重複3件は明示的にスキップ |
| 原本ファイル照合 | 3作品・42ランタイムファイル・141,422,287バイト一致、問題0 |
| 公開中の原本との照合 | HTML・エンジンJS・PCKの9応答はHTTP200かつ元ファイルと一致 |

**一度の全ケース無失敗実行ではない。** 初回は9合格・4失敗・重複3スキップ。修正はテスト専用で、ゲーム本体／原HTML／Godot設定／WASM／PCKには変更を加えていない。最終の合格は下記の保持したケースと対象再実行を集計している。

- [初回失敗一覧](INITIAL_MIGRATION_FAILURES.json)、[初回ログ](NATIVE_MIGRATION_INITIAL.log)。生の失敗trace/screenshotはgitignore済みの`artifacts/fourteen-game-migration-initial/`に保持。
- [第1対象再実行](NATIVE_MIGRATION_RETARGET.log)：横取りのPC・タッチ2件と指ハートのタッチ1件が合格。
- [第2対象再実行](NATIVE_MIGRATION_RETARGET2.log)：立花と指ハートのPC・タッチ4件が合格（2.5分）。
- 14カード／全経路4件と配送3件は初回の実際の合格を保持。カード列数は実測PC1440px=4列、モバイル844px=2列。テストの期待値はデバイス名ではなく実際の画面幅を用いる。

## 操作と確認範囲

横取りデイズは通常URLでEnter／タップによる開始、仕事中の誤入力による実際のゲームオーバー、再挑戦、再読込、ポータル復帰を確認。状態を書き換えるフックは使っていない。狭い横向き画面では元のGodot結果画面の大きな英語見出しが画面外になるため、実際に見える原本のEnter再挑戦表示と結果・再挑戦画像を使う。初回の英語OCR不一致はUI変更ではなくデスクトップ見出しを前提とした観測の誤り。得点を獲得する長時間攻略やハイスコア更新は未確認。

立花タスクヘブンは実際の4リズム入力を通じて練習を完了（最終PC220点／タッチ280点、どちらもミス0）。続くステージ1でポーズと音楽時計の停止、通常の誤入力によるミス15以上の失敗、再挑戦、練習完了の保存と再読込後のステージ1開始を確認。原本の読み取り専用`TaskHeavenStatus`と`TaskAudio.clock()`を観測し、通常のキー1–4／実際の画面タッチだけで進めた。

指ハートチャレンジは通常URLに診断フックがないことを確認後、原本に既存の`?qa=1`読み取り専用観測を使用。ハート停止で成功1、次の誤った形で自然なFailure、実際の再挑戦ボタンで0に戻ること、再読込、通常URLへの復帰とポータル復帰を確認。原本フックによるモデル・時刻・得点の注入はない。

すべての最終ネイティブケースでHTTP／console／page errorは0。[実際の入力・結果JSON](tachibana-desktop-native.json)と[タッチJSON](tachibana-mobile-native.json)、[指ハートPC](finger-desktop-native.json)／[タッチ](finger-mobile-native.json)、[横取りPC](yokodori-desktop-native.json)／[タッチ](yokodori-mobile-native.json)を保持。[保存画像](screenshots/)は通常入力で得た実画面でありDOM結果fixtureではない。

## テスト失敗の原因と保持した境界

1. 立花の初回4／6ミス：入力判定の直前に毎回フォーカス／座標RPCを挟み、音楽時計が進む間に入力が遅れた。フォーカスと座標は前もって取得し、読み取り専用RAFの時計待ちの後は即ネイティブ入力するよう修正。[独立の入力観測](TACHIBANA_NATIVE_INPUT_DIAGNOSTIC.log)では実際のcanvasキーイベントと4 GOOD／280点・ミス0を記録。
2. 指ハートPCの待機失敗：短い判定時間の後に別のSpaceが届いて自然なFailureになったのにRUNNINGを待っていた。最初のハート入力でも判定後のフォーカス操作が形の切替を跨いだケースを保持。タイミング待ちの前にフォーカス／座標を済ませて、実際の判定中の入力と次の通常入力を分離した。ゲームのタイマーや入力ガードは変更していない。
3. 第1再実行の立花はゲーム操作の全検証を通過した後、ポータルに戻って破棄済みの子iframeから証拠を取得して失敗した。入力記録を遷移前に保存するようテストを修正し、最終再実行で合格。
4. 原本公開URLの横取りはルートから`build/web/`へリダイレクトされる。最初のルートJS/PCK404は採取経路の誤りとして[保持](INITIAL_OLD_PUBLIC_SOURCE_PATH_AUDIT.json)。実際の公開先から取り直した[9ファイル照合](OLD_PUBLIC_SOURCE_AUDIT.json)は一致。

## 原本保護と配送

[42ファイル照合](LEGACY_BINARY_AUDIT.json)は元の`index.html`を`game.html`へ名前変更しただけで内容まで一致することを確認。GodotJS/WASM/PCK/worklet/audio/iconを含む。元の`.import`、`.gdignore`、`.nojekyll`は実行に使わないエディタ／旧ホスティングメタデータとして除外理由を一覧化し、ランタイム除外に混ぜていない。新しい外側のナビゲーションだけが別ファイルで、52pxの帯と44px以上の復帰操作を実際に確認。

Godotの38,034,280バイトWASMは原本を保持した結果であり軽量ゲームの新規依存追加ではない。現行11ゲーム用の300KB／2MB JS上限は維持し、旧Godot配送は原本ファイル照合と実際のWASM/PCK MIME・HTTP検証で別に記録する。公開可能性は最終公開先検証の完了前には主張しない。

## 再現コマンド

```sh
node tests/fourteen-game/audit-legacy-migration.mjs
FOURTEEN_ARCADE_URL=http://127.0.0.1:4193/ npx playwright test --config tests/fourteen-game/migration.playwright.config.ts
FOURTEEN_ARCADE_URL=http://127.0.0.1:4193/ npx playwright test --config tests/fourteen-game/migration.playwright.config.ts legacy-migration.spec.ts --grep 'Tachibana keyboard|Finger Heart'
ELEVEN_STATIC_URLS=http://127.0.0.1:4193/,http://127.0.0.1:4194/repo/ ELEVEN_STATIC_REPORT=docs/fourteen-game/QA/PRODUCTION_MODERN_ROOT_SUBPATH_AUDIT.json node tests/eleven-game/probe-production.mjs
```

現行ソースは親エージェントの251ファイルfingerprint `18c59d…`で凍結。既存の19モデルファイルの保護、Game011境界の独立PC・タッチ結果、155単体テスト、最終12HTMLビルドは親／実装／独立レビューの記録を参照する。このレポートのQA実行数にそれらを重複加算していない。

## Rootによる指ハート再確認

QAの第2対象再実行後、Rootが同じ4件を重複実行し、立花PC/タッチと指ハートタッチは合格。指ハートPCでは0.8秒の判定演出後に2度目の別Spaceが届いて自然なFailureとなり、RUNNING待機が失敗しました。これは操作遅延を判定中入力と誤認したテスト条件です。移行の成功・自然な失敗・リトライ検証には不要な追加Spaceを取り除き、PC指ハート単独を再実行して成功しました（22.5秒、全体23.5秒）。ランタイムは変更していません。[成功ログ](ROOT_FINGER_FINAL.log)、[実入力JSON](finger-root-final-native.json)、[重複実行ログ](ROOT_REDUNDANT_RECHECK.log)を保持。判定演出中の二重入力耐性をこの最後のケースで確認したとは主張しません。Rootの重複実行が同じretarget2 artifact出力先を使ったため、以前の第2対象再実行の生artifactは上書きされました。QAが保持したportable JSON・画像とログは残っています。

新14本版の[素材監査](ASSET_AUDIT.json)は92 WebP、[ゲームモデル保護](GAMEPLAY_AUDIT.json)は19ファイル一致です。11本版の元監査は履歴として保持しています。

Root実行の[現行11本＋ポータルのroot/subpath配信監査](MODERN_ROOT_SUBPATH_AUDIT.json)は24 fresh contexts成功。HTTP/画像/ローカルフォント、prod診断フックなし、保存CREDIT0で起動・ポーズ・再読み込み・14カードへの復帰を確認。既存のJS容量上限を維持しています。[実行ログ](MODERN_ROOT_SUBPATH.log)。
