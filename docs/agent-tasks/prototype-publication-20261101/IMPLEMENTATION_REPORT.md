# 改修・GAPS統合・公開準備報告（未push/未公開）

ゲームソース: `9252ffadcb6238e406aa508e6004d0345c79f6d6`。branch: `codex/prototype-publication-20261101`。基準main: `6211019f64a6946d632a9b3620de24a03505410d`。

**22作品の公開候補を準備。048ネオン急便1作品は保留。** ローカル本番buildでは旧28＋新22＝50作品、完成9/試遊41。GitHub/main/本番は今回まだ変更していない。ソースは全23候補を保全し、048はpublic build対象から外した。

## 変更と統合

詳細は[INTEGRATION_NOTES.md](INTEGRATION_NOTES.md)。作者revision02＋040r3を基に改修し、提供されたGAPS WAVを旧ゲーム内容で上書きせず再接続。64WAVは原本hash一致。041のnative段階音/046のnative音も保ち、046操作音は両経路を半減した。GAPSを今回Windowsで新規生成したとは記録しない。

ImageGen主要素材25点（0468/0484/0606/0617）を実生成し、指定Pixelizer CLIのpin d740fb083ce658fd0cfa304643deb417b9728b17で処理。050は提供された原画像8点をPixelizer変換。原本・prompt・処理report・alpha/寸法/hash台帳を保存。062は元のCanvas手描き素材。ImageGen制作済みと偽らない。

050〜059は提供ZIP全hash検証後、配布JSから復元。元TS/mapsは存在しない。051のモデル/入力block原本byteを保持する回帰検査あり。実装に失われたTSが戻ったと説明しない。

## 作品別

|ID|作品|今回の実測・確認|公開扱い|
|---|---|---|---|
|game040|お掃除、火力高めで。|mouse本番clear61187 / 最大23連鎖 / 満タン22射|試遊版候補|
|game041|金脈、ぶち抜け。|PC安全/戦闘・touchの40列clear。3100対20770490点|試遊版候補|
|game042|一閃、まとめて。|4幅の起動・通常主要入力・休憩/再開。深掘り完走・人間評価は未実施|試遊版候補|
|game043|ギリギリ、ぜんぶボーナス。|4幅の起動・通常主要入力・休憩/再開。深掘り完走・人間評価は未実施|試遊版候補|
|game044|囲って、お宝どっさり。|4幅の起動・通常主要入力・休憩/再開。深掘り完走・人間評価は未実施|試遊版候補|
|game045|反射で全滅！レーザーディスコ|PC/touch12面clear、22射/残26|試遊版候補|
|game046|ピンボール、出力1000％。|31秒native、最大53combo/180粒子、p95約0.8ms、停止後音源0|試遊版候補|
|game047|雪玉、規格外。|mouse拡張mapclear131604点/HP3、縮尺×0.32を実画面確認|試遊版候補|
|game048|ぶら下がれ！ネオン急便|39unit/4幅smoke。通常input本番列2回失敗、公開保留|保留|
|game049|アンコールは、爆音で。|touch80PERFECT/0MISS/80combo、3衣装、最初8combo変身|試遊版候補|
|game050|帰り道も、必殺技。|PC/touch48体/HP3/18360点clear|試遊版候補|
|game051|残業は、分身に任せた。|PC/touch9trios+9pairs/13500点clear|試遊版候補|
|game052|寿司、そろえて一丁！|4幅の起動・通常主要入力・休憩/再開。深掘り完走・人間評価は未実施|試遊版候補|
|game053|横滑りで、根こそぎ。|4幅の起動・通常主要入力・休憩/再開。深掘り完走・人間評価は未実施|試遊版候補|
|game054|クレーン、一個じゃ帰れない。|4幅の起動・通常主要入力・休憩/再開。深掘り完走・人間評価は未実施|試遊版候補|
|game055|ケーキ、ピタ斬り。|4幅の起動・通常主要入力・休憩/再開。深掘り完走・人間評価は未実施|試遊版候補|
|game056|先頭交代！からくり突撃隊|4幅の起動・通常主要入力・休憩/再開。深掘り完走・人間評価は未実施|試遊版候補|
|game057|金庫ごと、ひっくり返せ。|4幅の起動・通常主要入力・休憩/再開。深掘り完走・人間評価は未実施|試遊版候補|
|game058|もちねこ、伸縮自在。|4幅の起動・通常主要入力・休憩/再開。深掘り完走・人間評価は未実施|試遊版候補|
|game059|怪盗、あと一個だけ。|4幅の起動・通常主要入力・休憩/再開。深掘り完走・人間評価は未実施|試遊版候補|
|game060|雷、予約しました。|PC/touch20400点S、6体同時8回、boss撃破|試遊版候補|
|game061|ずらして、全段ぶち抜け。|PC/touch14920点S、全6室/6射|試遊版候補|
|game062|ワープ救助隊、全員まとめて！|PC60人21200点S、touch59人18600点A|試遊版候補|

## 検証

- `npm run check` PASS。
- `npm test` 最終152files/1288tests PASS（logs/unit-final-1288.log）。
- Offline Jev25件 PASS。外部API未使用。
- `npm run build` PASS。既存Game018のand( CSS警告とPhaser>500k警告は既存ソースを変更せず区別。
- 本番modeのローカルHTTP検証 `QA/production-site-1793537883710/report.json` PASS。新22起動・44px操作・診断hookなし・一覧帰還、50カード/AND/お気に入り保持、旧28canonical URL200、削除/保留/037/048は404。
- 各作品4viewport（1280×720/390×844/320×568/844×390）のsmoke。初回失敗と修正/テスト設定の分類をQA_CLASSIFICATION.jsonへ保全。
- PinballはLinux headless Chromiumで約31秒/1868samples、p95約0.8ms。実コンボ53/粒子上限180、GAPS136再生、休憩後GAPS/nativeとも0。物理端末性能・聴感の値ではない。
- 独立VisualはINDEPENDENT_VISUAL_REVIEW.md。060小文字はP2。048は実装者自身の観測と区別。人間の面白さ/実機/聴感は未認定。

## 未解決と公開条件

048は元modelの係数を保つ別コースでモデル解があっても、native同時刻列が2回失敗。到達不能・人間不合格と断定しないが、モデルPASSをブラウザPASSへ読み替えず本番保留。コード/素材/入力tick/失敗JSON/39unitを保全し、追加の判定拡大・成功捏造を行わない。

今回のremote前費用確認: PUBLIC、既存ubuntu-latest、既存Pages、artifact0/cache49,449,992Bを確認。Webhookとaccount billingは403。過去の個別了承を流用せず、今回に限る不明点の了承前で止める。新規有料サービス、API、Runner、プラン/課金/Webhook設定は変更していない。

GitHubへの通常branch push→PR/自動CI→安全なmain統合→Pages1回→本番確認が残る。現時点にPR URL/本番成功は存在しない。

## 保護・限界

既存001〜038の製品source/保存、共有onboarding、AdSenseタグ/Publisher/CMP、privacy/ads.txt、GA4/Telemetry設定、RecordSharing、Worker/D1、CREDIT、Actions設定は不変。031保留と削除4を維持。037/039は新規登録しない。新作ランキングやWorker登録を勝手に追加せず、各ゲームの個別BESTを使う。

実Windows起動・iPhone/他機種・音の聴感・人間の面白さは作者確認待ち。Windows path/POSIXの配布server境界は2unitで検証したが、Windows実機成功とは報告しない。AdSense再申請は未実施。

ローカル成果物はGitHub backupではない。/tmpは永続保証なし。費用/トークン/取得不能作業時間はnull。
