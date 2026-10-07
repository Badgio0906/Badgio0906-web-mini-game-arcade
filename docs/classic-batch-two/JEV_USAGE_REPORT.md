# 第2バッチ Jev実利用・証跡監査

2026-10-07 UTC。対象はGame026〜030と今回の共通practice-navigation finding。**既存証拠のoffline監査だけを行い、新規API呼出し・再レビュー・過去ログの変更は行っていない。** 以下は監査時点の28件であり、後から新しいfindingが出た場合の呼出しを含めない。

## 確認した実利用

コピーを除いた実request記録は **28件**（026=4、027=4、028=8、029=5、030=6、shared=1）。17ログ・39行から同じtimestamp/game_id/finding_id/checkpointの11コピーを除外した。コピー間の回答・注釈の相違は0件。過去001〜025のログは集計に混ぜていない。

28件すべてで `api_attempted=true`、`status=AVAILABLE`、`http_status=200`、requested `typesafe/jev-1.13`、resolved `typesafe/jev-1.13-20260917` を確認した。PRIMARY_CAUSE/NEXT_EVIDENCEは全選択肢の有限な0〜1確率と合計1（helper許容差±0.02）、有効selectedを持ち、残り2問のnoulも有限な0〜1だった。**ログの存在やinvocation件数だけから成功とは判定していない。** 保存されたhelper metadataと有効な4回答を根拠とする。Provider側の原本ログ・請求明細への照会は行っておらず、秘密保護のためraw HTTP本文も保存しない既存helperの証拠範囲には限界がある。

4問は次の役割に限定した。

| 問い | 調べる内容 |
|---|---|
| PRIMARY_CAUSE | 製品・テスト基盤・仕様・Visual/Feel・UNKNOWNのどこから調べるか |
| CODEX_ACTION_REQUIRED | 追加調査／修正が必要か。QA省略許可ではない |
| NEXT_EVIDENCE | 最初の追加証拠の候補。実画面／実プレイの代行ではない |
| RELEASE_RISK_IF_UNRESOLVED | 未解決の重大リスク信号。公開許可ではない |

28件とも4つの独立判断、reviewer/rationale/evidence、実際の次作業method/description/evidence、request以後のannotate時刻を保持している。回答・独立判断から再計算した比較は保存済みcomparisonと28件すべて一致した。証拠参照は作者treeを含め実在を確認し、関数名を伴うsource参照とディレクトリ参照をファイルそのものと混同していない。現時点で作者treeだけにある8件のログにはJSON内で正式コピー予定先も明示し、コピー済みと偽っていない。

## 比較結果と解釈

| 指標 | 記録上の結果 |
|---|---:|
| PRIMARY_CAUSE一致 | 22 / 28 |
| CODEX_ACTION_REQUIRED一致 | 28 / 28 |
| NEXT_EVIDENCE選択一致 | 13 / 28 |
| RELEASE_RISK_IF_UNRESOLVED一致 | 19 / 28 |
| CODEX FALSE PASS | 0 / 28（0.45未満の対象は0件） |
| RELEASE RISK MISS | 0 / 28（独立risk=true 8件） |
| Risk比較 TP / TN / FP / FN | 8 / 11 / 9 / 0 |

上表は不要だった026の1呼出しも隠さず含む全実requestの比較。schema-only1件を除いた27件ではPRIMARY22/27、NEXT12/27、action27/27、risk18/27となる。C/Fは同じfindingの異なる当時観測で、28requestに対する異なるgame/finding組は27組。

全件が「追加作業必要」で、noulは0.80〜0.91。**低値からQAを安全に省略できる事例は今回0件**であり、FALSE PASSゼロを省略有効性の実証には使えない。閾値は既存0.45/0.5のままで、今回の結果へ合わせて変更していない。独立Codex判断も普遍的正解や人間の感想ではない。

NEXT_EVIDENCEの15不一致を、そのまま誤答15件とはしていない。例えば返球silhouette問題のSCREENSHOT_REVIEWと数値projection検証、menu touchのLIVE_INTERACTIONと実production binder回帰は、同じ疑問を減らす合理的な別手段になり得る。選択一致、実行した方法、代替の有効性を区別する。Jevを先に採用した比較実験は行っていないため、Jevの方法が実際に必要な証拠へ到達しなかった事例数／有効代替だった事例数は**未確定**とする。後半のroute-lengthでHUMAN_FEEL_TESTが1件提示されたが、実際の人間試遊は未実施で、独立側はまず長さ／clearanceを検証した。本人の楽しさを数値モデルで代替していない。

実際の作業記録から修正・検証は確認できるが、Jevの推薦がその選択を起こしたという因果的な「採用」フィールドはない。独立した手順が必要だったため、API回答と実作業の一致をそのまま工数削減へ読み替えない。Jevのnextと実際methodの一致数はJSONに別記した。

## 履行上の不整合・証拠の限界

1. **026で1件、不要な呼出しがあった。** `game026-independent-snapshot-observer-shape` はread-only observerの直接的JSON field不一致で、schema-only除外に該当する。実API件数には含めるが、適切なfinding routingとは扱わない。[当時の逸脱記録](../game026/QA/independent/final-live-01/CALL_SCOPE_DEVIATION.json)を保持する。したがって28件すべてが手順適合という説明はしない。
2. **029で必要なfindingにShadowを行う前に修正した。** 最大深度／最もレアな拾得物のResult欠落は、当時Jev呼出し・immutable before保存をせず追加済み。[作者の手順欠落記録](../game029/QA/PROTOCOL_LIMITATIONS.md)に明記されている。28件は、この未呼出しfindingを含まない。今から呼び「当時実施」とすることはしていない。
3. **初回failure原本に欠測がある。** 028初回no-returnの正確なreturn count、027最初の60shot終了時full world/DOM、028seed復帰のbefore-reload snapshot、030初回hintの精密touch時間・座標・hit-test等の不足は、stateのunknownと元manifestに残す。後のrich collector／診断を当時の原本と呼ばない。
4. **029pauseの早期説明を後から訂正した。** 当初0.2ms失敗と後の116.2ms成功からtouch長さを原因と説明したが、tap順序とdurationが交絡していた。100.5msの最初のtouchも失敗した新観測をFで保存し、独立UNKNOWN/risk=trueを保持している。後の同一prefix・fresh context二群でdrag dwellだけを変え、83.2ms armはclickなし、149.8ms armはclick1・depth91mを400ms固定したことから、**この自動操作でのcollector timing**を支持した。[後段の独立記録](../game029/QA/independent/phone-pause-01/controlled-drag-dwell-later-disposition.json)は別に保持し、C/Fの比較値を再編集していない。各群1回でありChromium内部原因と実機高速touchは未確定。
5. **証跡出力先の局所上書きが1件あった。** 026公開済みPROTECTIONの時刻行を027確認が一時上書きした後、公開Git原本から復元し、新027確認を別pathへ保持した。[訂正記録](QA/integration027/release/EVIDENCE_PATH_CORRECTION.json)。元の9保護treeの照合結果に差分はないが、出力先再利用がなかったとは記さない。

独立ラベルのPRODUCT_ISSUE→PRODUCT_BUG等は[語彙正規化記録](QA/review/BLIND_JUDGMENT_LABEL_NORMALIZATION.json)があり、原因・risk・時刻や元判定を変更したものではない。`blind`／`jev_answers_read=false`という独立側の明示記録を確認したが、本監査は全担当の当時tool transcriptを持たないため、全読込順序を独立に証明するとは言わない。**今この監査でMDを読んだことと、実装開始時に読んだことは別**で、今回の読了確認時刻・commit・ファイルhashはJSONに記録した。

## 使用量・未確認

APIが報告した28件分はinput **46,546 tokens**、output **6,039 tokens**、cost **$0.001954932**、平均request latency **約0.374秒**（全28件で欠測なし）。これはJevのnative usage／request wall-clockであり、Codex費用、バッチ経過時間や並列作業時間ではない。Codex時間／tokens削減、Jevの有無による開発比較、Human享受評価は未計測。人間の評価記録0件、実機スマホの主観評価は未実施。通常の独立Visual／実操作QAと公開確認は別証拠で判断する。

再発防止は、schema-onlyを送信前に除外し、意味のあるfindingは修正前に最低限のbeforeを一意pathへ保持し、交絡した「通った」を原因確定としないこと。今回は既存28件を監査しただけで、改善用APIや再レビューは追加していない。

## 実request一覧

すべてUTC 2026-10-07。各行はAPI1回・4回答。詳細な4回答・確率・model/http・独立判断・実作業・証拠解決先は[機械可読監査](QA/JEV_METADATA_AUDIT_FINAL.json)に収録した。

| UTC | 対象 | finding / checkpoint | ログ |
|---|---|---|---|
| 17:52:35 | game028 | `028-normal-native-no-return` / C | [QA](../game028/QA/JEV_SHADOW.jsonl) 行1 |
| 17:54:04 | game029 | `game029-practice-production-events` / C | [practice-production-01](../game029/QA/independent/practice-production-01/JEV_SHADOW.jsonl) 行1 |
| 17:54:52 | game026 | `valid-json-memory-fallback` / B | [QA](../game026/QA/JEV_SHADOW.jsonl) 行1 |
| 17:58:17 | game026 | `denied-write-retry-01` / C | [denied-write-retry-01](../game026/QA/independent/denied-write-retry-01/JEV_SHADOW.jsonl) 行1 |
| 17:59:02 | game029 | `phone-pause-after-drag-01` / C | [QA](../game029/QA/JEV_SHADOW.jsonl) 行1 |
| 18:00:32 | game028 | `game028-semantic-corruption-memory-reset` / C | [semantic-storage-01](../game028/QA/independent/semantic-storage-01/JEV_SHADOW.jsonl) 行1 |
| 18:00:33 | game029 | `game029-semantic-corruption-memory-not-latched` / C | [semantic-storage-01](../game029/QA/independent/semantic-storage-01/JEV_SHADOW.jsonl) 行1 |
| 18:00:53 | game028 | `028-native-scroll-measurement` / C | [QA](../game028/QA/JEV_SHADOW.jsonl) 行2 |
| 18:06:22 | game030 | `passive-stage-selector-save` / A | [QA](../game030/QA/JEV_SHADOW.jsonl) 行1 |
| 18:07:41 | game028 | `game028-racket-render-model-width` / C | [racket-render-01](../game028/QA/independent/racket-render-01/JEV_SHADOW.jsonl) 行1 |
| 18:10:03 | game026 | `bottom-overlap-marker-clipping` / D | [QA](../game026/QA/JEV_SHADOW.jsonl) 行2 |
| 18:10:38 | game030 | `late-route-length-choice` / A | [QA](../game030/QA/JEV_SHADOW.jsonl) 行2 |
| 18:13:04 | game027 | `game027-semantic-storage-rejection-not-latched` / C | [semantic-storage-01](../game027/QA/independent/semantic-storage-01/JEV_SHADOW.jsonl) 行1 |
| 18:13:32 | game027 | `game027-phone-paused-title-tap` / C | [QA](../game027/QA/JEV_SHADOW.jsonl) 行1 |
| 18:13:32 | game027 | `game027-phone-ball-numerals` / D | [QA](../game027/QA/JEV_SHADOW.jsonl) 行2 |
| 18:15:00 | game028 | `028-save-terminal-invariants` / B | [QA](../game028/QA/JEV_SHADOW.jsonl) 行3 |
| 18:15:11 | game026 | `game026-independent-snapshot-observer-shape` / C | [final-live-01](../game026/QA/independent/final-live-01/JEV_SHADOW.jsonl) 行1 |
| 18:19:27 | game030 | `final-selection-return-state` / A | [QA](../game030/QA/JEV_SHADOW.jsonl) 行3 |
| 18:25:05 | shared | `practice-origin-portal-production-navigation` / C | [practice-navigation-01](QA/review/practice-navigation-01/JEV_SHADOW.jsonl) 行1 |
| 18:26:12 | game029 | `phone-pause-after-drag-01` / F | [QA](../game029/QA/JEV_SHADOW.jsonl) 行2 |
| 18:26:35 | game030 | `game030-stable-memory-fallback-contract` / C | [stable-memory-fallback-01](../game030/QA/independent/stable-memory-fallback-01/JEV_SHADOW.jsonl) 行1 |
| 18:27:19 | game030 | `plug-drawn-footprint-clearance` / A | [QA](../game030/QA/JEV_SHADOW.jsonl) 行4 |
| 18:42:20 | game027 | `game027-normal-terminal-qa-bound` / C | [QA](../game027/QA/JEV_SHADOW.jsonl) 行3 |
| 18:52:22 | game028 | `028-menu-touch-release` / C | [QA](../game028/QA/JEV_SHADOW.jsonl) 行4 |
| 19:03:59 | game028 | `028-native-seed-restore` / C | [QA](../game028/QA/JEV_SHADOW.jsonl) 行5 |
| 19:20:10 | game030 | `phone-hint-first-post-drag` / C | [QA](../game030/QA/JEV_SHADOW.jsonl) 行5 |
| 19:24:56 | game028 | `028-landscape-control-overlap` / C | [QA](../game028/QA/JEV_SHADOW.jsonl) 行6 |
| 19:36:50 | game029 | `landscape-water-field-clipping` / D | [QA](../game029/QA/JEV_SHADOW.jsonl) 行3 |
