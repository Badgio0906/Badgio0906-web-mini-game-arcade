# Game018 — 実装・検証報告

正式タイトル：**靴とばそ ～SHOE FLY HIGH!～**。5種類の靴をANGLE→SPIN→POWERの3回のタイミング入力で蹴り飛ばす、独自Canvasの静的Webゲーム。18本候補のPortal／Viteへ登録済み。公開前引き継ぎ：[PUBLICATION_HANDOFF](PUBLICATION_HANDOFF.md)。公開URL確認は現在のCloud network policyによるHTTP CONNECT403で未実施。017はmain反映・Pages build/deploy成功。

## 実装とゲームループ

初回title→短い説明→必須のANGLE単独／SPIN単独／POWER単独／3操作実飛行の4練習→靴選択→ANGLE→SPIN→POWER→MAX/KICK→物理飛行／イベント→着地→RESULT。再訪は靴選択へ直接進め、再練習可能。RESULTからRetry、靴変更、Portal帰還。練習はscore・BEST・本番runイベント・CREDITを変更しない。

PC click／Enter／Space、phone tap。pointerdownと初回keydownのmonotonic時刻で決定し、長押しrepeat、modifier、secondary pointer、phase跨ぎreleaseを無視。ヘッダーbuttonのSpaceはそのbuttonへ作用する。pause／blur／hiddenで時計・物理を止め、quitは1 RUN1回。DEV診断はreadonlyコピーと純粋simulationのみ、production hookなし。

ANGLEは5–85°の滑らかな往復（周期2.8秒）で、少年の脚・発射矢印・弧を表示。SPINは足元へzoom、左右±1の周期1.65秒、符号と量が安定・drag・lift・回転・貫通へ影響する。POWERは周期1.36秒、0–100–0、100 plateau100ms。JUST MAXは99.5以上、実許容約106ms、PERFECT98以上。ANGLE/SPIN lock各300ms、MAX380ms、KICK600ms、着地650ms。普通のクリックやtapで到達することを検証したが、人間の難度・気持ちよさは未評価。

## 5靴の実性能

| 靴 | 実装した強み | 制限・定量確認 |
|---|---|---|
| PAPER | 軽量、風・lift、高高度、JET STREAM | 地上貫通が弱い。高85°JUSTで約26km高度 |
| ZORI | spin効率1.6、強SPIN安定、spin bonus係数125 | 他靴係数80、距離は中程度 |
| SNEAKER | 中角度の総合距離と標準入力 | 同条件mid JUST約17km、他通常靴約10–12km |
| LEATHER | weight1.8、貫通2.2、低角度BUSINESS MISSILE | 比較条件でground11break、sneaker4、paper0 |
| IRON GETA | weight4.0、最大貫通4.5、精密JUSTで7.5倍初速 | 通常約0.5–0.9km、angle20°/spin.8/100では約51km。適角・spin範囲が必要 |

定量値は[モデルcalibration](QA/model/CALIBRATION.json)の純粋simulationであり、全て同じnative停止入力による比較ではない。nativeレビューの投別実入力・実結果は[Feel報告](GAME_FEEL_REVIEW.md)。靴の形は紙の折り目／草履の鼻緒／sneakerの紐／革靴の踵／下駄の歯を独自vector描画する。

## 物理・ルート・演出

固定1/30秒の軽量疑似物理。位置・速度・gravity・drag・weight・aerodynamics・spin効率・簡易lift・deterministic風を使用。同入力は同軌道。地面交点を補間し、その位置までの距離を表示。低角度・高POWERでは最大3bounce。連続segmentとobstacle AABBを照合し、下降中の屋根も対象。生成はcamera付近最大24、履歴64、effects18、sample上限3600step。

GROUNDはangle25°以下、DISTANCEは25–55°、SKYは55°以上。地上は柵／壁／自販機／看板／無人トラック／倉庫／ビル、実際に通過した物体だけ穴・comic impact・連続BREAK COMBOを描画。高度550m雲、2200m飛行機、6500m UFO、25000m衛星域。飛行機・UFOは人の描写がないコミカルな穴。特殊イベントはWALL BREAK、DRILL THROUGH、HIGHWAY STAR、CLOUD NINE、AIRPLANE BREAK、UFO INCIDENT、ORBITAL SHOE、JET STREAM、TORNADO ZORI、BUSINESS MISSILE、IRON BREAKER。

独立Feelで速いSKYイベントが画面外へ流れ、captionが靴を覆う問題を検出。実際の飛行機／UFO／衛星イベント座標で各550msの表示停止を追加し、captionを高さ18%以内・靴と反対の上下へ移し、靴を最後に描く。元の物理samples・距離・高度・全得点は1890入力のbefore/after比較で不変。最大追加1.65秒、最大飛行24.14秒。停止後は同じ軌道へ戻り、最終位置は厳密な地面交点。[修正・境界失敗原本](QA/model/HOLD_REVISION.md)。

追尾cameraは靴を画面内に保ち、速度で引き、高度で街→空→宇宙、Earth／reentryを表示。発射直後0.9秒まで少年が元のworld座標に残り、cameraが離れる。reduced-motionでshake/washを抑える。Canvas主体で大量DOMや全world生成はしない。実機FPS未測定。

## SCORE・BEST・共通サービス

DISTANCE=floor(x×4)、HEIGHT=floor(maxY×2)、groundBREAK×1200、spin回転bonus（上限10000）、JUST MAX2500、特殊1000／ORBITAL10000／IRON5000を合計。飛行機／UFOのbonusはSPECIALへ計上し、GROUND BREAK countへ混ぜない。練習の全score componentは0。

StorageServiceのgame018名前空間へ全体距離（整数decimeter）、score、5靴の距離BESTを保存。保存拒否時もmemory fallbackでプレイ可能。既存AudioServiceのlock／MAX／kick／flight／break／landingとmute保存、音なしプレイ。音を聴いた人間評価ではない。Telemetryは本番開始・完走・score各1回、quit重複なし。CREDITは既存OFF、将来ON時は本番開始1回消費、rewardは既存開発stubのみ。

## 技術検証と独立レビュー

最終source freeze：`4e491ba21ec7f5b3bcfc86c1b5656e186d7dffc1f22fc94903afc1d19f27bfbd`、301 runtime/public files。[SOURCE_FREEZE](SOURCE_FREEZE.json)。以降の文書やtestsの記録更新はこのhashに含めない。

- `npm test -- --reporter=json --outputFile=docs/game018/QA/FINAL_HOLD_UNIT_RESULTS.json`：248/248、01829件。[原本](QA/FINAL_HOLD_UNIT_RESULTS.json)。
- `npm run check`：成功。[log](QA/FINAL_HOLD_TYPECHECK.log)。`npm run build`：成功。[log](QA/FINAL_HOLD_BUILD.log)。既存Phaser共通chunkの500kB警告は継続、018はPhaserを含まない。
- 修正前最終native PC1440×900／phone390×844／320×568／844×390：4PASS、全初回練習→selection→本番→result→retry→BEST/mute reload→Portal18。[stable-native](QA/stable-native/report.json)。この証拠はSKY hold前。新hold版の独立PC／phone再検証を[Feel](GAME_FEEL_REVIEW.md)へ別保存。
- modifier／長押し／phase跨ぎrelease／pause／focus／quit／storage拒否：2group PASS。[guards](QA/INPUT_LIFECYCLE_GUARDS.json)。hold前の入力・保存証拠、独立QAで変更がないことを確認。
- production root/subpathと017互換回帰・既存modern28経路は最終結果を[VALIDATION_SUMMARY](QA/VALIDATION_SUMMARY.json)に保存。公開URL実表示と混同しない。
- 独立QA：[INDEPENDENT_SOURCE_REVIEW](QA/INDEPENDENT_SOURCE_REVIEW.json)、新freeze301全一致、holdmapping／score保全／readonlycopy／captionlayerを追加確認、新findingなし。
- 独立Visual：[VISUAL_REVIEW](VISUAL_REVIEW.md)。独立Feel：[GAME_FEEL_REVIEW](GAME_FEEL_REVIEW.md)。初回問題と追加検証を別記録する。

修正したfinding：exactphase deadline roundoff、descending roof intersection、narrow/landscape selection clip、Canvas titleと少年の重なり、narrow heel clip、landscape footer clip、着地footer stale MAX、SKY caption/イベント表示時間、hold終点のroundoff。テスト側のselector（親もdata-shoe）、touch navigation待ち、遷移中RAF collectorは製品バグへ変換せず原本を保存。[LESSONS](LESSONS.md)。

## 素材・既存ゲーム・公開

新thumbは実初回練習後の低ANGLE革靴JUST MAX・GROUND貫通原本のみをcrop/resize。640×360、11022bytes、frame合成なし。cameraが離れた後のため少年を別sceneから合成しない。[原本](../../assets/portal/thumbnails/game018-actual-source.png)／[台帳](../../assets/portal/thumbnails/asset-index.json)／[capture](QA/THUMBNAIL_CAPTURE.json)。新font1049文字164428bytes、以前1029文字全保持、既存fallback8記号維持。[audit](QA/FONT_AUDIT.json)。

既存source/core/arcade・001–017HTML/assets・旧export／旧画像385files不変。[保持監査](QA/EXISTING_GAME_PRESERVATION_FINAL.json)。旧Godot3本の操作を今回再検証したとはしない。変更した共有登録はindex meta/fallback、catalog、Vite input、thumb ledger、font subsetだけ。Game018新HTML／src／tests／docs／実thumb原本を追加し、依存・package・core・Feature Flagは変更なし。

Jevは開発CLI限定Shadow、実測・全choice確率・nouls・Codex比較は[JEV_SHADOW_REPORT](JEV_SHADOW_REPORT.md)。Jevだけでレビュー省略・公開判定はしていない。Codex tokens／model／reasoning／料金は取得不可、推計しない。

人間による初見理解・JUST難度・笑い・靴差・Retry欲求・実機親指/FPS/音/酔いは[HUMAN_PLAYTEST](HUMAN_PLAYTEST.md)の未実施項目。技術試作版としての検証と人間合格を分ける。公開後の確認を新Cloud taskに引き継ぐため[PUBLICATION_HANDOFF](PUBLICATION_HANDOFF.md)を正本とする。

最終技術集計：018 production4／017 production4／既存modern28、合計36PASS。独立Visual85/F13/H13、独立最終Feel9投PASS（2269飛行観測点、10実座標hold）。Jev8call、input8510／output1142／USD0.00035742／平均0.370秒、原因6/8、C7/8、H7/8、R4/8。C<0.45候補3件中、通常レビューが問題を見つけた1件（A）。Release FALSE PASS0件はGT positive1件だけの結果。全条件は[Gate](QA/RELEASE_GATE.json)、人間合格と公開実表示は未完了。
