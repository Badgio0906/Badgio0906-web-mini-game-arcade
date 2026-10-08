# ポータル記録表示・共有 実装報告

対象依頼は [REQUEST](REQUEST.md)。開始基準は main `249748d7a3b5ee8c832857435bf28643436f2392`、専用worktree/branchで17既存worktreeを保全。読み取り証跡は [READ_RECORD](QA/READ_RECORD.json)、本番認証確認は [CLOUDFLARE_BLOCKER](QA/CLOUDFLARE_BLOCKER.json)。

## 実装範囲と保存互換

全active30カードにサムネイル直下のHTML記録2段と代表条件を追加。競争型17作品は個人/共有を同じboardで定義。非競争10作品は既存の盤面/対局/採掘などの進行記録を表示し全体比較なし。Godot旧3作品012–014は安全なブラウザ保存bridgeがないため技術未対応であり設計除外と区別する。[全作品表](GAME_RECORD_MATRIX.md)。

個人値0と欠測、旧版・破損・取得失敗、共有準備中・空・古いキャッシュを区別。pageshow、visibility、別タブstorage、同ページ更新で再読取する。各ゲームの結果へ任意共有通知だけを追加。元得点式/物理/難度/保存キー/URL/BEST互換は変更しない。015/019の旧版共用キーは導入後確定結果の別IndexedDB metadataで現行版を証明し、旧BESTを現行へ遡及昇格しない。031は元世界と同一transactionで軽量記録metadataを保存し、Portalは世界存在とmetadataだけを取得、seed/地形/世界生成を読み出さない。

024/029の保存RUNを再開するときは導入後に作った端末内資格だけを継続。旧RUNを新しい共有対象にしない。共有用run_result_idはTelemetry IDから独立。スコア値は基準整数、表示だけ単位scale変換。019通知は元BESTのfloor精度に合わせ、018は全靴条件で一貫する。

## 共有・運営・本番の状態

[API仕様](API_AND_VALIDATION.md)、[Privacy/保持](PRIVACY_AND_RETENTION.md)、[管理画面](ADMIN_GUIDE.md)、[運用手順](OPERATIONS.md)。自動共有初期OFF、手動共有には個別確認、Analytics同意とは独立。投稿待ちは最大50/24h/5回、4xx無限retryなし、429のRetry-AfterをCORSで公開して尊重。全POST前に最新permission epoch確認、OFFは待機を破棄。既受付はabortだけで取消にならず、ランダムreceiptによる撤回を利用。別タブreceipt/tombstoneと現行ルールmetadataの競合を限定修正した。

ローカルD1の加算migration/API/候補台帳/審査/取消/撤回/再計算を実装。本番Cloudflare認証は `You are not authenticated. Please run wrangler login.`、この環境では本番migration/Worker公開/記録フラグONを実行していない。新規login・Secret・権限は作らない。Frontend records endpoint未設定の安全状態で公開し、みんなのBESTは「準備中」、投稿/管理書込は無効。一般Analyticsの送信停止状態と広告/GA4/CREDIT設定は変更しない。本番記録受信は未観測、管理APIや共有機能の本番稼働済みとは報告しない。

## 検証と制約

[ROOT_CHECKS](QA/ROOT_CHECKS.json): root check、861単体/76file、Jev helperオフライン25件成功。Worker typecheck、recordsローカルD1 24項目、既存Analytics回帰37項目成功。browser/admin fixtureと実操作はQA配下の各一意出力・source hashで区別。架空投稿はローカル/HTTP mockだけ、本番POSTなし。元失敗画像・状態を残し、fixture設定誤りと製品問題を別に記録する。フォントは既存1075glyphを保持し今回31glyphだけ補完 [FONT_COVERAGE](QA/FONT_COVERAGE.json)。

最終ブラウザ集計は [browser-FINAL](QA/browser-FINAL.json)／[再現手順](QA/browser-REPRODUCE.md)。Portal4画面・30カード82項目、有効化mock26項目、共有transport49項目と実Consentキー追補13項目成功。7作品×PC/phoneの通常操作14ケース84項目成功（001/004/018のPCはnative-02の成功ケース、残りはnative-03。native-02全体をPASS扱いしない）。他の競争作品はソース監査・単体確認であり全17作品の実試遊とは報告しない。Game018は2RUN連続のクリック/Enter/Space/Retry、019はチャージ/一時停止/再開、024/029は保存RUN継続、031は8素材/掘削/保存/Portal軽量metadata/続きからを確認。実BFCacheはpersisted=falseで未確認、persisted=true handlerは合成試験のみ。失敗原本を保全し修正後の成功証跡と区別する。

独立source/実画像レビュー [FINAL_INDEPENDENT_QA_SOURCE04](QA/FINAL_INDEPENDENT_QA_SOURCE04.json) は最終source04/Backend hash一致、6画像Visual84/F13/H12で基準を満たした。本人の面白さ・実機触感は未確認。ソフトウェア上のQA結果を人間満足度と混同しない。

Jevは実findingごとのShadow routingにだけ使用。[実行監査](QA/JEV_EXECUTION_AUDIT.json) は16実API、16 HTTP200、全てresolved_model=typesafe/jev-1.13-20260917・有効4回答・独立判断を確認。dry runやmissing credentialsは0。回答閲覧前の独立判断を保全し [summary](QA/JEV_SUMMARY.json) に照合。原因分類14/16、次の証拠8/16一致、risk見逃し4件、追加作業不要と誤るCodex false passは0。全件findingで追加作業が必要な標本のため有効性や削減効果の一般化はしない。整数比較/SQL/HTTP/合否/公開許可を代行させない。

## 続きの作業

本番認証を使える既存環境でOPERATIONSのバックアップ/今回migration限定/Worker公開/管理境界/公開GET確認を行った後、限定records endpointを公式Pagesへ接続する。全体BESTの実データと実プレイヤー投稿受信は別途観測する。Global120新規/分はサービス量制限で、利用者ごとの公平性/完全な不正防止を保証しない。改ざんブラウザ/Origin偽装/値の捏造は検査と保留・取消の初期範囲。accepted候補と最小tombstoneは容量監視が必要。旧Godot bridge・実機・本人試遊は残作業。

## 本番Pages公開確認（2026-10-09 日本時間）

実装runtime commit `9b9d3f91ba38eca6aee5071705ee566dafba08c3` をmainへpushし、[公式Pages run37806261132](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37806261132) のbuild/deployが成功。[公開サイト](https://game100garage.com/) で個人表示を公開済み。共有バックエンドは本番未反映、「みんなのBEST」は準備中・共有OFF/無効の承認済み代替であり、完全な共有機能公開とは報告しない。

[配信版](QA/publication/version-03/VERSION.json) は対象SHAの公式workflow成功、clean対象ソースbuildと公開110件のHTML/JS/CSS/font bytes一致で確認。Actions run ZIP・job logsはアクセス拒否のため公式artifact ZIP/CI asset一覧の直接照合は未確認。失敗 [version-01](QA/publication/version-01/BLOCKER.json)、[version-02](QA/publication/version-02/FAILURE.json) と [限定原因/除外理由](QA/publication/VALIDATION_NOTES.json) を保持。参照buildの空文字と未設定による最適化差だけを訂正し、製品/公式workflowは変更しなかった。

[公開ブラウザ36項目](QA/publication/runtime-01/REPORT.json) は1300×900/390×844/320×720/844×390で30カードの2段直下表示・条件/例外・画像decode・リンク・AdSense保持・共有無効を確認。PCのEnter/phoneタップで実Game001へ進み通常結果の元BESTとPortalの値一致を確認。本番記録リクエスト0、Analytics POST0、page JS errors0。既存Ads通信の同型console errorは6回（確認ページ6回）、[追補](QA/publication/console-01/REPORT.json) でpagead2.googlesyndication.comのERR_TUNNEL_CONNECTION_FAILEDを確認。Ads script/configは維持し、広告配信自体は未確認。

代表実画像： [PC](QA/publication/runtime-01/portal-top-1300x900.png)／[390px](QA/publication/runtime-01/portal-top-390x844.png)／[320px](QA/publication/runtime-01/portal-top-320x720.png)／[横画面](QA/publication/runtime-01/portal-top-844x390.png)。全ページ画像と通常結果/BEST更新画像も同じ出力に保存。本人の面白さ、物理iPhone/Android、実BFCache、本番全体GET/実投稿は未確認。後続は上記OPERATIONSに従い既存認証が使える環境で進める。
