# 負けじゃんけん ～LOSE TO WIN～ 実装・検証

Game016を16本目として統合し、GitHub Pagesへ試作版を公開した。現在は無制限で遊べる試作版で、人間の面白さ・実機操作の評価は未実施。

## 遊びと実装

実際に相手へ負ける手だけが正解。勝つ・あいこ・時間切れは1ミスで終了する。左グー、中央チョキ、右パーは練習・全4段階で固定。PCは←/A、↓/S/Space、→/D、クリック、スマートフォンは3つの大きいボタンで遊ぶ。

1〜10問は生成イラスト、11〜20問はひらがな、21〜30問は文章、31問以後は常に0.8秒のENDLESS。初期30問の回答は2秒。文章は時間制限なしで読んで、次へ進む操作を離してから回答可能になる。読了操作の流用、長押しの繰り返し、古いタップの持ち越しを拒否する。

文章は明示的な相手の手と意味データを持つ30問、各手10問。RUNごとに重複なし10問を選ぶ。自然言語解析はせず、機械による一意性確認と独立した日本語の読解を分けた。初期案の答えを直接書く文を修正した。

正解点は100/150/250/300。30問完了で5,000点。Reflexだけ300ms以内+200、500ms以内+100、以後+0。通常じゃんけんの勝敗をUIで逆表示する実装ではない。ポーズは読書・回答・演出の時計を凍結し、非表示時も停止する。遅れたフレームで回答時間を伸ばさない。

初回の説明→無制限3問練習→本番、後日の「すぐ遊ぶ／練習する」、3種類の終了理由、SCORE・連敗・到達Phase・REFLEX STREAK・BEST・称号・コメント、端末内BEST・音・練習完了保存を実装。練習はRUN・得点・CREDITから独立する。

現在のFeature FlagではCREDITも広告も使わない。再有効化時はGame016の固有walletがRUN開始時に一度だけ消費する。質問・終了・練習では消費しない。補充は既存広告境界の開発用Stub。他ゲームの終了時消費を変更していない。Telemetryは要求されたphase/round/opponent/player/lose/win/draw/timeout/latency/reflexを取得し、終了時に累計応答時間・件数を残す。現在はconsoleと200件のメモリ履歴で、実ユーザー統計やオンラインランキングではない。

## 見た目とレビュー

明るいテレビ番組風のTV枠・物理的な3択・大きい手で、015の暗いピクセルアートと区別した。[Visual Brief](VISUAL_BRIEF.md)から実ImageGen1回で3つの手を生成し、原本・prompt・採用・由来を保存した。各256×256透明WebP、合計29,614 bytes。48pxとグレースケールでも形を区別できる。[生成記録](IMAGEGEN_LOG.md)。

独立Visualでメニューの白文字が明るいボタンに埋もれる不具合を発見した。TV内のボタン文字を濃紺にする限定CSS修正を入れ、PC・phoneの実際のタイトル／練習／文章／段階移行／結果を再撮影して確認した。修正前の画像・記録・CSSは[履歴](review-history/before-menu-contrast/)へ保持した。

独立Game FeelはPC1440×900／phone390×844で初回練習から各35問を通常入力し、30問5,000点→Reflex5問7,500点まで到達した。無制限読書、解放ガード、800ms、固定3択、正のLOSE演出、3種類の自然な失敗、ポーズ、31〜50msの再挑戦、BEST再読込、一覧復帰を確認。[Game Feel](GAME_FEEL_REVIEW.md)。答えを読み取る自動操作であり、人間の認知的混乱・面白さを証明したとは扱わない。

独立Visualは **86/100、F13/H13、合格**。[Visual Review](VISUAL_REVIEW.md)。サムネイルは実際のPC本番画面を比率維持で縮小した12,804 bytesのWebPで、架空の豪華な別画面を生成していない。最終コード変更はメニュー文字色だけで、この本番画面の手・配置は同じ。[サムネイル由来](../../assets/portal/thumbnails/asset-index.json)。phoneの一部見出し／一覧復帰ラベルの折返しは小さな品質上限として記録した。

## 技術検証

- `npm ci`、23ファイル196単体テスト（既存181＋新作15）、TypeScript、Viteビルド成功。9勝敗組合せ、文章・重複なし選択、絶対期限・ポーズ・加点・開始時CREDIT・練習を検証。[コマンド記録](QA/VALIDATION_SUMMARY.json)。
- 独立QAの **7/7実操作ケース**：1440×900／390×844／320×568／844×390で各33問を実回答して全段階・3種類の自然な終了、キー／タッチの古い入力ガード、保存拒否。44px、クリップ祖先、実ボタン文字コントラストを確認。[実操作JSON](QA/NATIVE_PROBE.json)、[QA報告](QA/QA_REPORT.md)。
- **4/4公開用ビルドケース**：ルート／`/repo/`のPC・タッチ相当でPortal16→初回3問練習→本番→正解→ポーズ→再読込→すぐPLAY→一覧復帰。HTTP／consoleエラー、診断hook、Phaserなし。[本番ビルドJSON](QA/PRODUCTION_PROBE.json)。
- **28/28共有配信経路**：ポータル＋001〜011＋015＋016をルート／サブパスで初回ロード・PLAY・ポーズ・再読込・一覧復帰。[回帰配信](QA/PRODUCTION_ROOT_SUBPATH_AUDIT.json)。旧Godot3本の重い実プレイを今回再実行したとは扱わない。
- 既存15ゲームの253ソース／HTML／画像／旧作品出力と共有練習・サービスが基準コミットと一致し、最初の15サムネイル記録も同じ。[保持監査](QA/EXISTING_GAME_PRESERVATION.json)。共有変更はカタログ16件・ビルド入力・Telemetry型・fontの追加文字。
- 97WebPのhash・寸法・alpha・原本・dist一致を確認、旧56画像保持。全15のfont対応1011文字を失わず1020文字へ拡張。[画像監査](QA/ASSET_AUDIT.json)、[フォント監査](QA/FONT_AUDIT.json)。新作の初回JS合計33,189 bytes、画像29,614 bytes、font159,448 bytes。新作専用JS28.79kB／gzip10.17kB、Phaser未使用。既存共有Phaserの500kB警告は継続する。

テスト側の2つの初回失敗（浮動小数の2000ms差分比較、遷移前に終わらないHTTP200画像body収集）も保存し、runtime不具合と区別した。時刻差の微小な数値誤差だけを許容し、ゲームの絶対期限に猶予を追加していない。収集処理を修正して7／4ケースを再実行した。

最終[280ファイル凍結](SOURCE_FREEZE.json)の集約SHA-256は `6d4a80a454a809537673cd01bf71e8c28f12763b6e5259048c44a547bf9b385a`。独立レビュー後の全コード・公開画像・fontが同じことを再ハッシュで確認する。

## GitHub Pages公開確認

[負けじゃんけんを遊ぶ](https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/game016.html)／[16ゲームの一覧](https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/)。runtimeコミットは `c58079cd7cfd0b54f89b6b3710ac73ddb3a4a897`。レビュー対象とGit treeの一致を確認してmainへ反映した。

[公開run37255472509](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37255472509)で196単体テスト・TypeScript・ビルド・Pages公開が成功した。[Actions記録](QA/PUBLIC_ACTIONS_RUN.json)／[コマンド抜粋](QA/PUBLIC_ACTIONS_EXCERPT.log)。

公開URLでPortal＋001〜011＋015＋016の14ページを実ブラウザ確認した。全件HTTP／consoleエラーなし、16件Catalog、直接起動・PLAY・ポーズ・再読込・一覧復帰が成功し、production診断hookなし。Game016は実配信でJS33,189 bytes、手画像29,614 bytes、font159,448 bytes、Phaserなし。[公開14ページの記録](QA/PUBLIC_AUDIT.json)。今回の公開検証で旧Godot3本を再実プレイしたとは扱わない。

indexとgame016 HTML、その参照JS/CSS、3手画像、016サムネイル、fontの計15配信ファイルをローカルdistとbyte単位で照合し、すべて一致した。[配信ファイル照合](QA/PUBLIC_FILE_MATCH.json)。公開確認後の追加コミットは検証記録だけでruntimeは変わらない。

## 人間プレイテスト

[A〜Oフォーム](HUMAN_PLAYTEST.md)は未実施。特に普通の勝つ癖が出るか、形式変化が面白いか、文章のテンポ、0.8秒が「あと少し」か、1ミスが笑いと再挑戦につながるかを確認する。実機タッチ・FPS・音の体感も別途評価する。
