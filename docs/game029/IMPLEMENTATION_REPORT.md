# Game029 実装報告（検証継続中）

2026-10-08日本時間。基準main `7c3d089d69da1ff076c63acb7c3ba96449728a1d`、作者worktree `/workspace/batch-two-author-029`。今回所有はGame029のHTML・固有model/UI・テスト・文書のみ。共有Catalog／Worker／Portal／Sheet／commit／公開はRoot担当で、作者はそれらを編集していない。

独自の青緑の水、会社の忘れ物13種、J釣り針と糸をCanvas描画。100m／3枠／幅1から自動下降・巻き上げ、左右回収、帰還一度換算、RUN内3強化、好きな時に「今日は帰る」。詳細の価格上限・設計確率・保存は[仕様](IMPLEMENTATION_SPEC.md)。素材は独自コード描画で、inline参考画像は視覚方向として受領したがローカル原画像のhashは未取得。

## 技術検証

- 初期23対象unit／check／独立HTML build成功。
- 直接practice診断をproductionへ記録するsourcefindingを独立担当が修正前保存＋ONE C Shadowで確認し、ゲーム内guardに限定修正。現source02は25unit／check／build成功。
- 最初のnative Chromium compiled run（source `1ae1d1ed6ce3`）はdesktop1365×900の通常一投、休憩、return、reload同額継続、finish一度、retry、明示quit後再読込、実練習が完了。
- 続く390×844で水ドラッグ後のPause tapにdepth停止が確認できず、その場で停止。viewport／DOM／入力trace／source／compiled beforeを一意runフォルダへ保存し、ONE C Shadow実APIを送った。修正・再試行は独立判定後とし、この時点でphone／320px／横向きの合格を主張しない。
- 保存validationの独立sourcefindingは修正前Shadow／独立probeで確定し、semantic不正／oversize時にmemory-onlyをラッチする限定修正を実施。source03は27unit／check／isolated build成功。
- Phonepauseの一回の限定診断（18:18UTC、source03）は通常locator.tapのtrusted down/upが0.2ms間隔でclick未発生、続く新しい80ms押下のCDP native touchはtrusted clickを発生しpaused74mを500ms維持した。実装inputは変更していない。これは診断結果であり、原因の最終独立判断や全スマホQA合格ではない。

## Phone pause の継続診断（19:20UTC時点）

初期の「短すぎるPause押下」という仮説だけでは説明できず、18:21UTCの最初の100.5ms押下でもclick未発生だった。最初の判断と原本は保持し、Fの独立判断はUNKNOWNとして記録した。19:17UTCに同じsource04／同じCDP省略パラメータ／同じ1回move／最初のPause80msを揃えた2つの新規contextで、ドラッグだけに50ms+50ms待機を加えて比較した。[比較原本](QA/pause-original-params/2026-10-07T19-17-57.003Z/OBSERVATION_SUMMARY.json)。即時ドラッグ（実測83.2ms）はPause116.7msでもclickなし、待機ドラッグ（実測149.8ms）はPause100msでclick発生し91mを400ms停止した。

独立レビュアーはこの自動操作観測をTEST_INFRA_BUGと判断し、ゲームinputを変更せずcollectorのドラッグを50ms+50msへ限定修正するRoot指示を受けた。[collector freeze](QA/COLLECTOR_FREEZE_NATIVE_05.json)。Chrome内部のclick抑制原因、物理端末の急な指操作、全4画面の最終RUNはまだ未確認。原因を断定した以前のannotationを後日書き換えてはいない。比較manifestの「property-forwarding」は不正確な説明で、実際はpassive event listenersとMutationObserverだけだったことを別のOBSERVATION_SUMMARYへ明記した。

## Jev／証拠

作者のphonepause APIはapi_attempted実送信、AVAILABLE、HTTP200、`typesafe/jev-1.13-20260917`応答。結果は独立判定前に読んでいない。最初のviewport文字列schema rejectionは送信前で実API回数に含めない。Practice production issueの実APIはRoot independentログにあり、同じ問題を重複呼出していない。

結果の最大深度／最もレアな物の初期source omissionについて、修正前Shadowとimmutable source保存を行わず先に補った手順不備がある。[当時の制限](QA/PROTOCOL_LIMITATIONS.md)に記録し、後から実施済みに見せない。

## source04 通常RUNの操作QA

[19:33UTCのcompiled4画面](QA/e32070781326/2026-10-07T19-33-02.637Z/manifest.json) はPC1365×900、phone390×844、320×844、横844×390すべて成功。通常cast、左右操作、休憩の停止、帰還一度入金、reloadから明示継続、今日は帰る→結果一度、retry→quit→reload復活なし、実練習でnormal統計不変を確認。収集は3／3／3／1個、結果148／88／62／8点。全pageerror0。画面はfullpageではなく通常viewport、source/buildは操作前にbeforeへ保存。run中のgameplay/source04変更なし。

このcollectorは説明やPortalの実navigation、heldEnterの画面跨ぎ、native touchCancel、投の途中resizeを実操作では確認していない。cancel／repeat／heldEnter freshnessと強化上限は27対象unitで別に検証している。独立Visual／Gameplayと物理端末は別確認であり、本QA成功をそれらへ読み替えない。

## 独立Visualで見つかった横画面の水域clip

source04の通常操作4画面PASSとは別に、独立レビュアーが [landscape原画面](QA/e32070781326/2026-10-07T19-33-02.637Z/landscape-winding.png) の水域がviewportから切れていることを観測した。旧source・compiled・画像を保存し、別finding `landscape-water-field-clipping` のONE Dを実送信。独立の実DOM測定ではmain764px、water260.8–607.3px、canvas264.8–542.3px、viewport844×390／scroll0で、画面外にフックが出るown landscape grid問題だった。

Root承認後にHTMLのsummary/actions groupingと当ゲームのlandscape CSSだけを変更し、画面高さから縦横比を保った水域幅を算出、上側に固定、HUD／44px dockを確保し、補助upgrade／noteだけを個別scrollにした。共有64px設定bar／model／input／save／描画座標／物理／scoreは不変。[SOURCE_FREEZE_05](QA/SOURCE_FREEZE_05.json) は変更2fileを記録、check／27unit／isolatedbuild成功。全4画面の再実操作、field boundingbox／ancestor clip／active hit検証と独立Visualの最終合格はこの時点では未確認。

## 未確認

独立Visual／Gameplay判定、補足UI実操作、Root統合・本番公開・候補表更新・Worker登録。作者本人の主観試遊と実スマートフォン実機試遊は未実施で、自動QAや独立AIレビューへ読み替えない。

## source06 最終compiled通常4画面QA（20:13UTC）

source05の最初の320×740検証ではPauseボタン下端679.5pxが64px予約境界676pxを3.5px超えたため停止し、before／compile／DOM／trace／synthetic savedstate／画像を [初回原本](QA/e726051c3536/2026-10-07T20-08-55.153Z/manifest.json) へ保持。Root独立担当が既存Dのviewport budgetと同原因のfollowupと判断した後、当ゲームの短いportrait CSSだけを変更し、水域wrapper上限288px、dock上余白8pxへ限定した。source05と06の差はstyle.cssだけで、model／input／save／物理／得点／結果は不変。追加Jev APIは呼ばず、27対象unit／check／isolated build成功を [source06](QA/SOURCE_FREEZE_06.json) と [build06](QA/BUILD_FREEZE_06.json) に固定した。

[20:13UTC通常4画面原本](QA/b86bddf46f9c/2026-10-07T20-13-00.460Z/manifest.json) は要求どおり1365×900、390×844、320×740、844×390で成功。通常投→左右操作→休憩停止→帰還一度入金→reload明示再開→今日は帰るの結果→retry→明示quit／reload復活なし→任意実練習でnormal統計不変を確認。回収3／1／3／3個、結果34／8／94／92点、全pageerror0。全水域がviewportおよびclip祖先内、active dockが44px以上かつ64px設定bar予約領域より上でhitすることを実DOM確認した。

collector09はnative説明→戻るを全4画面、PC heldEnter／repeatのタイトル→本番跨ぎで自動投なしとfreshEnter投、途中休憩の高さ+40px resizeでmodel不変を全4画面確認。390pxではpaused水域へのtrusted CDP touchCancelがmodelを変えず復帰できた。このcancelは巻き上げ中のexplicit pointercaptureを証明しない。操作前exactsource／build／collectorをbefore保存、通常入力のみでmodel注入なし。終了後browser/contextを閉じsource06 hash一致を再確認した。[最終まとめ](QA/NATIVE_FINAL_SUMMARY.json)。

これは自動Chromiumの技術確認で、独立Visual／Gameplay、本人の面白さ、実スマートフォン試遊、Root統合／本番公開／Sheet更新と区別する。これらの独立・公開結果はRootが追記する。

Root integration 2026-10-07T20:18:52.731816+00:00:27target/root695tests65files/check/build andWorkeractualD135events11RUN PASS. Finalsource06 identical, ordinarynative four requiredviewports surface→result/retry/save/practice PASS; independentactualPC/phone result/end+ascendingnativecancel/pausedresize/heldEnter andVisual81 F12 H12. Source05smallphone3.5px dock reservation followup preserved, ownCSS-onlyrepair andnewfreeze06; sameknownD viewportbudget no duplicateAPI. PublicCI/version/ordinarynative andSheetA42 pending. New own namespace, oldgames/save unchanged; Ads/CREDIT/auth/D1schema unmodified; productionworkerblockednewremoteOFF; subjective/physicalunperformed.
