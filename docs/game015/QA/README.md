# Game015 QA — PASS

「落下キング ～FALL KING～」の最終候補を2026-10-04に検証した。QA担当の通常入力6ケース、静的配信の画面・操作10ケース、Root担当の全modern経路26ケースが成功。すべてのブラウザを閉じた。実機性能、人間による面白さ・長期的な再プレイ意欲は未評価。

最終候補は[SOURCE_FREEZE.json](./SOURCE_FREEZE.json)の265ファイル、SHA256 `f91e2a4137a2ad0057d020ba4f4ad3e148c6dbfcf294d28220560212a280e411`。ヘッダーの入力修正、インラインfavicon、FALL数値の拡大を含む。最終ネイティブ・静的検証はこの候補で実行した。Rootの[既存作品保存監査](./EXISTING_GAME_PRESERVATION.json)は公開済み14作品の実装・旧静的exportなど127ファイル一致。共通練習への015追加とフォント更新は、単体・通常入力・全modern配信で別途確認した。

## 実行結果

| 検証 | 実行結果 | 証拠 |
| --- | --- | --- |
| 全単体／型検査／ビルド | 175テスト／20ファイル成功、TypeScriptと静的ビルド成功。Root実行 | [検証記録](./UNIT_BUILD_CHECKPOINT.md) |
| 独立モデル経路 | 3seedで各5000mを通過。1000m通知各1回、最大保持足場24個、終了なし | [公開入力によるルート記録](./INDEPENDENT_MODEL_ROUTE.json) |
| 独立した練習モデル | 4段階完了。安全着地5.0／5.3125／5.2m、ゴースト11.875m | [公開入力による練習記録](./PRACTICE_PUBLIC_INPUT_REVIEW.json) |
| 通常入力のブラウザ | 5画面サイズ＋保存不能1ケース、6/6成功、16:10:12 UTC完了 | [NATIVE_PROBE.json](./NATIVE_PROBE.json) |
| 最終静的配信の画面・操作 | 5画面サイズ×ルート／サブパス、10/10成功、16:11:20 UTC完了 | [PRODUCTION_GEOMETRY.json](./PRODUCTION_GEOMETRY.json) |
| 全modern初回配信 | ポータル＋001–011＋015の13経路×2マウント、26/26成功。Root実行、16:13:30 UTC完了 | [応答・バイト記録](./PRODUCTION_ROOT_SUBPATH_AUDIT.json) |

単体の閾値・支持・生成12件はGameplay担当が実行した。QA独立ルートは`setHorizontal`／`drop`／`step`だけでseed 1／7／42を走り、通常・崩れる・動く足場への着地を観測した。保持足場は最大24／24／23個。幾何学的な候補を生成できることと、慣性を含む実際の運動で通過できることを分けた。これは高速シミュレーションであり、QAブラウザで5000mを遊んだ証拠ではない。独立Feel担当の実ブラウザ1000m通過・HARD／NICEは[Game Feel Review](../GAME_FEEL_REVIEW.md)、別担当の数値付きVisual84は[Visual Review](../VISUAL_REVIEW.md)を参照。

## 通常入力で確認したこと

すべての5サイズで、初訪問の説明→実際の4段階練習→明示的な本番開始を完了。練習中に本番時計・得点・BEST・保存CREDIT・run_start/run_end/scoreが変わらず、本番開始だけが1回記録された。横移動練習では右を押して加速し、離した後も流れて安全着地した。

本番では実DROP、空中での加速・離した後の慣性・反対入力の減速、空中ポーズによる物理／カメラ／足場時計の完全停止、再開直後の最初の入力を確認。PCでは同じヘッダーのPAUSE→RESUME後の左右とS、ミュート後のD／下矢印が届き、Sの押しっぱなし・repeatで次のDROPが予約されなかった。フォーカスされたミュート上のSpaceは音だけを切り替えた。

390／320／844幅の3コンテキストではChromiumの実タッチ入力を使った。右の一次接触を保持し、第二接触でDROPし、DROP側だけを離しても`horizontal=1`を維持。最後の左右接触を離すと0になった。pointerdown/upの指IDと対象はJSONに記録した。CDPのtouchEndは「離す接触」を指定し、残る接触の一覧とは混同していない。

各実プレイを自然な長い着地で終了し、FATAL・実落下距離・理由・得点・run_endが1回であることを確認。保存CREDITが0でも減算・広告イベントはない。リトライで深度／NICEがリセットし、BESTとミュートが再読込後も残り、完了済み練習は即PLAY、ポータルへ戻ると15カードを表示した。

| ブラウザviewport | 実結果深度 | 死亡時の実落下距離 | 本番CanvasのCSS高さ |
| --- | ---: | ---: | ---: |
| 1920×1080 | 32m | 17.2m | 927px（画面高の85.83%） |
| 1440×900 | 32m | 17.2m | 747px（83.00%） |
| 390×844 | 15m | 12.0m | 626.5px |
| 320×568 | 15m | 12.0m | 387px |
| 844×390 | 15m | 12.0m | 304px |

別コンテキストではlocalStorageの取得をSecurityErrorで拒否する環境を再現した。実練習・自然死亡・リトライが遊べ、セッション内のBESTはメモリで保持された。再読込では永続保存できないため説明から再開する。これは保存拒否のテスト用再現であり、物理端末の設定を検証したものではない。

## 画面・静的配信

主要操作44px以上、viewportとoverflowで切る祖先の内側に操作全体が収まることを測定した。タイトルは静的配信で、本番・ポーズはDEVと静的配信で、練習・結果は実際に到達したDEV状態で確認。Canvasは内部256×448、CSS `pixelated`、ライブCanvasは1個、本番の診断hookは公開ビルドにない。ルート`4193/`とサブパス`4194/repo/`の両方で保存完了状態の本番開始・ポーズ・タイトル・再読込・15カードへの復帰を確認した。静的テストの練習完了保存値は明示したfixtureであり、実練習の証拠は上記6件にある。

寸法判定は既存の**1px丸め許容**を使用し、数学的な文書高一致とは区別した。本番documentHeightは1920で1081/1080px、1440で901/900px、320で569/568px。操作は必要な44pxを確保し、切られる操作はなかった。390／844はviewport高と一致し、5サイズのポーズ・結果も一致した。許容を超えるはみ出しを合格扱いしていない。

Rootの初回配信記録は、各経路の新しいcontextで実HTTP応答をURLごとに1回計数した。015は両マウントで次の同一値。JS300,000 bytesの既存上限内、Phaserなし、ローカルフォントloaded、HTTP／requestfailed／console／page errorは0、診断hookなし。CanvasのピクセルアートはJS内の著作グリッドで、外部画像応答0を「アートがない」とは解釈しない。旧Godot3本の巨大WASM再ロードは行わず、保存監査と前回の実ブラウザ証拠を維持した。

| 015の初回リソース | 一意URL数 | 実応答body／decoded | encoded | transfer |
| --- | ---: | ---: | ---: | ---: |
| JS | 3 | 71,223 B | 25,445 B | 26,345 B |
| 外部画像 | 0 | 0 B | 0 B | 0 B |
| ローカルフォント | 1 | 157,320 B | 157,320 B | 157,620 B |

## 発見・修正と残した初回失敗

- 初期の横移動練習は最大右入力でも足場に届かなかった。[初回P1証拠](./INITIAL_PRACTICE_REACHABILITY.json)を保持し、練習専用の目標位置と本番同様の運動定数に修正後、公開入力と最終6ブラウザケースで確認。本番の物理変更とは区別した。
- 独立Feel担当のヘッダー再開後フォーカスP1を修正。最終PCでは最初の左右／S／下矢印を通常キー入力で再確認し、Spaceのネイティブ操作も保護した。
- 最初の1920ブラウザ試行は機能アサーションを通過したが、全体は`/favicon.ico`自動取得404でFAIL。[初回全体記録](./INITIAL_NATIVE_404_REPORT.json)、[URL特定](./INITIAL_GAME015_404_DIAGNOSTIC.json)、[当時の実結果画像](./INITIAL_NATIVE_404_1920_RESULT.png)を保存。RootのインラインfaviconとHUD可読性修正後に5サイズを新しく通した。初回は合格件数に加算しない。
- 初期CDP二本指の誤ったtouchEnd指定はハーネス問題として区別した。ゲーム側の入力修正でごまかさず、最終の実pointer ID記録で確認した。

## 再現コマンド

```sh
GAME015_MODEL_DEPTH=5000 node tests/game015/review-model.mjs
node tests/game015/review-practice.mjs
GAME015_URL=http://127.0.0.1:5181/ node tests/game015/probe.mjs
GAME015_STATIC_URLS=http://127.0.0.1:4193/,http://127.0.0.1:4194/repo/ node tests/game015/probe-production-geometry.mjs
ELEVEN_STATIC_URLS=http://127.0.0.1:4193/,http://127.0.0.1:4194/repo/ ELEVEN_STATIC_GAME_NUMBERS=0,1,2,3,4,5,6,7,8,9,10,11,15 ELEVEN_EXPECTED_CATALOG_COUNT=15 ELEVEN_STATIC_REPORT=docs/game015/QA/PRODUCTION_ROOT_SUBPATH_AUDIT.json node tests/eleven-game/probe-production.mjs
```

ローカルの実行ログは`/workspace/game015-native-final.log`、`/workspace/game015-production-geometry.log`。持ち出せるJSONと実結果5画像は本ディレクトリに保存した。物理スマートフォン、音を聴いての評価、実機FPS、長時間の端末発熱、面白さ・リトライ意欲は[人間プレイテスト](../HUMAN_PLAYTEST.md)で確認する。
