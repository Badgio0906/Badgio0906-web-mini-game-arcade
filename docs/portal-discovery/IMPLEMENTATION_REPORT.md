# Portal discovery 実装・検証報告

2026-10-10 JST。対象は100ガレ ～GAME100 GARAGE～のポータル。タグOR／AND、開発状態、ブラウザのお気に入り優先表示を追加した。仕様は[PORTAL_DISCOVERY](../PORTAL_DISCOVERY.md)、作者判断と実画像・境界の独立レビューは[INDEPENDENT_REVIEW](INDEPENDENT_REVIEW.md)。この報告の公開欄は公式Pages公開後に実測へ更新する。

## Git安全確認と変更範囲

開始時status空、branch `codex/portal-play-navigation`、HEAD／fetch後origin/mainとも`2eb7b3cb09e43ada47cf44aad701809f283cdde0`。新branch `codex/portal-discovery`で実装した。破壊的reset／clean／force操作なし。再fetchでもmainが同じことを確認した。

| 変更ファイル | 内容 |
|---|---|
| `src/data/gameCatalog.ts` | 開発状態と表示名、状態とタグを独立に判定する純粋関数。filterCatalog省略時ANDを維持 |
| `src/portal/discovery.ts` | activeタグ候補と件数、favorite純粋sort、safe storage復元／保存 |
| `src/portal/DiscoveryControls.ts` | 状態・OR／AND・候補・解除chip・clearの操作 |
| `src/portal/main.ts` | status/favorite metadata、既存card Map、hidden／node再配置、visible position、observer再接続 |
| `src/portal/style.css` | 既存cream/yellow/coral/inkのUI、44px操作、折畳み、PC条件横並び |
| `index.html` | 絞り込み欄・結果数・empty、グローバル試作版を中立表現へ |
| `jev_export/game_profiles/catalog.json` | 現行カタログ書き出しに開発状態だけ同期 |
| `GAME_COMMON_SPEC.md`・`docs/PORTAL_DISCOVERY.md` | 完成判断の本人限定運用、機能仕様、再現手順 |
| `tests/unit/portal-discovery.test.ts`・`tests/portal-discovery/browser.mjs` | 純粋境界と実ブラウザ操作 |
| `docs/CURRENT_STATUS.md`・本報告／QA／独立レビュー | 現行状況と初回／最終証拠 |

[SCOPE_AUDIT](QA/SCOPE_AUDIT.json)は許可した6つのPortal/catalog runtimeファイル以外の523ソースファイルを開始mainとbyte比較した。各gameNNN HTML、001・015・019・031等ゲーム本体、Godot runtime/wrapper、core、records、analytics source、thumb/fontは不変。AdSense scriptも文字列完全一致。カタログ書き出しの新fieldを除くID／route／releaseOrder／タグ／010retiredは開始版と完全一致。Worker/D1、Actions/GA4設定、依存、CREDIT、Jev helper／個別profile／event schemaを変更していない。共有カタログのmetadata追加はビルド済みchunk hashへ伝播するが、ゲーム内容の改変ではない。

## 実装した動作

全30activeはtrial（試遊版）。退役010もdevelopmentStatusはtrialで、掲載状態retiredを維持する。作者の明示完成宣言は正本調査で確認できなかった。好評価・公開・CI・自動QAをcompleteへ読み替えていない。完成版の混在テストは合成unit fixtureだけで、実カタログの作者判定ではない。

使用中の通常39タグだけを表示し、件数を添えた。初期未選択／OR、ORはどれか、ANDはすべて。状態選択は独立OR、最終的に状態条件ANDタグ条件。何も／両方の状態選択は全状態。解除で全30、emptyは0/30と解除案内。タグ一覧はPCでもスマホでも初期閉じ、閉じても選択chipとOR／ANDを表示。最大4通常タグのカード表示と先頭の別status badgeを保持する。

favoriteは`game100garage:favorites:v1`にstable IDの配列を保存。登録／解除で対象一覧内をfavoriteグループ→その他グループ、両グループreleaseOrder昇順に再配置する。非favorite／最新031を消さず、件数も減らさない。再読込復元、壊れたJSON・未知／退役IDの無視、保存拒否時のページ内保持と通知、別タブ反映を扱う。アカウントやサーバー保存は追加しない。

カードは一度だけ生成し、Records／TOP10とlistenerは既存nodeに保持。favoriteは独立button、aria-label／aria-pressed、44px以上。button clickでcard launchを発火しない。再配置で失われるfocusを回復する。visible nodeにだけ1始まりpositionを設定し、hiddenから削除。既存impression observerをdispose／再接続し、visit内seen重複防止を保つ。

## 検証記録

- 新規pure unit32件を含むroot **919/919、80files PASS**。[UNIT_FINAL](QA/UNIT_FINAL.log)。タグOR/AND・active・混合開発状態・条件の組合せ・favoriteグループ順・未来nonfavorite・解除・壊れた／未知／拒否storage・復元を含む。
- 対象3file **41/41 PASS**。[TARGET_TESTS](QA/TARGET_TESTS.log)。型check／production build PASS。[CHECK_FINAL](QA/CHECK_FINAL.log)／[BUILD_FINAL](QA/BUILD_FINAL.log)。public common script/CSSのVite bundle注意と大きいchunk警告は開始版にもあった既存警告。common assetsは実配信照合で別確認する。
- offline Jev helper **25/25 PASS**。[JEV_OFFLINE](QA/JEV_OFFLINE.log)。runtimeへJevを接続せず、自動修正／公開Gateを有効化しない。
- 密度調整前のcompiledブラウザは **176項目 PASS**。[browser-observer-corrected](QA/browser-observer-corrected/REPORT.json)。1440×900・390×844・320×720、repository subpath320。click／tap／Enter、OR9／AND5、状態複合／empty／clear、favorite順／focus／復元／非favoriteと031保持、Records30／TOP10競争20、共有設定、consent設定、position／retained node／observer dedup、実001PLAY帰還・003card帰還、JSON/unknown/quotaの境界を含む。page/console error0、records等POST attempt0。analyticsの既存POSTはQA内で応答し、本番へ転送0。
- 最終密度調整後もcompiled **176/176 PASS**。[browser-final](QA/browser-final/REPORT.json)。独立追加 **32/32 PASS**。[independent-boundaries-accepted](QA/independent-boundaries-accepted/REPORT.json)。クロスタブ／clear反映、hidden favoriteとfilterの維持、全integration node identity、031 Space／Enter／Tab、chip focus、Storage getter／read拒否を実操作で確認した。最終1440／390／320画像は文字clip／重なり／横overflowなし、初期thumbnailの一部以上が見え、44px操作を保持。[独立最終Visual](QA/INDEPENDENT_VISUAL_FINAL.json)。公開結果は後述へ追記する。source固定は[SOURCE_FINAL_MANIFEST](QA/SOURCE_FINAL_MANIFEST.json)、compiled全330file固定は[BUILD_FINAL_MANIFEST](QA/BUILD_FINAL_MANIFEST.json)。元phaseのmanifest／画像を保持する。

### 初回failureと限定対応

失敗原本を保持し、合格へ書き換えなかった。

1. root初回917PASS／2FAIL：新developmentStatusがdeveloper exportに無い。[UNIT_INITIAL](QA/UNIT_INITIAL.log)。既存一致testを維持し、catalog書き出しの31fieldだけ同期して919PASS。個別gameprofileは不変。
2. standalone runnerのNode24 import解決失敗。[BROWSER_LAUNCH_INITIAL](QA/BROWSER_LAUNCH_INITIAL.log)。Vite／Vitestでは成立するextensionless importをrunnerで直接loadしていた。runnerを正本tagCatalog直接参照へ限定修正、製品未変更。
3. game025非競争なのにTOP10を待つprobeと、既存analyticsをabortするfixture。[browser-initial](QA/browser-initial/REPORT.json)。競争007へ対象変更し、analyticsをQAで204応答へ。その他POSTを遮断する方針は維持。
4. consent再grant後にfilterするprobeのimpression期待不一致。[browser-corrected](QA/browser-corrected/REPORT.json)。初回count詳細は欠測で事後再構築しない。deny中にfilter→grant→実露出へ操作順を変え、count/positionを記録。runtime observer不変で全4viewportのposition1／重複防止を実測した。
5. 独立画像でPC初期filter枠y214..830、320ではfirstmetadata端しか見えなかった。タグを全幅初期closedへ、legend inlineとOR／AND短文、PC状態／条件横並び、スマホneutral markはFREE PLAYへ限定し、最終画像でfirst thumbnail露出と操作領域を再確認した。
6. 独立追加probeの最初はfixtureのconsent初期化引数が渡らずunknown panelが入力を遮った。raw finding／初回画像を保持し、テスト限定補正と独立再実行の結果を別出力へ残す。

findingごとにJev Shadowを実際に8 findings各1 request／4問（8/8 AVAILABLE、全blind annotate済み）、回答を独立レビュアーへ隠して保存。[JEV_SHADOW](QA/JEV_SHADOW.jsonl)／[JEV_SUMMARY](QA/JEV_SUMMARY.json)。回答を公開判断に使わず、実調査・実画像・実操作で判断した。impression独立判断の追補fieldはhelper schema外なので、原本を保持したsupported-field copyでannotateした。APIを追加再送していない。Codex料金／tokenの実値は取得不可で推定しない。人間の完成判断は記録しない。独立consent fixture診断はraw共有後、Jev記録完了通知を受ける前に始まっていたため、その順序を[独立レビュー](INDEPENDENT_REVIEW.md)に明記した。Jev回答は全件非読で、回答に合わせて診断や履歴を変えていない。

## 公開

公開前段階。公式`Build and deploy arcade`でmainを公開し、成功run／commit、匿名public GETと実操作、配信file hashを確認して追記する。Workerのdeploy／D1 migrationは不要。

## 残る範囲

物理スマホ、ブラウザ終了・再起動の実機操作、人間の探しやすさ・誤押下率・楽しさ・完成判断は実測していない。永続localStorageは再読込と同一context内で復元を確認し、実ブラウザ終了後はブラウザ保存設定に依存する。100実作品は存在せず、未来nonfavoriteをpure fixtureで確認した。ゲーム本体は今回の範囲外なので全作品の全結果状態／音／保存playを再実行したとは報告しない。Chromeのviewport／touch emulationは実機評価とは別。広告はsource保持を確認し、AdSense審査や配信の成立を自動QAで判断しない。

## 最終ローカル画像

[PC初期](QA/browser-final/1440-initial.png)／[390px初期](QA/browser-final/390-initial.png)／[320px初期](QA/browser-final/320-initial.png)／[スマホ絞り込み](QA/browser-final/390-filtered.png)／[お気に入り](QA/browser-final/390-favorites.png)／[0件](QA/browser-final/390-empty.png)
