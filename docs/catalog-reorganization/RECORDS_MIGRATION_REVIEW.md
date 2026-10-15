# Stage2 記録移行の独立ソースレビュー

2026-10-15。担当：snake_billiards実装agent。ゲーム024/027/035は担当したが、今回の共通records変更の実装者ではない。rootのJev回答・ログを読まず、findingの同時点観測JSONとソース差分を確認して判断した。判定対象は固定commit `5bd5f03039d1cf3bd6124342f4084cd801dcd78d`。stage3/4の未commit定義追加はこの判定へ含めない。

**Stage2変更について、旧BEST/旧board/有効な既存待機queueを新ルールへの変更だけで失効・削除する経路は解消されている。新旧スコアは別boardで比較される。** 本番Worker/D1への登録確認や通信実測の合格ではない。

| 境界 | 確認内容 | 判定 |
|---|---|---|
| recordDefinitions | 002 r1→r2、003 r2→r3、015 r03→r04、024 r1→r2。旧4boardはhistoricalRecordBoardsに元のmetric/mode/unit/max/assistanceを保持。新boardと連結したrecordBoardsはboard IDで一意。 | 新旧比較を分離、旧定義保持 |
| localRecords | 002 bestScoreV2、003 rules3:best、015 bestR04、024 state-shifting-v2だけを現行として読む。旧キー存在はlegacy表示に使い、値を新版へコピーしない。読み取り関数に旧キー削除/書込みなし。 | 旧BEST不変、新版のみ現行表示 |
| remoteRegistration | game-level pendingは新規run/現在boardの共有UIを閉じる。isPublicBoardRegisteredは同gameのhistorical boardを引き続き登録済みとして扱う。 | 新board準備中と既存boardを分離 |
| PublicBests/Leaderboards | PublicBestsの必須board判定をboard-levelに変更。旧20boardのみの応答を受理し、新boardが未配信でも全体BESTを失敗扱いしない。値のrule/mode/unitは各board定義と照合する。 | 旧API応答を受理 |
| safeSubmission | game IDのみの現行定義取得をやめ、game IDとboard IDが一致するrecordBoards項目で検証。旧rules/mode/valueは旧boardへ通り、旧boardに新rulesを混ぜたpayloadは拒否。 | 旧待機payloadの比較条件を維持 |
| Sharing queue | constructor/validQueuedとsubmitがboard-level登録を使用。旧boardの有効queueはrestored queueに残り、pendingの新boardだけが拒否される。pending replacementが旧queueをinvalidにする経路を確認できない。 | stage2更新だけによる旧queue削除を防止 |

既存のqueue寿命24時間、試行5回、permission epoch/資格不一致、共有OFF、withdraw、非production/破損payloadによる削除方針は以前からの処理として残る。「旧queueを無期限保持する」新仕様へ変えてはいない。旧eligible candidateを新版として送ることもない。新board未登録で個人BESTやゲーム自体を止めない。

独立実行：固定commitから`git archive`でsrcと4件の対象testだけを`/tmp/game100-records-stage2-review`へ展開し、既存node_modulesを再利用。`record-rule-migration`3、`record-local`11、`records-client`9、`record-definitions`5の合計28/4files PASS。証拠はQA/RECORDS_STAGE2_FIXED_UNIT.txt。migrationテストで旧4boardのsafeSubmission受入、新rules混入拒否、旧20board応答受理、旧local値不変を確認した。

最初のworking tree実行ではstage3のGame006新版キーが並行反映され、旧v2キーを現行値とする既存test1件が失敗した。これは固定stage2に対する失敗ではなく、固定archiveで28件すべて成功。stage3/4追加後はそのsourceで期待値を更新して再確認が必要。

制約：Sharing private constructor/flushそのものを旧queue入りの本番相当ブラウザで再生する試験は本reviewでは未実施。ソース経路の確認＋payload/登録/旧API/保存境界testsまでの判定であり、本番で旧queueが実送信・受理されたとは報告しない。独立Jev判断は`QA/stage2-old-record-queue-judgment.json`へ記録し、注釈はrootが行う。
