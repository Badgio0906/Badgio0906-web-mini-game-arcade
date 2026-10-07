# Game027 実装報告（本番統合前）

基準main `7c3d089d69da1ff076c63acb7c3ba96449728a1d`、隔離worktree `batch-two-author-027`。固有HTML／モデル／描画／保存／入力／テスト／文書のみを担当。共有登録・Analytics Worker・Portal・候補表・commit・公開は親担当。親がcompile用に置いた共有TelemetryService変更は自分の変更範囲に含めない。

実装前に [SHOT_RULE_TABLE](SHOT_RULE_TABLE.md) を作り、独立レビューで全8ケースを確認。全球停止後の一括判定、固定120Hz＋適応substep、CPU3難度、2人対戦、一球の任意練習、in-flight全状態保存、observerがnullでも一度だけ記録するlocal結果ledger、世代付き入力を実装した。6ポケット・1〜15番と白球・時間制限なし。公式競技完全準拠とは主張しない。

初回phone実操作で共有フッターがpause→titleボタンを覆い、実画像で番号が小さい問題を記録した。修正前のsource/画像/traceを保存し、独立した判断を受けてから、フッター分の領域確保、縦画面の全台90度camera、正立番号、最初の対象番号HUDを修正。半径・ラック・飛球物理は変えていない。保存内容の意味的不正／過大内容で後のbackend再読込が古い状態を復活させる問題は、親の独立probeと共通findingに基づきmemoryOnlyラッチで修正。練習由来のproductionナビゲーション／自動exitは親所有SDKのignoreEventと固有flag保持で除外する。

対象40テストPASS（ルール13・物理14・保存/入力11・反復CPU1・collectorの純粋モデル1）、check PASS。全体buildと固有エントリstandalone buildも成功。最新ログは [QA](QA/) の `unit-terminal-planner-2026-10-07T18-55Z.txt` / `check-terminal-planner-2026-10-07T18-55Z.txt` と各buildログ。テストは実機／人間の感想の代わりではない。

実コンパイルbundleをPC1365×900、phone390×844、小画面320×740、横844×390で操作し、4画面ともPASS／pageerrors0。台の全域がviewportに入り、通常のショット、CPU応答、pause、in-flight再読込、手動再開、退出後復活しないこと、fresh Enter、held Enter、cancel、合成AT detail0、練習clearと統計除外を確認。実ブラウザとソース／model確認は個別ログへ区別。画像・reportは `QA/05c383980eb4/2026-10-07T18-37-18-180Z-native/`。

独立レビューは親の `docs/game027/QA/independent/final-live-01/`。作者と別にPC/phoneの入力・運動・pauseを確認し、4画面画像も直接見てVisual81/100、F12/15、H12/15。320の密集ラック番号はまだ小さめで対象HUDを併用する。これは人間の面白さ評価ではなく、通常対戦の終局/再挑戦確認も別に必要と明記している。

通常2人対戦の最初のbounded60shot collectorは9球を除いた後43回のtarget=null/power0を続け、終局未到達でSTOP。失敗記録／原collectorは保存した。最初のcatchが全文DOM／球座標を保存しなかった限界を `QA/normal-terminal-first-before/LIMITATION.md` に明記し、後から復元しない。独立判断はTEST_INFRA_BUG（元review文言TEST_INFRA_ISSUEをhelperの実enumへ対応）。blocked straight-pocket候補をすべて捨てno-contactを繰り返すcollector方針に問題があり、製品変更をしない。collectorだけに合法なcluster-contact fallbackを追加し、新しい純粋モデルのfresh rackは23shotで合法8番・scratchなしの終局に到達。これは元の失敗盤面の再現ではない。修正collectorのPC通常対戦は22shotで合法8番の勝利へ到達し、実result→retry、pause/title→reload後のledger一度、fresh対戦→明示restartを確認した。pageerrors0、全球のbefore/after状態とresult DOMを保持。根拠は `QA/6c8577ed918e/2026-10-07T18-56-30-806Z-normal-terminal/`。独立reviewerは実result画像/DOMを読み、最後の保存盤面を純粋モデルで別に検証して合法[8]/first8/pocket8/no foul/winner1を確認（実操作の独立再演ではない）。phone通常終局/再挑戦は別の単独browser枠待ちで未確認。

Jev：作者の実APIは3回（phone操作C、番号可読性D、bounded終局collector C）。すべてapi_attempted=true／HTTP200／AVAILABLE／4有効回答／resolved `typesafe/jev-1.13-20260917`。4回答は独立判断前に読まず、独立証拠と一度だけ照合した。[監査メタデータ](QA/JEV_AUTHOR_METADATA_AUDIT.json)、原本 `QA/JEV_SHADOW.jsonl`。parentの保存境界と027/028共通練習境界の別記録は重複呼出していない。単純PASS/build、field mapping、同じcollector原因の再試験のためには呼ばない。Jevは合否・公開許可・面白さの代行ではない。

素材は独自コード描画と既存短い合成SE。[RIGHTS_NOTE](RIGHTS_NOTE.md)、[HUMAN_PLAYTEST](HUMAN_PLAYTEST.md)。作者本人／物理スマホの主観試遊は未実施。参照は継承したユーザー画像の緑フェルト・木枠・アイボリーの方向で、画像のラックや素材を抽出していない。権利ゼロ保証はしない。

既存他ゲームの保存／操作／routeは変更せず、広告／CREDIT／GA4／権限に触れていない。本番Worker登録・production許可・全回帰・CI・公開実確認は親担当。自分はcommit/push/deployを行っていない。

Rootrelease 2026-10-07T19:37:36.343720+00:00:40targettests,617/62 allroot tests, check/build, actualWorkerlocalD1 29events9RUN PASS. Root native4 touchcoverage realoptionalphone menus PASS at QA/root-touch-coverage-20261007T1934; original authorcollector is held in QA/collector-touch-coverage-before.mjs. Fullnormaldesktop22 andphone23shots both reachlegal8 result, retry/reload/restart once, no state/physics injection. IndependentVisual81/F12/H12 and terminal-phone-final-01 supplement; humanfun/physicalphone unperformed. OfficialCI/public URL/SheetA47 pending, no claimfromHTTP alone.
