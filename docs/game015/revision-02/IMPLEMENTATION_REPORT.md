# 落下キング改訂02／3本改名／018公開 — 実装報告

2026-10-05 日本時間。添付引き継ぎMarkdownを読み、最新origin/main1ab4fcfと018候補482e458を再fetch。正式HTTPS接続200、Pages独自ドメインgame100garage.comとHTTPS強制をAPIで確認。候補を土台に今回の修正を統合し、018固有ソースは不変。018を作り直していない。

## 変更

- 012〜014は[改名報告](../../legacy-games/title-revision/IMPLEMENTATION_REPORT.md)のとおり、Godotの圧縮script・project名・HTML・カタログ・必要な実playサムネイルまで新名に変更。ID／route／保存ファイル維持。旧名ゼロをユーザー向け配信範囲で確認、歴史文書は証拠として保持。
- 015は[仕様](IMPLEMENTATION_SPEC.md)のとおり、6種の中央／左右ランダム配置と安全な着地点、中央トゲ、下降追走、上端死亡、8状態の王様、タイトル・実練習・実playサムネイル。強制ルートに待ち続ける必要のある鳥を出さない。
- fontは旧1049字を全保持して1057字へ。フォント作成スクリプトも既存glyph維持を明示。OFL保持。広告・CREDIT・DNS・Jev本番接続を変更しない。今回Jev API呼出し0。

## 実施済み検証

`npm run check`／`npm test`全単体／`npm run build` PASS。既存共有Phaser chunkの500kB警告は継続。015モデル22、練習8、共通練習24の独立再検証54PASS。[独立コードレビュー](QA/CODE_REVIEW.md)でP1/P2なし、20Hzの通常操作simulation32seed各500m生存。実装テスト64seed各350m、既存5000m長距離も通過。

[Native4profile](QA/native-final/report.json)：1440×900／390×844／320×568／844×390の初回説明→DROP→右避け→左避け→待機ゴースト→本番→pause→放置死亡→retry→45m→音保存reload→18card帰還、page/console error0。readonly観測、native mouse/keyboard/touch入力、位置／時間／得点のruntime書換えなし。練習は本番time/score/eventsへ影響なし。

初回probeは死因文章を「天井|遅」とだけ許した検証側assertionで失敗。実際の「スクロールに置いていかれました」は正しい表示、assertionを対応し再検証。原本QA/nativeとnative-retest01を保持。その後HUDが天井の針を隠す視認問題を修正し、native-final4設定を再実行。

古いreview-practice scriptの練習前提も独立レビューP3として検出、左右入力／scroll死亡へ更新し`node tests/game015/review-practice.mjs` PASS、歴史QA上書きを避け改訂02へ出力。

[素材原本・crop/hash](QA/THUMBNAIL_CAPTURE.json)、[固定対象hash](QA/SOURCE_FREEZE.json)。実行した通常操作・simulation・画面レビューは人間の面白さ／実機親指／音／FPS評価ではない。人間確認は未実施。旧深度BESTを保持するが、今回ゲーム性変更のため旧記録と難度は同じではない。

## 独立Visual／Feel・production・公開

独立[Visual](VISUAL_REVIEW.md)：83/100、F13/H13 PASS。[Feel](GAME_FEEL_REVIEW.md)：PC1920とphone390で実練習、中央固定4mトゲ死亡、左右ルート85m生存、停止死亡、pause/retry、page/console error0。人間評価を代替しない。

配信ビルドの初回collectorはphoneで画面外のlazy-loading画像にdecodeだけを要求して待機。対象cardを画面へscrollしてから画像読込を確認する検証側修正を行い、原本production-finalと再検証production-retest01を分けて保持。製品コード変更なし。

[配信版015・portal](QA/production-retest01/report.json)：root／subpath×PC／phone4PASS、18card・新名・全対象thumb640×360・実練習→本番→scroll死亡→retry→保存→帰還、production診断hookなし、エラー0。

[配信版018](QA/018-PRODUCTION_ROOT_SUBPATH.json)：root／subpath×PC／phone4PASS。初回4練習→5靴選択→ANGLE/SPIN/POWER→実飛行→Result→Retry→保存→Portal、font読込、APIやPhaser追加なし。018固有ソースは候補と同じ。旧Godot3本の実keyboard/touch lifecycle6PASS・public/dist42file監査PASSは改名報告に記録。

[既存native配信回帰](QA/EXISTING_PRODUCTION.json)：001〜011・015・016のroot/subpath26経路、読込・font・音保存reload・CREDIT OFF・Portal帰還PASS。これは全ゲームの楽しさ評価ではない。

公開直前の正式018URLはHTTP404。GitHub Pagesへの反映と公開URLの再検証結果を追記する。


## 公開結果（2026-10-05 日本時間）

Runtime release commit **803a88423a6024923e7061fbd9436e6c4d405ede** をorigin/mainへfast-forward push。直前再fetchでmain1ab4fcfが候補祖先であることを確認し、forceなし。

GitHub Pages [run37315859362](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37315859362)：build／deployともsuccess。CI npm ci／npm test／build各step successをAPIで確認。[API原本](QA/PAGES_DEPLOYMENT.json)。raw logsのdownload先results-receiver.actions.githubusercontent.comはこの環境の許可範囲外で取得できず、全文logを取得したとは記録しない。

正式[game100garage.com](https://game100garage.com/)に18本を配信。[公開015／portal PC・phone](QA/public/report.json)2PASS、初回実練習→本番→pause→scroll死亡→retry→音保存reload→帰還まで操作し、PC61／phone46件の読込resourceがlocal release buildとSHA256一致。旧タイトルなし、新3名称・新thumb・production診断hookなし・page/console error0。

[公開asset照合](QA/PUBLIC_ASSET_HASHES.json)：旧3GodotのHTML／gameHTML／PCK、新thumb012/014/015/018、font、015/018HTMLの16対象HTTP200・build SHA256一致。公開018HTMLは公開前404から200へ。配信されたPCKはタイトル改訂・元resource保持監査を通した同一成果。

[018公開PC／phone](../../game018/publication-qa/release-803a884/GAME018_PUBLIC.json)2PASS：Portal card→direct reload→4実練習→5靴→ANGLE/SPIN/POWER→飛行→Result→Retry→音／BEST reload→Portal再起動。HTTP／console／font・script・thumb問題0、CREDIT OFF、Jev API呼出しなし。[018読込resourceのbuild照合](../../game018/publication-qa/release-803a884/BUILD_HASH_MATCH.json)も全一致。

公開済み。人間の面白さ・実機操作／音／FPSは未評価で、今回の通常入力・Visual／Feel判定と分けて残す。DNS／独自ドメイン／広告は変更していない。公開後の記録commitは文書・QAのみで、runtime release803a884と区別する。
