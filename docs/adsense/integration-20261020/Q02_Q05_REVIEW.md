# Q02 / Q05 — 独立read-only状況レビュー

2026-10-20 UTC、担当 `/root/game015_ui_review`。根拠は現在のコード・Gitの読取り・保存済みQAで、今回はブラウザ、新たなテスト、Git mutation、PR操作、外部API、公開を実行していない。書込みはこの報告書のみ。指示書は `/workspace/attachments/295484ee-75a7-4022-a96e-ab006f22d5dc/貼り付けたテキスト.txt` 第11・12節。AGENTS / PROJECT_CONTEXT / CURRENT_STATUS / GAME_DEVELOPMENT_RULESを参照した。

**結論：Q02は縦専用候補の実装・既存Chromium証拠を確認、作者の実iPhone確認待ち。Q05はコード修正せず実iPhone横向き試遊待ち。いずれも本番への統合許可を意味しない。**

## Q02 Game015：版と最新mainとの関係

- 内部 `game015`／表示012「落下キング」／`game015.html`。内部Game012のGodot作品とは別。表示013のGame016とも別。
- 保全対象worktree：`/workspace/arcade-game015-mobile`、branch `codex/game015-mobile-landscape-ux`。
- `git status --short` は空。HEADは `dbdf915a696b326f1247dd41c9f6cbf8765e9c56`。`git ls-remote origin refs/heads/codex/game015-mobile-landscape-ux` も同SHAだった。branch名にlandscapeが残っていても、最新実装方針はスマホ縦専用。
- `origin/main` は `619adc35a4339dc5d6f1ddc4e357d5f7eccde991`。共通祖先は `47c6cfe1ea93f71325fc47ff7031980ef9be9f74`。
- 共通祖先からmainとPR候補への変更パスを独立に比較すると交差は **`docs/CURRENT_STATUS.md`のみ**。親のmerge-tree調査でも競合は同ファイルだけという報告を受領した。レビュアー自身はmerge-treeを再実行せず、merge結果の生成・競合解消・ブランチ更新をしない。
- 将来の統合ではCURRENT_STATUSのPR12公開済み26本／9完成・17試遊という現行記録と、PR11未公開・実機待ち記録を両方保持する必要がある。片側文書の丸ごと採用は避ける。今回この解消は行わない。
- PR候補とmainを統合した実行版のcheck/test/build・ブラウザ回帰は **今回未実施**。パスが交差しないことは実行時無影響の証明ではない。PR11とPR12を混ぜて公開したという報告はしない。

### 保存済みQAと現在コードの一致

下記5ファイルを実際にSHA256計算し、`docs/game015/mobile-ux/portrait-only/QA/SOURCE_HASHES.json` と全一致した。

|ファイル|SHA256|
|---|---|
|`src/games/game015/main.ts`|`78afb58528716bd981105f594b960f852c262a2220ae23d1bd464ee064ae08fa`|
|`src/games/game015/style.css`|`2a6b280d001eef2f8616a21b5580eb2a81704430f2acd8fc2342cdc28a8007d1`|
|`src/games/game015/portrait.ts`|`ef01dd29598fa3073ed91aa66f767ae60ac0d604aa36f7ef4a92e2dc95345ffe`|
|`src/games/game015/FallBoard.ts`|`e939d2122d817f1fe682dfbf87886d459fe55f8b43509a17dbc9e8f8a64db584`|
|`src/arcade/onboarding.ts`|`fcc6b2cc82c756c3fc8160d13b66e26e66797e62114174ca18dc0e035c4d0478`|

保存済み `QA/SUMMARY.json` はcheck / 1137tests・107files / build成功、DEV9条件224項目、compiled7条件80項目、入力4条件115項目、機能4条件95項目を記録している。これは以前の固定候補の実績で、今回の新規実行数には加算しない。PR12統合済みmainの976件と、PR11の以前の1137件は対象コード・削除された専用テスト・追加入力テストの範囲が異なるため、件数差だけで退行や統合後合格を判断しない。

### 設計・入力解除のコード判定

|項目|読取りによる確認結果|証拠・限界|
|---|---|---|
|縦専用判定|`(pointer: coarse) and (hover: none) and (orientation: landscape) and (max-width: 1000px) and (max-height: 600px)` の全条件で横案内。|`portrait.ts`。物理機種判定ではない。fine PC、1024×768等の大型tabletは除外。Bluetoothマウス接続・小型tablet／分割表示は境界の実機確認が必要。|
|横案内|`app.inert=true` と非表示、縦へ戻す説明と一覧リンク。案内へfocusを移す。解析footerは通常フローに残る。|`main.ts:158`以降と`style.css:64`以降。旧横操作Grid・解析footerの横向き固定配置は再開していない。|
|回転停止／復帰|横へ入る前にplayingなら既存pause、controller入力／captureを解除。縦へ戻ってもpausedを維持し、明示的「続きから」だけで再開。|mainのmedia change callback。回転の前後でgesture epochを更新し、旧接点の遅いclick持越しを抑える。|
|ending|400ms結果待ちの残時間を保存してtimerを停止。縦戻りで残り時間だけ再設定。|controllerの終了演出時計もpause。run_end／BEST確定は再実行しない設計。既存親QAの実行証拠で、自身の新規RUNではない。|
|本番単指終端|document captureのpointerup／pointercancel、親lostpointercapture、window終端、pointermoveのbuttons0／viewport外、keyup captureで入力を解放。|`FallBoard.ts:118`以降。bubble停止に依存する経路を減らす。全てのOS中断通知の到来を保証するものではない。|
|本番全解除|resize、orientationchange、blur、hidden、pause、title、start、natural end、destroyでrelease。pagehideはmainのpause／quitへ接続。|capture所有map・入力mapを先に消し、releasePointerCapture再入時にも復活させない。位置・速度を強制変更せず、慣性とheldフラグを区別。|
|最終touch fallback|touchend/cancelでtouches=0の時だけtouch由来pointerを解放。|Touch.identifierとpointerIdを同一視せず、キー／mouseを保持。1指の終端だけ欠落して他の指が残る場合、その指を特定して消せるとは保証しない。|
|選択／callout|Canvas・操作欄／子孫だけuser-select:none / touch-callout:none。contextmenuの既知pointerIdだけを解除、一般selectstartは影響controlを解除。|Text node targetも正規化。説明文・解析UIは一律選択禁止にしない。Safariの実OSメニューの解消は未確認。|
|練習の回転|setSuspendedでsession・DOM・phaseを保持してnative dialogを閉じ、縦戻りのpracticeに明示続きからを追加。再開時にperformance基準を更新。|Game015だけがsetSuspendedを呼ぶ。練習capture mapも所有者を先に消して解放する。説明／練習の保持は既存独立QAあり。|
|練習と本番の強化範囲の違い|練習はwindow pointer終端＋dialog lostcapture＋blurと、close／新練習／回転時clearを使う。本番と同じdocument capture／最終touch0 fallback一式ではない。|不具合を今回実証してはいない。長押し後の実機確認は**本番と練習を別々に行う**。入力解除の全経路が実Safariで保証されたとは表現しない。|
|PC維持|fine pointerで案内を出さず、Canvas＋右guideを保持。短画面は右guide内scroll。|旧独立compiled fine844とcoarse1024、親1440証拠あり。従来PCの完全なpixel一致を意味しない。|

補足：PR11には過去の横向き設計で追加した `consentUI.ts` の `part="settings"` / `part="privacy-link"` という表示用属性が残る。現在の縦専用CSSはそれらを固定配置に使用しない。差分は属性追加のみで同意handlers・同意判定・GA4送信を変更していない。これを今回削除する作業は行わない。

### 既存証拠の到達範囲

- `docs/game015/mobile-ux/portrait-only/INDEPENDENT_REVIEW.md` と `QA/independent/review.json`：説明を開いて回転／復帰、練習のEnter・Space明示再開、時計停止とcatch-upなし、本番の回転pause維持、案内中の設定と一覧帰還、fine844とcoarse1024を記録。自身が以前実行した固定候補の証拠で、今回再実行していない。
- `docs/game015/mobile-ux/iphone-input/INDEPENDENT_REVIEW.md`：native touch＋keyboard混在、同一button2接点、選択の合成fixture、通常説明の選択、解析設定、自然結果を記録。合成contextmenu／selectstartはSafari長押しの物理再現ではない。
- `QA/WEBKIT.json`：WebKit NOT_RUN、physical iPhone Safari NOT_RUN。練習成功画面を開いたままの回転復帰も両担当でブラウザ未実施。
- Canvas幅揺れは旧main／PR固定viewportとstatus長短fixtureで未再現。実iPhone時の原因はUNKNOWNのまま。縦専用化で原因特定済み／根治済みとは報告しない。

### Q02 作者用実iPhone受入チェック（全て未実施）

端末機種、iOS/Safari版、候補SHA `dbdf915…`、URL、向き、Safariバー状態、音設定を記録する。本番はまだ旧版なので、作者が準備したPR11候補の確認URLと本番を取り違えない。

- [ ] 縦でtitle／説明／練習／本番が読める。Canvas全体と左右・DROP、pause、一覧リンクが切れず、親指で押せる。
- [ ] 本番で左・右・DROPをそれぞれ短押し／長押し→解放。左右＋DROP、同一方向2指、片指だけ解除→全指解除で押下表示と入力が残らない。慣性による短い移動は入力残留と分ける。
- [ ] 上記長押しを練習画面でも繰り返す。文字選択・calloutが出ず、または中断後に入力が固着しない。説明文の通常コピーはできる。
- [ ] 押したまま画面外へ指を動かす、指を離す、アプリ切替→復帰、Safariバー開閉で継続入力が残らない。
- [ ] 本番中に指を押したまま横へ回転し、案内、入力中立、時計／足場停止を確認。数秒待って縦へ戻りpauseのまま。新しい「続きから」操作後だけ再開する。
- [ ] 練習中の回転は同じ練習を保持し、戻っただけでは進行しない。「続きから」後に再開。説明画面・成功画面・結果画面も回転で消失・誤開始しない。
- [ ] 横案内で設定・プライバシー・ゲーム一覧へ到達できる。PCと大きいtabletは通常プレイのまま。
- [ ] 幅揺れが出たら動画と、発生直前の長押し対象・向き・バー状態・URL／SHAを保存。採取可能ならinner/visual viewportとCanvas DOMRectを同時記録し、原因UNKNOWNとして戻す。

## Q05 内部Game013：コード変更なし・実機確認票

対象は **内部Game013「タスク天国」**。URLは `https://game100garage.com/games/tachibana-task-heaven/index.html`。表示番号013の内部Game016ではない。shell説明は「上司のお手本を聞き、次の自分の番で同じタスクを同じリズムで返す」「PC1〜4、スマホ横向きタップ」「3ステージ」。チャット・LINE・Excel・打刻の4領域を持つ。

main619とPR11で `public/games/tachibana-task-heaven/{index.html,game.html,portal-return.css}` のGit blobが一致することを読取り確認した。Game013製品の書込みは一切行わない。過去 `docs/legacy-records/IMPLEMENTATION_REPORT.md` のPC/横スマホ技術操作・通常/OJT分離・結果／retryの証拠は参考にするが、物理iPhoneの音とタッチ同期の代わりにしない。

### 作者用実iPhone横向きチェック（全て未実施）

|ID|人間が実施する手順|確認して記録すること|
|---|---|---|
|G13-01|iPhone Safariで正しいURLを開き、横向きにして「説明を見る」→「すぐ遊ぶ」。|機種／iOS／Safari版、通信状態、バー表示、開始までの待ち、文字・HUD・4領域の全体が見えるか。shell練習だけで本番確認済みにしない。|
|G13-02|本体の音量と消音／出力先を確認し、ゲームの音設定を確認。上司の4種類のお手本を聴く。|各音を区別できるか、視覚の指示とのずれを感じるか。Bluetoothと本体speakerは混同せず出力先を記録。人間の聴感評価を架空のms精度へ換算しない。|
|G13-03|自分の番でチャット・LINE・Excel・打刻を、中央だけでなく通常の親指位置でも各数回タップする。|対応する領域だけ反応するか、押しやすさ、隣領域の誤入力、safe-area／バーでの隠れ、離した後の連続入力がないか。お手本の番で押した時の通常のルール挙動と故障を区別。|
|G13-04|音と画面のお手本を覚え、通常プレイを3ステージ続ける。|音／tap／応答の同期感、指示が理解できるか、疲労・誤操作、進行不能の有無。OJTを通常記録と混ぜず、使用したならRUN全体でその設定を記録。|
|G13-05|自然な通常結果へ到達し、表示された得点・内訳を確認→再挑戦→新しい通常RUNを開始する。|retryが押せること、新RUNで入力や音が固まらないこと。結果到達をモデル注入やstage飛ばしで作らない。0点でも自然終了ならその得点をそのまま記録。|
|G13-06|結果からTITLE、一覧へ戻り、必要なら再訪する。|帰還先が100ガレであること、既存端末記録・音設定が意図せず消えていないこと。記録共有投稿やAdSense操作は不要。|
|G13-07|短い中断（バー開閉／アプリ切替）後に通常操作を再確認。|音だけ／入力だけが取り残されないか。既知のpause仕様を未確認のまま保証せず、観測した挙動を動画・再現手順で記録。|

実機で重大な入力不良や表示欠けを得た場合は、URL・端末・向き・バー・音の出力先・設定・操作手順・動画／画像を戻し、別の限定修正タスクを検討する。今回、未確認を理由にコード変更・追加公開保留・自動再申請へ進まない。

## 終了時確認

PR11 treeは読取りのみ。製品・テスト・Git状態を変更せず、ブラウザを起動せず、main統合／deploy／有料サービス／有料API／管理画面操作を行っていない。第2段階の技術修正PR作成・公開判断の代行ではなく、Q02状況整理とQ05の人間確認準備を完了した。
