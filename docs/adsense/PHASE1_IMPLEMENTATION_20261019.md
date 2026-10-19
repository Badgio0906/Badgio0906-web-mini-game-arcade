# AdSense低価値コンテンツ対策 Phase 1 — 実装・ローカル検証報告

2026-10-19。対象: Badgio0906/Badgio0906-web-mini-game-arcade。作業ブランチ: `codex/adsense-content-improvement-phase1`。

**LV-01/02/03のローカル実装・検証を完了。main統合、本番公開、AdSense操作は未実施。** 新IssueテンプレートのGitHub上の選択確認は既定ブランチ反映後の公開前確認として残す。ゲーム本体に起因する既存スマホ表示制約を、今回改善した入口の表示品質と区別する。

## A. 改善概要と根拠

| 課題 | 今回の実装 | 利用者の改善 |
|---|---|---|
| LV-01 | Game012/013/014の固有meta、静的タイトル・概要・操作・目標を追加。開始ボタンを説明より前に置く。正本と配信HTMLを同期。 | 初訪問でも始める前に何をするゲームか分かる。同じ説明がJS実行前と実行後に読める。 |
| LV-02 | Game025の古い作者未試遊文だけを削除。Game032の試作表記を内容説明／完成版に整理。 | カタログとの矛盾を解消。新しい技術検証済みという主張は加えない。 |
| LV-03 | aboutページ、控えめなトップフッターリンク、GitHub Issues導線と2テンプレート。 | 目的、制作方針、状態の意味、連絡方法と公開性を確認できる。 |
| LV-05 | 現行コード・公開URL・既存指示を調査、方針案のみ。 | 意図未確定の公開範囲を勝手に変更しない。 |

公式資料は先行監査で確認した以下を参照した。今回の文面・ページ方式は**100ガレ固有の改善案（C）**であり、GoogleがAboutページや一定文字数を必須と定めたという解釈ではない。

- A/B: [AdSenseサイトの準備](https://support.google.com/adsense/answer/12176698?hl=ja)、[コンテンツとUX](https://support.google.com/adsense/answer/10015918?hl=ja)。利用価値、独自性、分かりやすい導線を支える改善。
- A: [コンテンツのない／有用性の低い画面の広告](https://support.google.com/publisherpolicies/answer/11112688?hl=ja)。今回、広告の配置・配信判定は変更しない。情報追記だけでサイト全体の適合を保証しない。
- B（検索向け）: [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=ja)。固有メタ情報・初期HTMLの意味のある内容を整備。JS生成自体を欠陥とは扱わない。
- B（検索向け）: [人を第一に考えたコンテンツ](https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja)。誰向けの何のサイトかを明確化。検索インデックスとAdSense審査は別。内部不承認理由はUNKNOWN、通過予測は行わない。

## B. 変更ファイルと理由

| ファイル | 理由 |
|---|---|
| `src/games/game025/main.ts` | 古い未試遊文の除去のみ。 |
| `game032.html` | descriptionとフッターの古い試作表記を修正。 |
| `src/games/game032/main.ts` | タイトル内の試作版→完成版だけ。 |
| `public/games/yokodori-days/index.html` | 012の固有メタ・静的入口説明、タイトル復元。 |
| `tools/legacy-record-shells/yokodori-days/index.html` | 012の管理正本を同じ内容で更新。 |
| `public/games/tachibana-task-heaven/index.html` | 013の固有メタ・静的入口説明、タイトル復元。 |
| `tools/legacy-record-shells/tachibana-task-heaven/index.html` | 013の管理正本を同じ内容で更新。 |
| `public/games/finger-heart-challenge/index.html` | 014の固有メタ・静的入口説明、タイトル復元。 |
| `tools/legacy-record-shells/finger-heart-challenge/index.html` | 014の管理正本を同じ内容で更新。 |
| `public/games/export-manifest.json` | 変更した入口HTML3件のbytes/sha256だけ更新。native exportのrevision/runtime台帳は維持。 |
| `about.html` | 事実ベースのサイト案内・公開窓口。JS・広告・トラッキングなし。 |
| `src/about/style.css` | 現行ポータルの色・ローカル丸ゴシックを継承し、読み物の行長・余白を調整。 |
| `index.html` | フッターにabout/privacyリンクだけ追加。 |
| `src/portal/style.css` | フッターリンクの44px以上のタップ領域と控えめな下線。 |
| `vite.config.ts` | 既存MPAのHTML入力へaboutを1件追加。base/Pages方式は維持。 |
| `.github/ISSUE_TEMPLATE/bug_report.md` | 既存テンプレートがなかったため、必要項目と公開・秘密情報注意を追加。 |
| `.github/ISSUE_TEMPLATE/site_inquiry.md` | 質問・改善提案の自由記入窓口。公開・秘密情報注意。 |
| `public/fonts/arcade-rounded-jp.woff2` | 新しい本文の文字を既存書体へ追加。既存1375字をすべて保持し1379字へ。全既存文字の輪郭と幅も一致。 |
| `assets/fonts/font-index.json` | 既存のsubset更新スクリプトによるbytes/収録字数の同期。元書体・OFL不変。 |
| `tests/unit/catalog-build-entry.test.ts` | aboutが相対Pages baseのビルド入力に含まれることを検証。 |
| `tests/unit/legacy-shell-delivery.test.ts` | 正本・配信HTML・台帳のずれを3作品で検出。 |
| `tests/adsense-content-phase1/verify.mjs` | 7画面×3幅と任意のサブパス確認を再実行できるローカルQA。 |
| `tests/adsense-content-phase1/native-short.mjs` | 通常入力と既存native startメッセージの受動観測による短い起動確認。 |
| `tests/adsense-content-phase1/serve.py` | rootとPagesサブパスを模すローカル専用static server。デプロイ設定ではない。 |
| `tests/adsense-content-phase1/README.md` | 再現コマンド、検証範囲と制約。 |
| `docs/adsense/PHASE1_IMPLEMENTATION_20261019.md` | 本報告。 |
| `docs/adsense/phase1-20261019/` | 検証結果・選別した実画像。 |
| `docs/CURRENT_STATUS.md` | この候補が未公開であることと再開地点を先頭に追記。既存履歴は保持。 |

## C. Game025・032の状態整合

根拠: `docs/catalog-reorganization/IMPLEMENTATION_REPORT.md`の第1工程に、作者本人の試遊後の明示指示で025/032を含む9作品だけ完成版とした記録がある。現行`gameCatalog.ts`も両方`complete`。その判断自体は変更していない。

- 025: `title()`の「途中の盤面は保存します。復元は休憩状態から。」を保持し、続く`<br>作者の試遊・実機評価はまだ行っていません。`だけを除去。`game025.html`は無変更。
- 032 meta全文: **川辺で、ひとやすみ。清流の釣り場を選び、投げて、合わせて、ゆっくり巻く5分の釣行。無料で遊べるブラウザ釣りゲーム。**
- 032 footer: `100ガレ ～GAME100 GARAGE～ · 完成版`。
- 032 title: `完成版 · 釣った魚の記録も、この端末へ保存します。`。保存説明は維持。

025/032のTSは指定文字列置換以外、baselineと完全一致を検証。モデル、難易度、ヒント、釣行、得点、旧BEST、保存キー／形式は無変更。今回の自動検証を新たな作者完成判断・実機検証済みという表示に転用していない。

## D. Game012〜014の文面全文

以下は実装中のmetaと静的入口に表示する本文の全文。各入口にはこのほか既存の「すぐ遊ぶ」「説明を見る」「練習する」を置く。

### Game012「お前の仕事は俺の仕事」

meta description:

> 同僚がよそ見した瞬間を狙って成果を横取りする、タイミング重視のブラウザゲーム。PCはEnter、スマホは横向きでタップ。見つからずに得点を伸ばそう。

入口説明:

> 同僚がよそ見したら成果を横取り！
>
> PCはEnter、スマホは横向きで画面をタップ。よそ見を待って押すと得点になります。
>
> 作業中に押して見つかるとゲーム終了。バナナは高得点です。待つか押すか、見極めて記録を伸ばそう。

### Game013「タスク天国」

meta description:

> 上司のお手本を覚え、4つのタスクを同じリズムで返すブラウザゲーム。PCは1〜4、スマホはタスクをタップ。3ステージに挑戦しよう。

入口説明:

> 覚えて、叩いて、タスク完了！
>
> 上司のお手本を聞き、次の自分の番で同じタスクを同じリズムで返します。PCは1〜4、スマホは横向きにして各タスクをタップ。
>
> 正しいタスクとタイミングを狙い、3ステージの結果を目指そう。チャット・LINE・Excel・打刻がリズムになる仕事場です。

### Game014「指ハートチャレンジ」

meta description:

> 変化する手の形を見て、指ハートの瞬間を狙うブラウザタイミングゲーム。PCはSpace、スマホはタップ。全5段階、25回の成功を目指そう。

入口説明:

> 指ハートになった瞬間だけ押そう。
>
> PCはSpace、スマホは画面をタップ。指ハートで止めると成功し、ほかのポーズでは失敗です。
>
> 5回成功するたびにスピードアップ。全5段階、25回成功でクリアです。速くなる手の変化を見極めよう。

ルールの照合: 既存入口の操作説明、現行native画面、既存記録overlayの開始／終了hookを参照。012はよそ見・高得点バナナ・捕まると終了、013は4業務・リズム返し・3ステージ、014は5段階×5成功＝25回クリアを確認。元ソースのGitHub取得は404で、未取得のソースを読んだとは扱わない。現行固定exportを起動し、表示と矛盾しないことを確認した。

実装方式: 初期`legacy-start`内へ実際のタイトルカードを置き、そのHTMLを一度保持してタイトルへ戻る時に復元する。通常ブラウザと初期HTMLの情報を共用し、bot専用応答や文章複製を作らない。説明画面・練習・Godot起動関数・入力・記録の処理は維持。管理正本を使う既存import処理でも同じHTMLが再採用される。

## E. 「100ガレについて」主要本文全文

A LITTLE MORE ABOUT THE GARAGE

### 100ガレについて

ちょっとした空き時間に、
ひとつ遊んでいきませんか。

#### ブラウザから、気軽にひと遊び。

100ガレ ～GAME100 GARAGE～ は、ブラウザから手軽に遊べるミニゲームを集めたWebゲームサイトです。インストール不要で、公開中のゲームは無料で遊べます。

短い時間でも挑戦できるゲームや、独自のルール・発想を持つ作品を制作・公開しています。タイミングを見極めるアクション、じっくり考えるパズル、川辺で楽しむ釣りなど、気分に合わせて選んでみてください。

ゲーム一覧ではタグで絞り込めます。気になった作品は、お気に入りに登録すると次に見つけやすくなります。操作方法は各ゲームの案内をご確認ください。

#### 試遊版と完成版

ゲーム一覧には、作者による完成判断の状態を表示しています。

**試遊版**

作者による最終的な完成判断前の作品です。

**完成版**

作者が試遊し、完成と判断した作品です。完成版でも、必要に応じて改善・改修を行う場合があります。

#### 運営・制作方針

サイトの公開用名義は「100ガレ ～GAME100 GARAGE～」です。

新しいゲームを作るだけでなく、既存作品の操作性や説明を見直し、ゲーム一覧の整理も続けています。作品ごとの遊び方を大切にしながら、遊び始めやすく、気になるゲームを探しやすいサイトを目指します。

#### お問い合わせ・不具合報告

ゲームの不具合、操作方法の質問、サイト表示の問題、改善提案、その他のサイトに関するお問い合わせは、GitHub Issuesで受け付けています。

投稿にはGitHubアカウントとログインが必要です。投稿内容は原則として公開されます。個人情報、パスワード、認証情報、セキュリティ上の秘密は記載しないでください。非公開の相談には適していません。

[GitHub Issuesで問い合わせる ↗](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/issues/new/choose)

不具合の報告では、ゲーム名やURL、起きたこと、再現手順が分かると確認しやすくなります。画像を添える場合も、個人情報などが写り込んでいないかご確認ください。

上記に加えてヘッダー／フッターにゲーム一覧への帰還、フッターにプライバシーポリシーを置く。公開名義はユーザー指定のサイト名だけを使用し、個人氏名・住所・法人格・人数は掲載しない。実績数・利用者評価・第三者推薦・問い合わせ先を創作していない。継続改善の根拠は現行Git履歴と既存改修・一覧再編の記録。ゲーム数は更新漏れを避けるため本文に固定しない。

## F. GitHub Issues

作業開始時の`gh repo view`で`hasIssuesEnabled: true`、PUBLIC、default branch `main`を確認。`.github/ISSUE_TEMPLATE/`は存在しなかった。機能・設定の変更はしていない。

- 不具合報告: ゲーム名／ID、URL、問題、再現手順、期待／実際の動作、任意のOS・ブラウザ・画像。
- 問い合わせ: 内容、関連ゲーム／URLの自由記入。
- 両テンプレートのYAML frontmatterをローカルでparseしname/about/titleを検証。自動ラベル・担当者・秘密情報の収集項目を追加しない。
- aboutから[テンプレート選択URL](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/issues/new/choose)を実際にクリックし、未ログインcontextでGitHubログイン画面HTTP200へ転送されることを確認。問い合わせは投稿していない。
- aboutの近傍にアカウント／ログイン必須、原則公開、個人情報・パスワード・認証情報・セキュリティ上の秘密を書かない、非公開相談に不適という注意を表示。テンプレートにも注意を記載。
- **未実施:** 新テンプレートは未pushでmainに存在しないため、GitHub上で実際に2種類から選ぶ確認はまだできない。既定ブランチへ反映後にログインした利用者で選択を確認する。ローカル構文確認をこの確認の代替完了とは扱わない。

## G. hidden4作品の調査・判断待ち

| 内部ID／タイトル | 現行状態 | 本番URL | 取得確認 |
|---|---|---|---|
| Game026 出世すごろく | hidden | https://game100garage.com/game026.html | 200、noindexなし、X-Robots-Tagなし |
| Game028 ぽんぽん卓球 | hidden | https://game100garage.com/game028.html | 同上 |
| Game029 給湯室の落としもの釣り | hidden | https://game100garage.com/game029.html | 同上 |
| Game030 コンセントどこ？ | hidden | https://game100garage.com/game030.html | 同上 |

4URLとも同じサイトの同じURLで取得。コードのカタログ状態と取得HTML／ヘッダーを再確認した。検索エンジンが実際に登録しているかは未確認。

既存記録: `docs/catalog-reorganization/IMPLEMENTATION_REPORT.md`の第1工程に作者指示で4作品をhiddenとした記載、`FINAL_REPORT.md`に「検索・絞込み・お気に入り優先表示にも再掲しない。元URLのゲームと保存は維持」とある。ここでいう検索はポータル内の探索処理であり、Google検索除外の指示とは確認できない。**なぜ各作品を非掲載にしたかという個別理由はUNKNOWN。** 品質が悪いから等と補っていない。

- 一覧掲載: `active`だけをカード／絞込み／お気に入り優先表示の対象にする、というポータルの挙動。
- 直接アクセス: 物理HTMLが配信されているためURLを知る人は開ける。hiddenはアクセス制限ではない。
- 検索対象: noindex不在は検索除外を宣言していないこと。実インデックス登録やAdSenseの評価を示すものではない。

| 将来の選択肢（今回は未実装） | 効果・注意 | ユーザー判断 |
|---|---|---|
| 現状を維持し理由だけ明文化 | 旧リンクと保存を維持。検索経由の流入は制限しない。最小負担。 | 直接アクセス・検索対象の維持を意図するか。 |
| 旧URLを維持してnoindexを追加 | 一覧外の作品を検索除外したい場合の案。アクセス制限やAdSense合格策とは異なる。 | 検索除外の希望を作品ごとに指定。 |
| 試遊・品質確認後に再掲載 | 作品の価値が確認できた場合。状態変更とカード確認が別途必要。 | 再掲載したい作品を指定。 |
| 退役を別タスクで検討 | 維持しないと決めた作品向け。URL案内・旧保存の扱いを先に決める。 | 退役の明示指示と保存方針。 |

暫定推奨は現状維持。作者が各作品の意図を選び、別タスクで必要な変更だけ行う。今回、4作品のHTML・モデル・状態・保存には空差分。

## H. 品質確認・回帰と制限

| 検証 | 結果 |
|---|---|
| `npm run check` | 成功（最終ソースでも再確認）。 |
| `npm test` | 105ファイル／1111件成功。baselineの1107件へ、about入力1件＋shell正本／台帳3件を追加。 |
| 横向き案内追記後の対象テスト | 2ファイル／5件成功。 |
| `npm run build` | 成功。`dist/about.html`と3作品の固有meta／静的説明を確認。 |
| 初期HTML | 全3作品にh1・固有description・概要／操作／目標。aboutはscriptなしで全本文を配信。 |
| テンプレート | 管理正本と配信HTMLがbyte一致。台帳のbytes/hash一致。 |
| 1440/390/320px | top/about/012/013/014/025/032の21ケースで入口表示・操作・帰還を確認。日本語の文字化けとページ横スクロール異常なし。 |
| repository subpath | `phase1/`配下390pxでtop/about/014の追加3ケース成功。about・privacy・一覧帰還・runtime相対パスが成立。 |
| 合計24ケース | JavaScript pageerror 0、外部書き込み要求0。広告リソースの遮断による`net::ERR_FAILED`は記録し、例外0と混同しない。 |
| native短時間追補 | 012/013/014のPCとスマホ各1ケース、合計6件。通常Enter/Space/STARTクリック／タップ後に既存native `start`を受動観測、実画面を確認、一覧へ帰還。014は失敗結果画面も確認。 |
| タグ／お気に入り | 3幅＋subpathでOR/AND、完成9本、全解除27本、登録時に順序維持・reload後優先・他27本への導線保持。 |
| カタログ | byte不変。active27／complete9／trial18／hidden4／retired4。全27既存PLAYリンク維持。 |
| Godot本体保護 | runtime・元game.html・CSS・bridge等50ファイルbyte不変。`play`/`practice`/`answer`関数も旧版一致。manifestのruntimeFiles/revision等不変。 |
| 保存互換性 | 025/032は表示文字列のみ。012〜014本体・Record処理・各保存モデル不変。既存保存／記録関連単体テストを含む全テスト成功。全実ユーザー端末の保存を読み出す検証はしていない。 |
| フォント | 旧1375字を全保持。既存glyphの輪郭と幅をcodepoint単位で比較し一致。1379字へ追加、OFL・原書体不変。 |
| 変更範囲 | `git diff --check`成功。AdSenseコード／Publisher ID／ads.txt／privacy／CMP／GA4／Telemetry／Analytics／Worker／D1／CREDIT／ランキング／Records／入力／得点／モデルは無変更。 |

### 確認済みの既存制約・未実施事項

- **Game012本体:** スマホの縦画面で内容の一部が切れる。844×390横画面でも上部HUDなどが切れる。起動・操作・帰還は成立するが、全ゲーム画面が読めるとは認定しない。Godotとiframeの既存表示構造を維持したため未修正。入口に横向きの案内を加えたが、本体のレスポンシブ改善ではない。画像`native-short-012-844-after.png`等を参照。
- **Game013本体:** 縦画面では「画面を横向きにしてください」と表示。入口に横向きの操作説明を明記。844×390でSTARTタップ→STAGE01/03の進行画面とnative startを確認。横画面の文字サイズ・聴感・快適性は人間の実機確認が必要。
- 本体の表示・面白さ・難度を改善したとはしない。3幅のページoverflow 0とCanvas内コンテンツの可視性は別項目。
- Chromium headless＋SwiftShaderとタッチエミュレーション。物理PC／スマホ、実GPU、音の聞きやすさ、長時間の面白さは未実施。
- ビルドには従来のclassic navigation script、runtime解決CSS、500KB超chunkの警告が残る。今回のaboutは軽量CSSページで、既存大規模ゲームbundleの警告を解消する作業はしていない。
- 初回QAの失敗は、検証側のtag selector重複・タップ遷移待ち・Godotロード完了時のoverlay削除の扱いだった。collectorを限定修正後に検証。横画面013の初回タップ位置もletterboxを考慮せず外れたため、画像からcontain座標へ補正しその1件だけ再確認した。無条件のCI反復はしていない。
- 横向き案内の追記途中にshell台帳のhash不一致を新テストが1件検出。説明追記完了後に台帳を同期し、関連5テストを再確認。中間failureは外部の作業ログに保存し、最終成功と区別した。
- Jev/APIへの新規送信は行わない。今回の利用者指示の「Jev非変更・新たなAPI課金なし」を優先し、既存Godot制約はCodexが差分・画面・通常入力で調査した。独立worker／人間レビューを実施したとは記載しない。
- GitHub Actions／本番deploy／本番広告・解析の送信確認／AdSense設定・再申請は未実施。ローカル検証はCIの実行結果ではない。

証拠: [結果と画像](phase1-20261019/)。再実行方法: [ローカルQA](../../tests/adsense-content-phase1/README.md)。一時ログ全体は`/workspace/audits/content-phase1-20261019/`。報告用に必要な結果・画像をGit管理対象へ複製し、稼働中サーバーに依存しない。

## I. Git・保全・公開制御

- 作業開始時に指定6コマンドを実行。live main、fetch後origin/main、開始HEADはいずれも`9d8828f7dd5f4f69bd25359d160abc272b51f665`。
- 元の`/workspace/arcade-low-value-audit`は監査資料`docs/adsense/`が未commitだったため、そのまま保全。監査資料全体を今回の実装へ取り込んでいない。
- 最新mainから別worktree `/workspace/arcade-content-phase1`、専用ブランチ`codex/adsense-content-improvement-phase1`を作成。本報告と対象変更だけを同ブランチへcommitする。
- commitの識別は最終回答および`git log -1 --format=%H codex/adsense-content-improvement-phase1`で確認できる。本報告への自己参照SHAを作るための余分なcommitは作らない。
- mainへのcommit／merge／pushはしていない。remote mainも最終確認で同SHA。force push、reset --hard、clean、作業破棄なし。
- **未push・PRなし・本番未公開。** 任意のfeature push/PRは行わない。PUBLIC・標準runnerであっても保存容量やWebhook等の費用条件が未確認で、以前の条件付き許可を満たすと断言できないため。過去の一回限りの費用不明点了承は今回に流用しない。Actions起動・再実行・設定変更もしない。
- 変更は上記worktreeとローカルcommitへ保存。**GitHubへのバックアップではない。** 公開は最終報告後のユーザーの判断を待つ。

## J. 次工程・公開前チェック

### Phase 1の残課題／人間の確認

- [ ] 本報告の3作品の説明とaboutの名義・制作方針・公開問い合わせ方針を作者が確認する。
- [ ] 実スマホで入口から短く遊び、012の既存画面欠け、013の横向き条件を許容するか／別改修が必要か判断する。自動起動成功で置き換えない。
- [ ] ユーザーがmain反映・公開範囲と費用条件を承認する。承認前には実行しない。
- [ ] 後日のmain反映後、新Issueテンプレート2種がGitHubで選べることをログインした利用者で確認（投稿不要）。実際のGitHub適用確認はローカル検証と別。
- [ ] 後日のPages成功と本番about・3入口・025/032・トップ・privacy導線を確認する。現時点は未公開。
- [ ] hidden4作品の直接公開／検索対象／再掲載／退役を作者が作品ごとに判断する。今回の完了を妨げない別の判断事項。

### 別Phaseへ送る事項

- Phase 2: カタログを正本とする情報構造・共通説明方式、ポータルの認識可能性、新着導線、必要な検索向け整備を方式比較してから実装。記事数／文字数の増量は目的にしない。
- 別の個別UX改修: Game033同意UI、Game012の本体画面収まり。013の横画面可読性・入力・音の実機確認。今回は着手しない。
- 実利用者の満足度、Google内部審査理由、Search Console実データ、再審査結果はUNKNOWN。広告・解析設定は維持し、必要な人間確認後に再審査可否を判断する。

ここでPhase 1を止める。Phase 2の自動実装・AdSense再申請・公開処理には進まない。
