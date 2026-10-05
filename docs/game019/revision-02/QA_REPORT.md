# Game019 改訂02 — 独立native QA

**本番のジャンプ・7練習・全4画面・200m到達、および保存統計修正後の限定再検証を含むローカル技術QAはPASS。** 人間の面白さ、実機評価、公開配信をこのローカルQAから合格にしない。

独立担当は `tests/game019/review-charge.mjs` を作り、固定した dev `http://127.0.0.1:5196/game019.html` を通常キー／native CDP multi-touchで検証した。DEV `__game019` はcheap readonly、forecastは接地時だけ別getterを読む。チャージ中に重いforecastをpollせず、時刻・座標・level stateを注入しない。

## 採用した検証

| 画面 | 実到達／7練習 | 採用source／collectorの状態 |
|---|---|---|
| PC 1440×900 | 200m、59跳躍、7練習 | 初回と最終desktopで200m。collector末尾のdeep-case assertは未実施caseの問題。27.5m実落下／同RUN再登りはcontrolled原本で別に成立。 |
| phone 390×844 | 200m、66跳躍、7練習 | 初回collector全PASS。13.9m/3.7m/4.2m catch、保存・再読込まで実施。 |
| 320×568 | 200m、54跳躍、7練習 | 初回collector全PASS。安全分岐／保存・再読込まで実施。 |
| 横844×390 | 200m、54跳躍、7練習 | 初回titleの練習が枠外という実不足を修正後、全collector PASS。 |

[SUMMARY](QA/final-independent/SUMMARY.json)はcase coverageとcollector statusを別フィールドで記録。FAIL原本をPASSへ変換していない。全browser contexts／browserを終了した。

## scopeとhash

3実行とも実行内source SHA-256前後一致。対象は019のHTML、全runtime TS/CSS/manifest、StorageService/TelemetryService、旧共通font、新019fontとfont index。初回からcontrolled/最終desktopへの変更は `src/games/game019/style.css` だけ。短横画面用のtitle媒体条件に8行追加した修正で、PC／phone／320の物理・入力・保存・素材・fontは同一。

初回phone／320の合格を保持し、新CSSの横画面を全再検証、PCも全経路を再確認した。same-sourceの各caseを組み合わせる理由を集約へ残した。このsnapshot以後の019専用統計保存修正は、下記の別変更／限定再検証として記録した。過去の実行hashを上書きしていない。

## 入力・導線・状態

- 初回から「すぐ遊ぶ／説明を見る／練習する」。説明から戻り、練習を実行。7段階は短・中・最大・左・右・空中逆入力・短右準備→長左の実着地で完了。本番run_start/BESTは練習で増えない。
- 本番長押し1000msでもcharge=700、発射0。pauseで取り消してから再開。PCのrepeat、header buttonにfocusしたSpaceでもゲームへ発射を持ち込まない。
- phone native pointercancel、PC blurで取消。方向の左右同時押しは真上、touch複数接点のJUMP releaseは1回。捕捉したpointerをbutton外へ移動して離しても1回発射。
- 一時停止中のrun snapshotが150ms後も完全一致。RESTARTはpause内の明示確認からだけ実行。取消して継続と確認して0m開始を検証。
- visibilityはdocument.hiddenをQA環境で明示注入したlifecycle試験であり、実タブのvisibility切替を検証したという主張ではない。取消／pause／キー持越しなしを確認。
- 主要controls44CSSpx以上、viewport・overflow祖先clip・中心hit-testを確認。長い説明はmenu内scroll。短横titleの開始3択は修正後全て初期viewport内。

## 物理・map・展開

壁／梁、短い位置合わせ、狭い石、苔、ひび石、動くバケツ、安全／近道、25/50/75mのcatch、100m海鳥、章2、200m宇宙を通常入力で辿った。風eventでleft/right/up/down、weak/medium/strongの全種を観測。練習の逆入力後150msでもvx不変。手作り地形・風とtakeoff固定の実装をsourceへ照合した。

実際の戻り量は0、3.7、4.2、13.9、27.5、55m。全てaliveの同RUNで続き、catch使用と再登りを記録した。55mの例は不足チャージで100m岸へ落ちた後、controllerの未知棚索引が誤り再登りを実行しなかった。製品の到達不能ではなく、forecastから104m sky-startへ物理的に戻れる。最終collectorは全ledgesを高さによるfallbackとして扱うよう修正した。

最大700msのみの有限モデルreplayは112試行/38状態、20m着地0。単体・全route/toleranceのモデル結果はrootの別QAへリンクし、このnative確認で実行したと偽らない。

## 保存・計測

phone/320/横で本番200m BESTとmuteを再読込で維持。PC/phoneでは旧BEST834dmと旧practiceCompletedをseedし、BESTを保ちつつ新練習完了へ読み替えない。保存getter拒否、破損値でも実ジャンプ／終了／再開始が可能。rootの共有StorageServiceは変更していない。

PC primary collectorはdeep assertで停止したため、最後の200m retry/reload部分は未実行。PC旧834dm／mute／拒否／破損の境界はPASS、同じ保存sourceのphone/320/横では200m reloadまでPASS。これを全4画面で同じreloadを完了したという表現にしない。

観測eventはジャンプ毎に200件diagnostic windowから採取して結合。400件を超えるQA観測列とゲームの端末400件保持を混同しない。phoneの実入力400件sampleは [phone-observed-events](QA/final-independent/phone-observed-events.json)。合成fixtureでも人間プレイの統計でもなく、native controllerによるローカルQA観測である。

**保存統計の実バグと解消**：`bestClearSeconds`／`lifetimeFallMeters`へ小数をwriteし、整数専用`StorageService.readNumber`で再readしていたため、次のRUNでfallback0となっていた。rootは019専用の`bestClearMs`／`lifetimeFallDm`整数保存へ修正した。独立静的監査で変更は`main.ts`のimportと2呼出箇所、追加`stats.ts`のみと確認した。物理・入力・map・Board・HTML・CSS・fontは直前の全RUNと同一hashである。

保存blockerは [静的scope監査](QA/final-independent/STATS_STATIC_REVIEW.json)、[実StorageServiceの3単体](../../../tests/unit/game019-stats.test.ts)、rootの [compiled4画面限定再試験](QA/production-root-retest/report.json) で閉じた。12.37m＋8.24mの再読込累積206dm、123.4567秒→123457ms保存と遅い記録の拒否／速い記録への置換、旧BEST／mute維持を実StorageServiceで確認した。compiled版はDEV hookを含まず、通常入力で各20mへ進み、終了保存後のfallDmがPC90、phone／320／横101で、再読込後も完全一致した。console／HTTP errorは各0、配信JS／CSS／font／thumbnail hashもdist一致した。

この限定再試験・単体・build／型検査はroot実行の証拠を独立担当が読み、合格内容とsource差分を監査したもの。全294単体／32files、型検査、buildは [ログ](QA/all-unit-final.log)、[型検査](QA/check-final.log)、[build](QA/build-final.log) に保存されている。clear-timeの小数保存は実StorageService単体で確認し、compiled版200mを新たに完走したと主張しない。初回productionのHUD更新前readと固定入力列の失敗も [分類](QA/production-first-failure.md) と原本へ保持している。物理／入力が不変のため全200mを繰り返していない。

## 失敗原本と判定

1. 初回PC：100msの狭い大転落候補に対し実83msで同棚に着地。200m自体は到達。検証経路の選択不足。
2. 初回横：titleで練習buttonが枠外。**製品responsive導線不足**。rootの短横CSS修正と横全RUNで解消。
3. controlled PC：155mの頂点余裕0.22m候補が実383msとなり55m落下。落下は仕様通りだが100m岸をrouteに含めないcollectorが位置合わせを反復。未知実棚fallbackを修正。
4. 最終PC：200m再到達後、大転落候補が条件に合わず実行されていなかったというcoverage assert。既存controlled27.5m落下／同RUN再登りとphone13.9mを用いて当該caseを閉じ、完全RUNを追加し続けない。
5. 保存統計：上記小数／整数の不整合。**製品保存不足**。019限定修正、実StorageService3単体とcompiled4画面の実整数保存／再読込で解消。

[初回compact](QA/final-independent/report.json)／[初回原本gzip](QA/final-independent/report.json.gz)、[controlled compact](QA/final-independent/controlled-fall-rerun/report.json)／[原本gzip](QA/final-independent/controlled-fall-rerun/report.json.gz)、[最終desktop](QA/final-independent/final-desktop/report.json)。gzipは元JSON byte-for-byteを復元できる。元bytes/SHAとdecodedExactMatchは [索引](QA/final-independent/RAW_REPORT_INDEX.json) に記録した。

## 再実行と未実施

```sh
npm run dev -- --port 5196
GAME019_CHARGE_URL=http://127.0.0.1:5196/ \
GAME019_CHARGE_OUT=docs/game019/revision-02/QA/new-execution \
node tests/game019/review-charge.mjs
```

`GAME019_CHARGE_PROFILES=desktop,phone,narrow,landscape` と `GAME019_CHARGE_ROUTE=safe|risk` を指定可。**default出力先は過去report/画像を上書きするので、新出力先を指定する。** source固定を先に宣言し、HMRを伴うruntime変更をしない。

人間の楽しさ・初見学習・親指・実機FPS／音量・BGMの好みは未実施。build/全単体/他ゲームhash監査/production配信はrootの別検証であり、このworkerが実施したとしない。
