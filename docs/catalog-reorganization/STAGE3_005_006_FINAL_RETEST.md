# 005／006 最終候補の限定再検証

2026-10-15 UTC。固定 `/workspace/arcade-stage3-final` HEAD `a32344b8185e8ffb4eb80e92f2a687ecca294f6c`、DEV4176。desk_rainがnative Playwright click/tap/keyboardで実行。runtime・score・time・保存の直接変更なし。読み取り専用inspectionは進行待機と生データ採取だけに使用した。005CSS修正と4作best_update追補には参加したため、修正Visualの独立判定はArt Directorへ依頼した。

[02 REPORT](QA/stage3-005-006-final-visual-02/REPORT.json) は22 check PASS、pageerror 0、書込み要求 0、対象source前後SHA一致。全browser/contextをcloseしてMainへ枠返却済み。今回の限定再検証は、c057での全4画面8case・475成功assertionの[元証拠](QA/STAGE3_005_006_COMBINED.json)を置換しない。

| 対象 | 通常操作と実測 |
|---|---|
| 005 390×844 | 練習2操作→本番8正解FEVER→3miss結果。scorebar下端170＝board上端170。共有controls幅302＝result内容幅302、共有button128×44で1行。 |
| 005 844×390 | 同操作。scorebar下端98＝board上端98。共有controls幅266＝result内容幅266、共有button128×44で1行。自然高さで縦scrollを許容。 |
| 006 全4画面 | 1440×900／390×844／320×720／844×390のtitle上部BEST V3を実画像で採取。 |
| 006 desktop | 通常Spaceで角度4.051718°／強さ54.471834%を確定。driven120.786911でCを1回、native pause/resumeを経て実駐車1台・110点・GOOD・余裕5.571777px。切返し前後のposeと予測線、到達座標はREPORT.motionに保全。 |

005のmotion-a/bは250ms待機を挟んだ実連番で、読み取り時刻の実差390は0.3333秒、844は0.4167秒。FEVER残秒はそれぞれ5.85→5.5167／5.8501→5.4334へ自然進行した。スクリーンショット採取時間も含むので、250msぴったりの映像とは記載しない。

[390 FEVER](QA/stage3-005-006-final-visual-02/005-390-fever.png)／[390 result](QA/stage3-005-006-final-visual-02/005-390-result.png)／[844 FEVER](QA/stage3-005-006-final-visual-02/005-844-fever.png)／[844 result](QA/stage3-005-006-final-visual-02/005-844-result.png)。同dirの `005-{390,844}-motion-{a,b}.png` が連番。006は[駐車前](QA/stage3-005-006-final-visual-02/006-desktop-motion-corrected-paused.png)と[駐車後](QA/stage3-005-006-final-visual-02/006-desktop-motion-parked.png)、`006-{1440,390,320,844}-title-label.png` が新ラベルの実画像。

初回[01 REPORT](QA/stage3-005-006-final-visual-01/REPORT.json) は失敗記録として保存した。005のbutton幅140以上というcollector仮閾値が128×44の1行ラベルを拒否したため、仕様に対応した幅100以上／高さ48以下へcollectorだけ変更。006追加recordVideoはheadlessでpower54%の離散表示pollが15秒timeoutし、許可済の駐車前後still＋進行rawdataへ変更した。01を成功扱いせず、2findingのJev実送信HTTP200と回答未読の調査判断／annotateを同dirへ保全した。連続006動画によるG技術評価は未実施。付属FFmpeg取得が403だったため既存system ffmpeg7.1.5をテスト環境cacheパスへ接続したが、ゲームsourceへの変更はない。

006は前QA c057から[差分](QA/stage3-005-006-final-visual-02/GAME006_SINCE_PREVIOUS_QA.patch)が既存newBest条件下のbest_update1行とHTMLの静的V3ラベルだけ。ParkingRun／physics／入力／CSSは不変で、前回4画面の成功をこの変更範囲に対応付けた。

数値・実画像の採取をVisual得点や人間Feelの合格へ読み替えない。Art Directorへ新画像を直接送付済み。本人試遊、物理スマホの親指操作、実機聴感、006連続motionの審美判断は未評価のまま維持する。公開workflow／配信hash／最終統合判断はMain所有。
