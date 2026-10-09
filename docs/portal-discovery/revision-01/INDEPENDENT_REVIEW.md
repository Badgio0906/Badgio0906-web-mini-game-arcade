# Portal discovery revision-01 独立レビュー

担当：`navigation_review`。対象はユーザーの新指示である「絞り込み欄全体を同位置で初期折畳み」「favorite☆／★とstorageだけ即時変更し、並び順は再読込時だけ反映」。基準HEAD `dcefa6f2e491d7bded8204bff619a7dfd77a1126`、branch `codex/portal-discovery-comfort`。固定compiled buildの独立ordinary browser74checksと1440・390・320実画像レビューまで完了。対象scopeに製品blockerは見つからない。製品／実装testsは編集していない。Jevログ／回答は読んでいない。

## Source判断

`index.html`、`src/portal/main.ts`、`DiscoveryControls.ts`、`style.css`のdiffを読み、現変更にsource上のblockerは見つからない。

- 原位置のdiscoveryをnative `details#discovery-panel` へ包み、`open`なしで初期閉じ。summaryは48px以上、native keyboardとfocus-visibleがある。内側のtag pickerも初期閉じを維持する。件数・empty案内・保存失敗noticeをouter detailsの外へ置き、閉じても結果状態が分かる。
- `favorites`は現在の登録状態、`orderingFavorites = new Set(favorites)`は当該page-loadの並び用snapshotであり、参照を共有しない。favorite clickとstorageイベントは`renderFavorites()`だけを呼び、カード移動・filter適用・position変更・impression observer再設置を起こさない。
- 後続のtag／mode／development state／clear操作で`applyDiscovery()`が呼ばれても、sortは`orderingFavorites`だけを参照する。未再読込の追加／解除がfilter操作を契機に突然並び替えへ混ざる経路はない。cross-tabの更新／null clearも現在☆／★だけへ反映し、並びsnapshotを変更しない。
- 再読込では新しい正本storageから`favorites`と別snapshotを作り直すため、favorite優先＋releaseOrder、nonfavoriteと新作保持という既存順序をそこで反映する。storage取得／書込拒否ではmemory登録だけに留まり、保存不能noticeをouter panel外へ表示する。
- compact summaryは選択tag名／OR・AND／state名をtextContentで表示し、選択なしではhidden。開閉しても条件をresetしない。filter semantics、active30 catalogとtrial根拠は今回変更されていない。
- カードIDとexisting node、records設置／TOP10 publicEnabled、PLAY blank-card delegation、event名・launch計測、visible-only positionsとonce-per-consenting-visit impressionの経路を維持。favoriteがobserverを再設置しなくなる点は、位置が変わらない新動作と整合する。
- diffにゲームruntime／保存format／AdSense／Telemetry schema／Worker／D1変更なし。広告scriptやranking／record handlersも変更していない。

旧revisionの「favoriteを押して即移動」が成立したQAを、今回の新要件へ転用しない。後続browserでは、追加／解除後の同じcard位置とfocus、filter／clear／cross-tab後もloaded順のままであること、reload時だけ新storage順へ変わることを別々に検証する。外側panelのkeyboard開閉・閉時選択summaryとempty／storage notice、3width実画像も確認する。


## 固定buildの独立操作

製品4sourceは[実行前](QA/INDEPENDENT_HASH_BEFORE.json)／[後](QA/INDEPENDENT_HASH_AFTER.json)ともmanifest一致、配信330fileも差分0。source manifestの5件目である担当の `tests/portal-discovery/browser.mjs` はmeasured QA修正でhashが変わっていたため、**QA runner差分1件／製品差分0件**として正確に分けた。distをimmutable `/tmp/portal-comfort-independent-y6o7bg6i/dist` へcopyし、その同じbuildで初回とacceptedを実行した。旧revisionのsnapshotではない。

[独立probe](QA/independent-comfort-probe.mjs) の [accepted report](QA/independent-accepted/REPORT.json) は **complete:true／74PASS／0FAIL／page errors0／console errors0／POSTその他write0**。resourceは全てlocal fulfill、AdSense JSはQAだけ空stub、analytics consentはdenied、production転送0。seed favorite019、getter拒否、storage.clearは環境fixtureと明記し、操作は普通のmouse／touch／Space／Enterを使った。

各3幅で、019の初期保存favorite順を基準に031登録／019解除をしてもカードを移動しないことを確認した。☆／★、aria-pressed、storageは即更新。Space／Enterのtoggle後も同じfavorite focusを保持する。tag AND／development state／clearを操作してもloaded順のまま。実別タブの025追加後も現在順を維持し、その後のpuzzle filter／clearでもpending025が先頭へ割り込まない。30card／records／PLAY／TOP10既存nodeを保持する。reloadだけ新storage順の025→031へ変わる。別タブnull clearで☆へ変わってもloaded025→031順は維持し、次reloadでreleaseOrderへ戻る。

outer panelは初期closed、summary Space／Enterで開閉しfocusを保持する。closed active条件のAND／tag／完成版summary、empty案内・countはvisible。getter拒否でもmemory☆／★と不移動、closed panel外の保存不能noticeが成立する。各widthのsummary48px、横overflowなし。

## 2findingと原本保持

[同座標解除初回FAIL](QA/browser-local/REPORT.json) と [個別測定FAIL](QA/browser-measured/REPORT.json) は原本として残す。後者はstarfalse・scrollY9437不変・positions1..30不変・button44×44不変、bboxのみ約0.79px差。既存CSSのhoverは2px／150msで、未settleのbbox厳密一致は画面順移動を検証する条件に過剰だった。[blind判断](QA/COORDINATE_CANCEL_JUDGMENT.json) はTEST_INFRA_BUG／必要true／AUTOMATED_TEST／重大risk=false。独立では190ms settle後の同座標mouse／touch解除を3幅で実行し、bbox／size／scroll／orderすべて一致してstarfalseになった。ranking／launchなど製品を変えていない。

[独立初回FAIL](QA/independent-final/REPORT.json) は72behavior checks成功後、page error gateで失敗した原本。SecurityErrorはgetter拒否caseより前の通常contextにもあり、レビュアーのinitializerがopaque about:blankでunguarded localStorageへ触れていた。[raw finding](QA/FINDING_INDEPENDENT_OPAQUE_STORAGE.json) を共有し、Jev記録済み通知後に [最小対照](QA/OPAQUE_STORAGE_DIAGNOSTIC.json) を実行。**製品resourceを1件も読み込まないabout:blank**で元fixtureは同じexception1件、origin:nullをskipすると0件。旧／新Portal runtimeへ依存しない証拠であり、無関係なゲーム／records／analytics修正を不要と判断した。QA guard1行だけ追加したaccepted全74が成功。 [blind判断](QA/OPAQUE_STORAGE_JUDGMENT.json) はTEST_INFRA_BUG／必要true／AUTOMATED_TEST／重大risk=false。Jev回答／ログは読んでいない。

## 実画像判断と限界

acceptedの [PC1440](QA/independent-accepted/1440-initial.png)、[390](QA/independent-accepted/390-initial.png)、[320](QA/independent-accepted/320-initial.png)、[320 closed empty](QA/independent-accepted/320-closed-empty.png)、[390 denied getter](QA/independent-accepted/390-denied-getter.png) をview_imageで実際に開いた。全体collapseが原位置の薄いsummary行になり、count→favorite/status→thumbnail→BEST→黄色PLAYが3widthの初期viewportで見える。trial pink／☆★cream-yellow／PLAY yellowが区別され、text clipや重なりは観測しない。closed selected summaryは320でもAND＋tag名と完成版を折返し表示し、0/30とempty案内がその下に見える。getter拒否noticeはpanelを閉じたまま読め、個人recordは取得不能を正しく示す。

初期collapseと後続filter維持は別結果として受け入れる。今回は限定Portal UI改修であり、ゲーム全体A〜H score／human Feelを再採点しない。mobileはChromium emulation、physical実機／notch、人間の誤tap率、作者による完成宣言は未確認。公開deploy／production resource照合は担当の後続工程で、本独立local74を公開検証と呼ばない。全browser／contextをfinallyで閉じ、担当へ実行枠を返却した。

同causeの追加numerical原本 [担当final初回](QA/browser-final/REPORT.json) では320 width44→43.99998474121094のfloat誤差だけが厳密一致に落ち、starfalse／scroll9271／card.offsetTop9601／全positionsは不変、bbox移動約1.15pxは既存hover2px内だった。coordinate判断にこの実証を追補した。寸法0.01px未満許容は目に見える移動を許す変更ではなく、order／document layout／scrollを厳密に保持したままDOMRect計算精度を扱う限定QA補正。担当のcorrected全幅runはこの追補時点で進行中、未完了を合格扱いしない。
