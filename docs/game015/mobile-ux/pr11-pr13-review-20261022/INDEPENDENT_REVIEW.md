# PR11 Game015 最新main統合候補：独立コードレビュー

2026-10-22 JST。`/workspace/arcade-game015-mobile`、PR11 dbdf915をmain537c6c3へ取り込む候補をread-onlyでレビューした。内部Game015／表示012「落下キング」が対象。Game012 PR13の横専用化は別タスクであり、本報告の対象に含めない。現在の公開28作品、031保留を前提とし、古い26作品/ac5304時点の結果を現行合格へ読み替えない。

実装者と別にmainとの差分、Game015本体、共有onboarding/consentUI、既存テスト・過去報告を読んだ。変更したのは本書だけ。製品・テスト・Git書込み、ブラウザ、API、paid API、push/merge/deployは実行していない。Jev paid APIは **NOT_CALLED**。

**最新判定：停止・入力解除・保存/共有互換の主要構造は整合。回転をまたぐ保持keyboardの問題は後述の限定修正を確認し、未解決の重大コード修正要求はない。** 初回所見とhashは以下に保全する。これはコードレビューであり、統合候補全体のcompiled/browser成功や実Safari合格を主張しない。

## R015-ROTATE-KEY-01：保持Enter repeatが練習の「続きから」を起動し得る

`src/arcade/onboarding.ts` のkeydownは、activeかつ非suspended時に `if(practicePaused)return` を実行した**後**にe.repeatのガードがある。setSuspended(false)は練習をpracticePaused=trueとして復帰し、tutorial-resume-buttonへfocusする。したがって回転前から保持したEnterのrepeatはpreventDefaultされず、focusした「続きから」のnative activationへ進める余地がある。Spaceのrepeat→releaseも確認対象。keyupもpracticePaused時はSpace/EnterのpreventDefaultを行わない。

独立pure probeで実keydown handlerを読み、型castだけを除いてNode VMで実行した。active=true、suspended=false、Enter/repeat=trueの条件で、practicePaused=trueはpreventDefault=false、通常practicePaused=falseはtrueだった。**repeatガードを迂回することはコード上確認済み。ただし実ブラウザで実際に再開したという再現は行っていない。** 最初のprobeは以前のworktreeのTypeScript依存パスが既に無く実行不能だったため、外部取得をせず型cast除去で再実行した。依存パス失敗を製品bugとして数えない。probeのstdout rawファイルは作成せず、本節が観測記録。

推奨実証手順：練習中にEnterを保持→横向き→保持したまま縦へ戻る→repeat/keyup。新しいkeydown/tapなしでelapsedが進むか、resumeボタンが消えるかを確認する。Spaceも別試行する。mainの本番pausedもresume-buttonへfocusし、native button repeatを止める専用ガードがないため同条件を確認する。解除後の新しいEnter/Space/tapは正常に再開できることが必要。

独立判断：入力のepochはpointerにのみ適用され、このkeyboard条件を証明しない。NEXT_EVIDENCEはLIVE_INTERACTION。再現した場合は保持キーのrepeat/releaseを再開へ持ち越さない限定修正が必要。練習repeatチェックをpracticePaused分岐より前へ出すだけでもEnter repeatの穴は狭まるが、Spaceのdefault activationや本番pauseも別に検証する。今回のreviewerは修正していない。

過去の独立報告は新しいEnter/Spaceによる再開を検証している。それは有用だが、「回転前から保持したキー」の合格ではない。本所見を旧報告の実行失敗へ読み替えない。また、この経路はPR11側の復帰設計に存在し、main537への文書conflictが生成した不具合とは断定しない。

## mainとの差分と他ゲーム保護

製品差分はgame015.html、Game015 FallBoard/main/portrait/style、共有onboarding、consentUIに限られる。Game015 FallRun、物理・得点・難度・旧保存、src/core/data/records、他作品本体、Worker/D1/API、Vite/公開状態/workflowに製品差分は確認されない。036/038追加済みmainを古いcatalogへ戻す変更は本差分に含まれない。CURRENT_STATUSのconflict解消はroot所有であり、本reviewerは編集していない。

consentUI差分はsettingsの `part="settings"` とprivacyリンクの `part="privacy-link"` の追加だけ。grant/deny/laterのcallback、初回unknown表示、shadow event隔離、GA4/Consent/Telemetryの意味は変わらない。Game033のmain側修正などを失う差分はない。新partを使って他作品の配置を変える製品CSSは検索上見当たらない。

共有onboardingのsetSuspendedはGame015だけが呼ぶowner用API。既存callerではsuspended/practicePausedがfalseのままで、旧explanation/practice/close経路を保つ。新しいcapture所有管理の実使用もGame015練習に限定される。destroy/closeは入力を中立化し、Mapを空にしてからcaptureを解除するためlostcapture再入を想定している。Game005など共有練習の実browser回帰はrootの新candidateで必要。

## 縦専用・回転停止

- gateはprimary coarse＋hover none＋landscape＋幅1000以下＋高さ600以下。向き強制lock/UA判定ではなくviewport/input heuristic。fine-pointer狭PCや大きいtabletは制限しない。小型tablet・touch PC・外付けpointer・keyboard viewportには境界が残る。
- playingから横になる際、portraitBlockedをtrueにする前に既存pauseでcontroller/audioを停止し、pausedにする。appをinert/非表示、案内へfocus。縦戻りでもpausedを維持し、自動controller再開は行わない。pointer capture/方向/DROPはcontroller.pause内releaseで消える。
- endingは正規のBEST/記録確定後の400ms表示待ち。横でtimeout残時間とcontroller演出clockを止め、縦で残時間だけを再開する。onEndのended guardがあり、回転でrecordSession.completeやrun_endを再実行しない。
- タイトル・説明・練習・成功・結果のDOM/session/callbackを保持する。onboardingの一時非表示はnative dialog.closeであり、既存closeラッパーを呼んで完了/退出扱いにしない。練習tickを止め、復帰はpracticePausedと新しい「続きから」。前述の保持keyboard条件は別途確認が必要。
- screenEpochを回転の両側で増やし、pointer originはrelease後も保持するため、旧pointer clickの新画面への持越しを拒否する。Game012の以前のMap.clear問題と違い、回転時にgesture originを全消去していない。

## 長押し・DROP・保存・PC

FallBoardの新入力管理はpointer IDごとに左右/DROPを独立保持。document captureのpointerup/cancelを追加し、shadow UIがbubbleを止めても解除する。touch.identifierをpointerIdと混同せず、最後のtouch終了だけをfallbackに使う。blur/hidden/resize/orientation、viewport外、buttons=0、callout/selectionの中断時も解除し、新しい押下まで復活させない。左右＋DROPの1本ずつ解除とkeyboard併用を想定する。3/10秒に達したことを理由に強制解除するtimeoutはない。

位置/速度の書換えで停止を偽装せず、releaseはhorizontal=0 / heldDrop=false、pauseは物理step自体を止める。キーkeyupもcaptureで受ける。PCのArrow/A/D/Space等とbutton focusの左右/DROP対応は現状維持。画面操作外のgutterを新しい移動対象にしない。

保存prefix `web-mini-arcade:v1:game015:`、現ルールbestR04と旧bestの分離、正常onEndでの最大値保存、recordSessionの既存版を維持する。新snapshot形式や回転時の偽result/ゼロ保存を追加しない。端末save拒否・通常reload・BEST単調性は実テストで確認する。

CSSはsafe-areaと実footer高から残領域を割当てる。PC右guide、canvas256×448/4:7、pixelated、縦の下部3ボタンを保ち、横専用操作Gridを削除する。consent/footerを外部固定配置へ変えず、案内中も通常導線として残す。CSS contain/query sizingの実収まり、44px以上、長押し時の幅揺れ、Safariの選択/アドレスバーは画像・実機の別証拠が必要。

## 受入で区別する証拠

過去PR11の1137unitや9条件224項目、旧27カード帰還は当時の記録。最新main28作品/031保留と組み合わせた新しいcheck/unit/build/compiled・帰還をrootが確認する。rootが準備中のbrowserを本reviewerは起動していない。

新candidateで優先するのは、上記保持Enter/Space、指定縦3幅と横3幅/fine PC/tablet、press中回転でsnapshot停止、縦戻り未再開→fresh再開、練習/説明/成功/ending/結果の往復、long hold/複数指/片指解除/callout、通常終了1回/BEST、consent/privacyと一覧到着、他作品共有練習。実iPhone/WebKit/音/快適性が未実施なら明示する。旧画像や本レビューのソース読取りを新RUNの実証へ流用しない。

## 読み取った候補SHA256

| file | SHA256 |
|---|---|
| src/games/game015/main.ts | `78afb58528716bd981105f594b960f852c262a2220ae23d1bd464ee064ae08fa` |
| src/games/game015/FallBoard.ts | `e939d2122d817f1fe682dfbf87886d459fe55f8b43509a17dbc9e8f8a64db584` |
| src/games/game015/FallRun.ts | `cf102ff13db9e23429c05894aa5c242a4b95a19d1c2ef75386d84e52427f7884` |
| src/games/game015/portrait.ts | `ef01dd29598fa3073ed91aa66f767ae60ac0d604aa36f7ef4a92e2dc95345ffe` |
| src/games/game015/style.css | `2a6b280d001eef2f8616a21b5580eb2a81704430f2acd8fc2342cdc28a8007d1` |
| src/arcade/onboarding.ts | `fcc6b2cc82c756c3fc8160d13b66e26e66797e62114174ca18dc0e035c4d0478` |
| src/analytics/consentUI.ts | `7eb6be05b6af6922de236d9b985a3545422b52528e1f420f332fdac4ad7fd138` |
| game015.html | `ebd0f0e6fa519845347350a693d2cc5a689f115e9667655116540e3e87d10db5` |

## 追補：保持keyboardの実browser REDと限定修正

rootが通常keyboardとviewport回転を用いて実行した `QA/rotation-key-four-red/RESULTS.json` を実際に読んだ。練習/本番×Enter/Spaceの4ケースが、回転前before=trueから保持キーrepeat/upだけでafter=falseになり、すべてFAIL。本所見はpureな可能性だけでなく、rootの実browserで再開まで再現された。reviewer自身がbrowserを操作したとは主張しない。

最終限定修正はGame015所有のportrait.tsに `guardRotationActivation(signal)`、main.tsに初期化と回転の両側でのinvalidateを追加したもの。共有onboardingは初回hashと一致し、既存dbdf915のまま。window captureでEnter/Spaceのheldを記録し、回転時にheldだったキーをstaleにする。stale repeatはpreventDefault＋stopImmediatePropagation、stale keyupも既定activationを抑えて削除。新しいdown/upは通す。window captureはonboardingのdocument captureより先に処理でき、保持キーを失効させる処理は復帰dialogへのfocus変更より前にある。abort.signalでHMR dispose時のlistener解除も既存main cleanupへ接続する。物理・保存・共有onboardingを変更しない対処として妥当。

### 修正途中の範囲問題と再修正

最初のguard案はblocked()ならtargetを問わず新しいEnter/Spaceも全て抑止するものだった。このままでは横向き案内の一覧linkやshadow consent/settings/privacyへの新しいkeyboard操作までwindow captureで止めるため、reviewerが限定修正を依頼した（R015-ROTATE-KEY-02）。最終guardはblocked状態を一切参照せず、**回転をまたいだstaleだけ**に限定された。案内中のfresh activationは通し、案内中から保持したキーは次の回転invalidateでstaleにする。ゲーム本体の横向き保護は既存inert/controller停止に任せる。

この最終ソースをNode VM＋mock window EventTargetで独立実行した。EnterとSpaceそれぞれ、downは許可→invalidate→repeat/up拒否→新down/up許可を確認した。案内中を想定したfresh Enter許可→次回invalidateでup拒否、abort後listener解除も確認。実browserのnative activationと区別する。修正途中にrootが関数signatureをblocked callback付きからsignalだけへ変えた時点で最初のprobeが旧引数を渡して停止したが、これは並行変更中のprobe呼出し不一致であり製品失敗とは数えない。最終signatureで再実行しPASS。

rootの `QA/rotation-key-green-final/RESULTS.json` も読み、練習/本番×Enter/Spaceはすべてbefore=true / after=true、4/4 PASSとなっている。初回REDは保持したままで上書きしていない。案内/設定/privacyへのfresh keyboard到着の実browser確認はrootが別途実行予定であり、本レビューのpure結果からその到着を合格にしない。

**独立追補判定：R015-ROTATE-KEY-01と修正途中の範囲問題はコード上対応済み。未解決の重大コード修正要求はない。** rootの最終compiled・共有回帰・実機未実施事項と別に扱う。

## 追補：既存保護hashの許可範囲

旧 `PRESERVATION_MANIFEST.json` は基準として保持され、以前のcatalog整理treeの同文書とbytes一致を確認した。新しい `QA/AUTHORIZED_PRESENTATION_HASHES.json` はGame015 main.ts/style.cssの2キーだけを持つ。現在の2ファイルからgit blob形式のSHA1をローカル計算し、fixture値との一致を確認した。

catalog-publication.testはこの2件に候補fixtureを使い、残るrecordDefinitions/gameVersions/localRecords、Worker records/aggregate、Game031 save/worldは従来preservationの値を使う。036/038の既存additive strip処理は維持し、全保護を無効化したり旧manifestを新bytesで置き換えていない。PR11で承認されたUI/安全入力の差分を、無関係な保護byteの変更と分ける調整として妥当。テストを実行した結果はrootの記録を参照する。

## 最終guard読取り時のSHA256

| file | SHA256 |
|---|---|
| src/games/game015/main.ts | `63c5d94eb8de8926916877454f0f1fa7f70df814af0365cb19b1120a741f71a7` |
| src/games/game015/portrait.ts | `edc6ddea43c15810886d0c2b32fb707ab9c7df835a67d8929532194219a337ee` |
| src/arcade/onboarding.ts（不変） | `fcc6b2cc82c756c3fc8160d13b66e26e66797e62114174ca18dc0e035c4d0478` |
| src/games/game015/style.css（不変） | `2a6b280d001eef2f8616a21b5580eb2a81704430f2acd8fc2342cdc28a8007d1` |
| tests/unit/catalog-publication.test.ts | `59d239a53527438ed551899d3ae192a18d09a9fe37f3967173aeaf278057fd8c` |
| tests/unit/game015-portrait.test.ts | `c45706624663e1d23c269aba811d9c1203778f96d0dba659509eb2676b0133ae` |
| QA/AUTHORIZED_PRESENTATION_HASHES.json | `f26ccd21100922d8f731c71e1d46c98af03278e4aa844d2c6c745c064f6da8ce` |

## 最終追補：閉じた共有練習dialogの表示修正

`src/arcade/onboarding.css` をmain側コピーとread-only比較し、短い横画面media内の親selector `#arcade-training[data-phase='practice']` に **[open]だけを追加**した1行差分を確認した。display:gridのauthor ruleが、open=falseのnative dialogまで表示する既存main継承bugへの限定修正として妥当。開いた練習のgrid配置や子selector、入力・session・同意処理は変えない。閉じたdialogはこのdisplay指定の対象から外れ、native非表示へ戻る。

root報告では001/005のclose後表示残りを実browser RED2で確認し、修正後はconsent keyboard390/844＋共有001/005の4条件、最終compiled7サイズ80項目、長押し115項目、最終CSSでbuild成功。本reviewerはこの追加browserを実行しておらず、成功数を自身の実行へ加算しない。コード上の追加修正要求はない。今回の最終製品範囲にはこの共有CSS1selectorが加わる。

共有CSS SHA256：`d816f147fd5b178bb9d67320c011462a36e27ea827c6800930615c427aace974`。
