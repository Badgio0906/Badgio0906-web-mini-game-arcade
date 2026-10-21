# Game012 スマートフォン横向き専用化：独立設計レビュー

2026-10-21 UTC。依頼された `/workspace/arcade-game012-visibility` の候補689165eを前提に、現行shell、engineの公開JS、native record bridge、親の記録受理処理、生成経路をread-onlyで確認した。現在のユーザー指示は添付 `12f6f6d2-00b9-4344-9ec3-3a7ed5cca2bd/貼り付けたテキスト.txt`。製品、テスト、Git、ブラウザ、API、公開操作は行っていない。以下は設計評価であり、新実装のQA合格ではない。

## 推奨と停止方式

**スマートフォン縦向きはshellで本編起動を拒否し、横→縦ではセッションを中断してiframeのbrowsing contextを破棄する案を推奨する。** 横へ戻っても自動起動せず、「もう一度遊ぶ」の新しい操作だけで新UUIDのゲームを起動する。960×540 / policy0 / actual canvas contain は現状維持。

公開 `GAME100_RECORD_BRIDGE` は legacyBest/currentBest/storageError/cancelRun/startRun/finishRun の片方向通知で、pause/resumeはない。engineの公開 `requestQuit()` は協調終了要求であり、停止完了や即時終了を保証せず、pauseでもない。engine内の `MainLoop.pause()`、audio sample pause等は内部実装で、ゲーム時計・入力・保存の安全なpause/resume契約ではない。元export実物もないため、バイナリ内部へ未公開APIを注入せず、「利用可能な安全pause APIを確認できない」と扱うのが妥当。

| 方法 | 評価 |
|---|---|
| iframeをhiddenにするだけ | 見えないゲームが進む。不可。Analyticsのvisibility pauseイベントも実際のengine停止ではない。 |
| requestQuit / blur / visibility / audio停止 | ゲーム全体の即時停止・時計・入力取消を保証しない。pause扱いにしない。 |
| srcを除去 / about:blankへnavigate | 不要なengineを最終的に破棄できるが、navigation commitまでは非同期。単独で即時停止済みと断定しない。 |
| hiddenで受理停止後、iframeをDOMからdetach | 子browsing contextを破棄し、見えない実行を継続させない。今回の制約内で最も明確。再開ではなく中断と説明する。 |

## セッション無効化と遅延result

`src/records/LegacyGameRecords.ts` の受理条件は origin一致、`event.source===frame.contentWindow`、`!frame.hidden`、現在frame.srcが同originの`/game.html`、そのURLのrecords_sessionとpayload UUID一致。さらにmatching native start/result IDと重複排除が必要。`scope_end` とhidden監視は記録UI/候補をclearするが、ゲーム自体を停止しない。

中断処理は一つの同期的な関数へ集約することを勧める。

1. 最初に `frame.hidden=true`。同時にshellのepochを進め、held/gestureEpoch等の入力状態をclearし、practiceのrequestAnimationFrameも止める。受理のhidden gateが直ちに閉じる。
2. phaseを中断状態へ変更し、同じiframe要素をDOMからdetachして子contextを破棄する。detachした要素のsrcを除去する。古いgame.htmlを設定したまま再appendしない。
3. shellと一覧/説明/同意/privacy導線を表示し、「縦向きになったため今回のプレイを中断しました。横向きに戻して『もう一度遊ぶ』から始めてください」等を表示。pause/resumeと呼ばない。
4. 横向きへ戻ったイベントは案内/ボタンの状態だけを更新する。src、game_launch、native start、resultを生成しない。
5. 明示再挑戦時に向きを再確認し、srcなしの**同じiframe要素**を再append、新UUIDを付けて起動する。古いnonceを再利用しない。必要なallow/title等の属性を保持する。

同じ要素を保持する理由は、LegacyGameRecordsとanalytics側load listenerが起動時にその要素を捕捉するため。新しいiframe要素へ置き換えるだけでは既存記録listenerが古い要素を見続ける。共有記録処理の変更なしで済む同一要素のdetach/reappendが狭い。browsing contextを破棄してから再appendすれば、新contextのWindowProxyと新nonceが旧messageを拒否する。hidden監視のresetはMutationObserver microtaskで走るため、次のmessage task前に候補/結果欄をclearできる。

回転処理前に正当に受理・確定した既存resultまで取り消す設計にはしない。既存BEST、確定記録、ユーザーの共有設定・待機キューを全削除しない。回転を偽のcomplete/result/scoreゼロとして送らない。既に開始した正当なmirror非同期処理や既存投稿を後から取り消すことと、回転後の遅延resultを拒否することは別である。

元Godot保存の内部filesystemやDBを直接操作しない。context破棄時に未flushの今回進行が残る保証はなく、中断した途中プレイを保存済みと説明しない。一方、以前に永続化されたBEST/旧保存を削除・初期化しないことは既存save fixtureと再読込で確認する。

## 端末・向きの判定

スマートフォン識別とportrait判定を分離する。狭いviewport、縦横比、touch機能単独でPCを判定しない。

- スマートフォン候補はprimary `(pointer:coarse)` と `(hover:none)` を合わせ、さらに端末screen短辺の上限（例600 CSSpx以下）を用いる案が妥当。`any-pointer:coarse`だけではtouch付きPCを巻き込む。端末screen短辺ならtabletのsplit-viewの狭いviewportをphoneと誤認しにくい。
- 600は規格上のphone識別値ではなくヒューリスティック。小型tablet/大型phone/外付けマウス/ブラウザのscreen報告に境界がある。スマートフォンの検証対象320/375/390/430短辺を含め、768/820短辺tabletやfine/hoverありdesktopは通常操作を維持することを明記する。小型tabletの境界fixtureも必要。
- portraitは `screen.orientation.type` を利用できる場合はそれを優先し、旧Safariはwindow.orientation、最後にmatchMedia orientation/viewport比をfallbackにする方式を検討する。viewport比だけでは仮想keyboardやbrowser UI変動を回転と誤認し得る。画面の物理向きを強制固定しない。
- orientation change / resize / media query changeで判定を更新する。`play()`の直前にも同じ判定を行い、ボタンdisabled/CSSだけに依存しない。イベント後に予約済み起動が残るならepochで無効化する。横へ戻る処理と起動処理を分離する。
- Canvasは既存のiframe viewportに対するcontainを維持。browser UIによる小さな高さ変動のたびにGodot属性960×540を書き換えない。主にCSSの表示寸法だけを追従させる。

縦でもタイトル/遊び方、一覧帰還、analytics設定/privacyは操作可能にする。本編開始につながる全playボタン（説明・練習成功画面を含む）へ同じguardを適用する。独立shell練習まで縦で禁止することはユーザー必須条件ではない。案内はbody全体や共有同意hostを置換せず、ゲーム領域内で構成する。

なお `game.html` の直リンクは現状shellを迂回する。canonical入口のshell制限だけを実装するのか、直リンクも要件の「本編開始不可」に含めるのか、成果物に範囲を明記する。後者なら012専用HTML adapterによる起動前guard等を検討できるが、配信HTML bytes/SHA・監査同期の追加変更として扱う。共有bridge/binary変更の理由にはしない。

## 生成・manifest・保護範囲

現時点の `public/games/yokodori-days/index.html` と `portal-return.css` は `tools/legacy-record-shells/yokodori-days/` の同名ファイルと完全一致。importerはmanaged shellをcopyし、runtime HTMLに012専用fit helperを適用する。

- 基本変更は012のmanaged shellと配信shellの同時更新。CSSを分ける場合も012の対応ファイルだけへ限定する。新scriptを外出しする場合は生成/copy/配信manifestにも含める。
- shellだけの変更ならexport-manifestは012 `shellFiles` の該当bytes/SHAだけ更新。runtimeFiles/sourceSha256/runtimeBytes/totalRuntimeBytesは据え置く。既存fit済みgame.htmlをさらに変える場合だけそのruntime rowと合計を更新し、同じadapterをimporter/厳密監査へ反映する。
- Game013/014 HTML/engine/shell、PR11、record bridge/親protocol/保存、Analytics/Consent/GA4/AdSenseの意味、Worker/D1/API、catalog公開状態を変更しない。新たな停止のために偽のgame_launch/return_to_portalを流さない。
- importerに必要な元export実物がない制約を維持する。managed copy一致、HTML再現、manifest実bytes、固定binary hash照合は可能だが、完全な元export検証済みとは記載しない。

読み取った基準SHA256：

| file | SHA256 |
|---|---|
| 012 shell index.html | `c040ea598aa294bdaa4a6ac363f053f66ede5d3cf3d070aea5c098561c4128df` |
| 012 portal-return.css | `033a9dc3a21330f645079c36689d69b9597f0d59bac4ec55cd8f8f91f391a1be` |
| 012 game.html | `60e43504fe125cf1771f8a10273139757d6b17a6e930f3dd6935b4f9c3c2bec8` |
| 012 index.pck | `46a9ae5df324babdea9833427da0aeeb80813cf99fd3b787636032335f21f412` |
| 012 index.wasm | `6498359ba889796a0d95a2f71113ac184badc0f2d84cf28f4103c7e399d2d547` |
| native-record-bridge.js | `abc097e373fc619aa6b9235c0ab865f5737f5d50919fb2a916d5306f9b859ce1` |
| LegacyGameRecords.ts | `7c38684f9e54b5ccc04e1221a92284e498329419df4dd4f3674de50743bd14ae` |

## 実装後に必要な証拠

ユーザー指定7サイズ（390×844 / 375×667 / 320×568 / 844×390 / 932×430 / 667×375 / 1440×900）で案内・起動可否・全人物/HUD・touch/keyboard・結果/retry・帰還を確認する。追加でfine/hoverありの狭いdesktop portrait、tablet portrait/landscape、split-viewを判定fixtureに含める。

最も重要な回帰は、native起動/読込中またはプレイ中→縦回転→旧context消滅/音停止/結果欄消去→旧source/sessionの遅延start/result拒否→横戻りでも空iframe/未起動→明示再挑戦の新nonce→通常の実結果だけ1回確定、の一連の流れ。pointer長押し/Enter押下中に回転し、古いreleaseが新runへ作用しないことも確認する。rotation直前に既に完了した正当な記録は保つ。

BEST fixture再読込・保存拒否、consent unknown/grant/deny/later/privacyと中断後の再アクセス、013/014不変hash、manifest/生成copy整合、check/unit/buildを別々の証拠として残す。指定の修正前後画像を保存し、Safari実機の向き/viewport/聴感/可読性は未実施なら明示する。PR13はDraftの作者レビュー待ちであり、この設計判定をmerge・公開・AdSense再申請の許可としない。
