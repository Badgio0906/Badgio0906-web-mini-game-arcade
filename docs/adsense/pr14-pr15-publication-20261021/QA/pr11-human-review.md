# PR #11競合境界と実iPhone確認票 — read-onlyレビュー

2026-10-21 UTC、担当 `/root/game015_ui_review`。指示書 `/workspace/attachments/12f6f6d2-00b9-4344-9ec3-3a7ed5cca2bd/貼り付けたテキスト.txt` 第11～13節に対応する。今回はGitの読取り・コード／既存QAの参照だけを行い、Git mutation・merge／解消・製品変更・API・有料サービス・ブラウザ起動を実施していない。成果物はこの文書のみ。

**PR11の縦専用と入力解除を保持したまま確認のみ完了。競合は現行記録の先頭追記が重なる文書境界であり、PR14・PR15マージ後の最終mainでも製品変更パスの交差はない。PR11の解消・統合・公開は今回行わない。物理iPhoneの受入は未実施。**

## 1. 比較した版

|対象|確認値|確認範囲|
|---|---|---|
|PR11作業tree|`/workspace/arcade-game015-mobile`、`codex/game015-mobile-landscape-ux`|`git status --short`空、HEAD `dbdf915a696b326f1247dd41c9f6cbf8765e9c56`。親が伝えた現PR11のSHAと一致。今回はGitHub API再照会なし。|
|PR14公開後main|`405572999e998ed0a7d702572a43127c4e1e96be`|確認時のローカルorigin/mainと一致。公開結果は親担当の実施報告であり本レビュアーの本番試遊ではない。|
|共通祖先|`47c6cfe1ea93f71325fc47ff7031980ef9be9f74`|`git merge-base`で確認。|
|PR15承認候補|`55790917f1182b0dc91267b627e0d43c85d61cf1`|同意対応のtitleのみmodeless／他menuはmodalというコードを読取り。最終mainの2製品blobと一致。|
|PR14・15マージ後の最終main|`ac5304fa81361f592942c472c7fa04f668d3b4bc`|再確認時origin/mainと一致、PR14 mainを祖先に持つ。tree `7f5c8bea59f23eaa3fa7b271f58792f818dca5a7` は親の統合QA treeと一致。Pages39521734437は親連絡時点で進行中であり、本書はdeploy完了を保証しない。|

PR11の現在の5製品hashは、保存済み `docs/game015/mobile-ux/portrait-only/QA/SOURCE_HASHES.json` とすべて一致した（main.ts／style.css／portrait.ts／FallBoard.ts／共有onboarding.ts）。過去の1137件・Chromium QAは当時固定版の証拠であり、PR14/15を含む仮想統合版の新しいテスト成功へ読み替えない。

## 2. 競合原因と差分境界

共通祖先→main405と共通祖先→PR11の変更パス集合を比較した。**交差は `docs/CURRENT_STATUS.md` の1ファイルのみ。** main619→405の追加製品変更は `game002.html`／`game003.html`／`src/games/game035/main.ts` で、PR11のGame015入力・縦専用コードと重なっていない。

CURRENT_STATUSは共通の見出し直後に、両ブランチが別々の新しい記録を追加している。

- main側：PR12正式公開／掲載26・完成9・試遊17／削除4＋保留031／第2段階の候補と実機待ち。
- PR11側：Game015縦専用候補／入力固着対策／実iPhone未確認／未公開、さらに旧横向き改訂の履歴。

同じ先頭挿入箇所を編集しているため、どちらの記録を先に置くかを機械的に選べず、文書競合になる。過去に親がmain619と行ったmerge-tree調査でも同ファイルだけの競合と報告されている。今回はmerge／merge-treeによる結果生成や解消を行わず、変更パスと3版の先頭本文から原因を照合した。

**片側のCURRENT_STATUSを丸ごと採用すると、PR12/14/15の公開済み状態またはPR11の未公開・実機待ちを失う。** 最新mainで確定した公開状況を現在の正本とし、PR11の候補・未公開・作者確認待ちを別の最新項目として保ち、旧横向き評価は当時の履歴と明示する必要がある。今回編集はしない。

### PR11で失ってはいけない内容

- 内部Game015／表示012はスマートフォン**縦専用**。ブランチ名のlandscapeや過去画像を理由に旧横操作Gridへ戻さない。
- coarse＋hover:none＋横向き＋幅≤1000／高さ≤600のgate、案内・app inert、pauseと入力解除、縦へ戻っても自動再開しない。
- FallBoardのdocument capture終端、capture所有mapを先に消すcleanup、最終touch0 fallback、同一button複数指の既知ID個別解除、Text node選択起点、blur／hidden／viewport外の解除。
- 練習DOM/session保持と明示「続きから」、ending残時間保持、保存／物理／得点の互換。
- PR11に残るconsentUIのpart属性は表示hookのみ。PR15の初回同意UXを戻す理由にしない。

本番の入力adapterと練習の終端経路は完全同一ではない。練習はwindow終端＋dialog lostcapture＋blur／回転時clearを使うため、実機長押しを本番と練習で別々に確認する。実Safariで全イベントが必ず届くと保証しない。

## 3. PR15マージ後の最終mainで再確認済みの境界

親から最終main `ac5304fa81361f592942c472c7fa04f668d3b4bc` を受領後、同じPR11 treeを変更せず読取りで再比較した。初回PR14 main405の結果を流用せず、以下を最終SHAで確認した。

|境界|最終mainでの結果|判定の限界|
|---|---|---|
|mainのSHA／tree|origin/main=ac5304f、tree=7f5c8bea。PR14 main405を祖先に持ち、親の統合QA treeと一致。|Git内容の同一性。Pages39521734437の完了・本番配信は親担当の別検証。|
|交差ファイル|共通祖先47c6cfe→最終mainとPR11の変更パス交差は引続きCURRENT_STATUS.mdのみ。|今回はmerge-tree／merge／競合解消は実行していない。既知の先頭挿入競合の原因が変わっていないことを本文と変更集合で確認。|
|Game033の製品境界|main405→ac5304fの製品差分はgame033/main.tsとstyle.css。両blobは承認候補5579091と一致し、PR11変更範囲と重ならない。|共有UIと同時に動く実行時の回帰は、将来PR11統合候補で別途必要。|
|共通consentUI／onboarding|最終mainの両ファイルは共通祖先のblobと同じ。PR11の表示part属性・Game015練習変更と今回main変更が同一ファイルで衝突していない。|「全ゲームへ副作用なし」の実機証明ではない。|
|Game015／013の公開版|Game015製品ディレクトリとgame015.html、Game013専用public配下は、共通祖先→最終mainで空差分。PR11縦専用候補は未統合。|本番の旧Game015をPR11候補と混同しない。|
|カタログ／配信|最終mainのcatalog／Viteは共通祖先から変更されている（PR12整理）。一方PR11側は両ファイルを変更しておらず交差なし。26本／9完成17試遊・削除4／031保留は親の最終main検証を正本とする。|本レビュアーは新しい本番カウントやHTTP検証を行っていない。将来の統合で旧catalogへ巻き戻さない。|
|文書|PR14→15にはCURRENT_STATUSの追加編集なし。最終main対PR11の先頭記録競合は引続き公開済み記録と未公開候補記録の保持が必要。|解消未実施。main側の公開記録追記がこの後に増える場合、その新SHAでも再比較する。|
|実行回帰|親の統合QA treeとの一致は確認した。PR11をそのmainへ統合したcheck/test/build／browserは未実施。|今回PR11統合が禁止であるため未実施のまま。将来承認された候補で実測する。|

**最終read-only結論：既知の文書競合の原因と安全な解消方針は変わらない。PR11はdbdf915のままcleanを維持し、Game015縦専用・入力固着対策を失う変更は行っていない。**

## 4. 将来の安全な解消手順（今回は実行しない）

1. 作者がPR11の更新／競合解消を別途許可した時点で、元PR11 HEAD・dirty状態・最終mainを記録し、既存treeを保持した独立worktreeで準備する。
2. 最新mainの公開済み成果とPR11全commitを保持する通常の履歴統合を選び、force push／reset／他PRの取り込みで上書きしない。親の現在の作業から無断で実行しない。
3. CURRENT_STATUSの両方の最新事実を手動で残す。他ファイルに未知の競合が増えていたら、自動的に片側を採らず対象ごとに報告して止める。
4. 解消差分が文書の調整と承認されたmain取込みだけであること、Game015縦専用・入力固着対策・物理／保存を保持することを確認する。PR13のGame012変更を混ぜない。
5. 最新統合状態でcheck/test/buildを実行し、得られた実件数を報告する。古い1137件／976件を期待値として捏造しない。
6. Game015の縦3サイズ・横案内3サイズ・PC、回転pause/no auto-resume、練習の明示再開、multi-touchと終端、共有onboarding他ゲーム、**PR15公開後Game033のfresh同意とtitle/modal** を回帰確認する。
7. 作者の実iPhone受入・レビューを待ち、許可された場合だけ通常pushとPR更新へ進む。main統合・deployは改めてその作業の承認範囲に従う。

## 5. 人間用実iPhone共通記録欄

全項目**未実施**。記録は機種／iOS・Safari版／対象URLと本番か候補か／commit SHA／縦横／Safariバー状態／音出力先／同意の事前状態／観測結果／動画・画像／再現回数。人間の聴感や快適性を、測定していないmsや合格点へ換算しない。

通常profileの既存同意や保存を無断で変えず、新規privateセッションと既存profileを分ける。モデル・時刻・得点・BESTを手作業で注入／削除せず、広告クリック・記録投稿・AdSense再申請は不要。テストに伴う同意操作は作者自身の明示的選択として行う。

### Game015（表示012）：PR11候補だけで行う

本番はPR11未統合の旧版なので、本番URLを開いただけで縦専用版を試遊したとは記録しない。候補SHA dbdf915と正しい確認URLを先に確定する。

- [ ] 縦のtitle／説明／練習／本番でCanvas全体、左右・DROP、pause、一覧が読めて押せる。バー開閉と片手／両手を区別。
- [ ] 左・右・DROPを短押し／長押し→解放。本番と練習で別々に実施し、押下表示と方向／DROPが固着しない。説明文の通常コピーは維持。
- [ ] 左右＋DROP、同一button2指、片指だけ解除→全指解除、画面外で解放、アプリ切替→復帰で入力が残らない。慣性をheld残留と混同しない。
- [ ] 入力したまま横へ回転→案内・入力中立・足場／時計停止→数秒後縦へ戻る。pauseのまま、新しい「続きから」だけで再開。
- [ ] 練習回転でも同じsessionを保持し、明示再開まで進まない。説明・練習成功・結果も回転で消失／誤開始しない（成功画面の回転は過去ブラウザQAでも未実施）。
- [ ] 横案内から一覧・privacy・解析設定を操作できる。PCの通常プレイも保持。
- [ ] Canvas揺れがあれば向き・バー・長押し対象・候補／本番を含む動画を保存。原因は既存固定viewportで未再現のUNKNOWNで、縦専用化による根治済みとは扱わない。

### 内部Game013「タスク天国」：公開版を横向きで

正しいURL：`https://game100garage.com/games/tachibana-task-heaven/index.html`。表示013の内部Game016ではない。今回コード変更なし。

- [ ] 横で起動し、上司のお手本・自分の番・4領域とHUDが見える。shellの簡易練習だけで本編確認済みにしない。
- [ ] speaker／headphone／Bluetoothの出力先とゲーム音設定を記録。お手本と視覚指示、tap後の音・応答が自然に同期して感じられるか。
- [ ] チャット・LINE・Excel・打刻を各数回、普通の親指位置でも押す。隣領域の誤入力、画面端の切れ、離した後の繰返し入力の有無。
- [ ] 通常RUNを3stage進め、自然な結果→retry→新RUNへ到達。OJT使用時はRUN全体の設定を記録し、通常記録との分離を保つ。
- [ ] TITLE／一覧帰還／再訪と、短いアプリ切替後に音だけ・入力だけ残らないか。得点は自然な実値を記録し、低得点もそのまま報告。

### Game033「夜空に、ひと発。」：PR15公開確定後の版で

URL：`https://game100garage.com/game033.html`。本番のPR15反映SHAを先に確定。初回titleのみ非modal、説明・休憩・結果はmodalという変更が対象で、Google広告CMPとは別の独自Analytics UI。

- [ ] 新規privateセッションで、**ゲームを始める前に**解析panelの許可／拒否／未選択で閉じる／privacyが読めてtapできる。4経路は別セッションで記録。
- [ ] privacyの戻り先・一覧への帰還が正しい。Safariのバー・safe-area・320相当の小幅でpanelが操作不能に隠れない。
- [ ] 拒否・未選択でも通常100秒と無制限練習へ開始できる。同意buttonのtapがゲーム開始や最初の花火へ持ち越されない。
- [ ] 既存同意済みの再訪と、設定からの撤回を別に確認。通常profileの本人同意をscriptで上書きしない。
- [ ] 本番の長押し→解放、練習、説明／休憩modal、明示再開、自然な結果→retry、一覧帰還が成立。OSの選択やダブルtapで誤開始しない。
- [ ] 外付けkeyboardを使う場合だけTab／Enter／Spaceで操作し、同意panel・titleとmodalでfocusが見え、意図しない打上げがない。未使用ならkeyboard実機項目は未実施とする。

## 6. 優先度と完了の範囲

- 公開待ち：PR13内部Game012の横専用候補、PR11内部Game015の縦専用候補。どちらも今回レビュアーが統合／公開しない。
- 作者実機待ち：Game012横の文字可読性・tap、Game013音と4領域・結果retry、Game015長押し・回転pause・縦操作、Game033 Safari同意。
- 後回し：Game012 native HUD再設計、Game031品質改善／再公開、新作、全デザイン再制作、共通engine大改修。Game031のon-holdとsource／save保全を維持する。
- これらは作者の品質基準・確認済み障害・未確認事項の整理であり、Google公式が各操作や画面を特定の形式で要求したという意味ではない。AdSenseの本当の不承認理由・合格確率はUNKNOWN。

PR11 treeは読取り終了時もclean・HEAD dbdf915。PR14・15マージ後の最終main ac5304fとの差分境界確認と実機票作成を完了した。Pages完了・本番反映・物理iPhone受入は親担当と作者の別工程。
