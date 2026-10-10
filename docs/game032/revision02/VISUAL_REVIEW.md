# Game032 revision02 — 独立Visualレビュー

基準commit：`5ecaa9d`。実装担当・技術QA担当とは別のVisual担当が、現行AGENTSと参照仕様、対象のHTML／FishViews／CatchRecords／main／CSS／Aquariumを確認した。Jev回答とAPIログは参照していない。読み込みは今回実施したもので、過去タスクでの読込を断定しない。

## 現時点の確認範囲

ソース観察のみ。固定buildの実画面がまだないため、全画面構図・スマホ視認性の合格とはしない。ブラウザを技術QAと並行起動しない。画像確認後にこの同じ報告へ実際の証跡と判断を追記する。

- 魚の記録は、種類ごとの最大サイズ・その最大魚の日時・最新日時を区別し、未捕獲種も表示する構造。端末内保存・練習除外・保存失敗について説明がある。
- 観賞水槽は既存ImageGen製写真調水槽と実釣果を再利用し、「記録の魚」と「今回の魚」を区別する構造。観賞は釣行を停止し、閉じると元の状態を復元する。
- 全画面釣り場は既存の川・少年・釣り操作を拡張表示し、退出を残す構造。ブラウザFullscreen API失敗時はCSSで全viewport表示を維持する。

## 修正前に報告したfinding

`r02-pause-record-description`：Pauseの旧文言「5分を終えた釣行だけが記録対象です。」が、途中の本番魚も即時保存する新機能と曖昧に矛盾する。`main.ts`のpause／processEvents、`CatchRecords.record`を根拠に修正前に実装者へ報告した。独立判断はCONTENT_OR_SPEC_ISSUE／追加作業必要true／次の証拠CODE_INSPECTION／重大公開リスクfalse。個人BESTと魚記録を明確に分ける文言を推奨した。事後の修正・再確認は未実施。

## 実画面・未確認事項

実画面レビュー待ち。本人の楽しさ・実機iPhone／AndroidのFullscreen API挙動・聴感は未確認であり、このレビューの判断へ読み替えない。

## 初回固定画面の観察（09:30 UTC候補・未合格）

`QA/independent-browser-01/pc-failure.png`では川・麦わら少年・上部退出／休憩・釣り方・操作ボタンが全て視認できる。method-baitはviewport内かつcenter hit成功で、HTML祖先のbox検査だけがfalseになっている。実際のclipをこの証跡から断定しない。QA担当が検証基盤の解釈を確認する。

別に`pc-empty-gallery.png`は、viewer.open=true検査後に撮影されたにもかかわらず、普通の川＋側面水槽の構図で全画面水槽のheader／scopeボタンが見えない。`r02-gallery-screenshot-mismatch`として修正前に実装者・QA担当へ報告した。独立判断はUNKNOWN／作業必要true／LIVE_INTERACTION／risk=true（必須の新画面が実際に隠れる場合）。スクリーンショット取得／native fullscreen遷移／dialog layerのどこが原因かは現時点で未確定。これはHTML clip検査問題とは別の観測である。

Pauseの文言はソース上で「個人BEST・共有は5分完了時のみ。釣った魚の記録は途中終了しても残ります。」へ変更されたことを再確認した。

## 追加の切り分け証拠（初回失敗の保持）

`QA/independent-viewer-probe-02/unsupported-api-fixture-viewport.png`ではFullScreen APIを明示的に無効にした技術fixtureで、水槽が大きく表示される。同じ素材・sourceのnative通常入力画面は旧川のまま。このfallbackをnative合格へ読み替えない。

`probe-03/ordinary-original-order-viewport.png`と`technical-dom-reopen-after-native-viewport.png`では、同じnative app／viewer.open／rect／center hit条件で、nativeが落ち着いた後にdialogを技術的にclose／showModalした場合だけ水槽が描かれる。この追加証拠により最初のUNKNOWNからPRODUCT_BUGへ判定を更新した。作業true／再確認SCREENSHOT_REVIEW／未解決risk=true。初回判定と変更理由は保持する。DOMを直接操作したprobeは原因切り分けであり、通常操作の合格ではない。

もう一つ別のfinding `r02-viewer-header-proxy-overlap`：上記fallback／技術native画面では左上「← ゲーム一覧へ」proxyがviewerタイトルの大半を覆う。閉じるボタンと水槽は見える。独立判断PRODUCT_BUG／作業true／SCREENSHOT_REVIEW／重大risk=false。修正前に実装者へ報告した。

## 最終固定候補の実画面判定

**PASS：86/100、可読性F13/15、完成感H13/15。Visualとして公開を止める未解決問題はない。** 確認対象は`QA/independent-browser-05/REPORT.json`の開始／終了source・素材・font SHA一致の固定候補。独立QAの390checks成功・pageerror0・POST0を参照しつつ、以下の実画像を別に開いて判定した。

| 観点 | 点数 | 実画像からの理由 |
|---|---:|---|
| A identity |13/15|元の清流写真調背景と独自の麦わら少年を保持。記録・水槽も穏やかなcream／tealに統一。|
| B character/object |13/15|魚の形・模様が判別でき、既存の少年も全画面川岸に自然な接続を保持。|
| C background |9/10|元の美麗な川と水槽を歪めず使用。実ゲーム画面で主役となる。|
| D UI |9/10|記録・観賞・全画面・退出・休憩が明示され、既存Portal returnとviewer headingが分離。|
| E composition |8/10|PCとportraitは川・魚が読みやすい。portrait水槽はsquareを保つ余白があり、short landscapeでは高さが少なく水槽が小さい制約が残る。|
| F readability |13/15|種名・最大cm・最大魚日時・最新日時・未捕獲を区別。44pxの操作と320pxでのlabel wrapを実画像／geometryで確認。|
| G motion |8/10|1.25秒離れた実時計の水槽frame pairで、安定した写真背景に対して魚が左右移動。派手な効果なし。静止spriteの並進であり新たな尾びれアニメーションを確認したとはしない。|
| H value |13/15|実釣果・永続記録・再読込・観賞と操作が統合され、仮の美術や隠れた主要ボタンは残っていない。本人の面白さ評価とは別の判断。|

### 開いた実画面

- PC1280×900：`pc-records.png`／`pc-fullscreen-standard-landed.png`／`pc-gallery-swim-start.png`と`pc-gallery-swim-next.png`。nativeの通常操作後に水槽が実際に表示され、beforeの旧川のみの画像との差を確認。
- phone相当390×844：`phone-records.png`／`phone-gallery-viewport.png`／`phone-fullscreen-ready.png`。記録最大値と日時、photo frameと魚、viewer title／close／元Portalの分離を確認。
- 小画面320×740：`small-records.png`／`small-gallery-viewport.png`／`small-fullscreen-ready.png`／`small-fullscreen-pause.png`。釣り場の狙い位置・少年・釣り方・action・休憩と退出が残る。退出labelの2行表示は読める。長いrecordsはviewer bodyをscrollする設計。
- short landscape844×390：`landscape-records.png`／`landscape-gallery-viewport.png`／`landscape-fullscreen-ready.png`。全画面川に操作が被らず、tankはsquareを保持するため高さ制限で小さいが、種／サイズlegendは見える。recordsの日時はscrollするcard下部にあり、exact ISOはQAがDOMでも確認した。

### findingの再確認

Pauseの誤解を招く旧説明、native fullscreenとdialogの順序、viewerタイトルとPortal proxyの重なり、phoneの休憩ボタン34px幅を修正前に独立報告した。最終画像では説明の区別・native galleryの描画・heading分離・44px休憩が確認できた。最初のUNKNOWNと原因切り分け後のPRODUCT_BUG更新を上段に保持し、失敗証跡を成功画像へ上書きしていない。HTML clipping oracleやkeyboard focusの試験側修正を製品Visual修正の成果へ混ぜない。

## 限界と本人の試遊

Visual担当は実画像・実時計frame pair・source・独立QA evidenceを確認した。並行live browser試遊は行わず、実機iPhone／Androidのnative fullscreen・発熱・タッチ感・聴感・今回追加機能の人間評価は未確認。ユーザーの「楽しさはそこそこイイ感じ」は前のrevision01への実感であり、revision02合格の代用にしていない。旧BESTから種／サイズ／日時を復元したとはしない。
