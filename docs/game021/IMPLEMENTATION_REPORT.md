# Game021 author実装・検証報告

`af2edf70cdf8fe46175f4fcf38fec607dda997d0`、branch `codex/classic-model-021`、専用 `/workspace/classic-author-021` から実装。開始時の差分は準備済み未追跡node_modules linkのみ。authorはcommit／push／deployを行っていない。021固有HTML・モデル／UI／AI Worker／保存／manifest・単体・browser collector・本資料だけを追加した。rootが後からTelemetryService／analytics runtimeをこのworktreeへコピーした2fileはroot所有であり、author成果のコピー対象から除外する。

7×6の古典重力四目並べを、独自平面盤・緑●／琥珀◆・穏やかなアイボリーUIで実装。CPU3段階、先後、同端末2人、候補ヒント、CPU応答を含む待った、任意説明と実操作練習、pause、復帰、途中保存、設定別勝敗、もう一局。ルール・UI・保存・AIを分離した。[仕様](IMPLEMENTATION_SPEC.md)／[固定source SHA](QA/SOURCE_FREEZE.json)。添付参考画像はこのauthor環境で受領・実viewできていない。ユーザー指示のVisual Brief本文に沿った独自幾何学UIであり、画像照合済みとは主張しない。

検証は以下を実行した。

- `npm test -- tests/unit/game021-model.test.ts`：初回34、最終36件成功。[初回](QA/model-initial.txt)／[最終](QA/model-final.txt)。縦横・両斜め・合法5連結・盤端・満杯・42手draw・即勝利／阻止・合法CPU・探索上限・seed再現・待った・ABA型の古い応答・連打・重力復元・破損保存・idempotent結果・storage拒否を確認した。
- `npm run check`：成功。[最終](QA/check-final.txt)。rootからコピーされたrun継続methodsとpending remote optionを使っている。
- `npm test`：423件、46file成功。[全単体](QA/unit-suite.txt)。本author worktree基準であり、5本統合後のroot最終テストを代替しない。
- `npm run build`：成功。[既存root build](QA/root-build.txt)。base Vite regexは021を含まないため、これだけを021 compiled証拠にしていない。既存CSS構文／Phaser chunk警告は維持。
- `node --input-type=module -e "import {build} from 'vite'; await build({configFile:false,base:'./',build:{outDir:'/tmp/game021-author-dist',emptyOutDir:true,rollupOptions:{input:'/workspace/classic-author-021/game021.html'}}});"`：021単独のproduction build成功。Worker、fallback AI、UI CSS／JSが出力された。[初回](QA/targeted-build-initial.txt)／[最終](QA/targeted-build-final.txt)。
- `node --check tests/game021/probe.mjs`：syntax成功。collector自体はauthor未実行。rootが固定compiled sourceで4画面のnative操作・実画像・QAを行う。

3件の実code-inspection findingを同時点source／観測で保存し、1件ずつschema v2の4質問Shadowを1回実行、hidden-answerの記録が各HTTP200／AVAILABLEとなった。答えを見ずに修正し、独立review／annotateはrootへ委譲した。[Shadow原本](QA/JEV_SHADOW.jsonl)。成功数やbuildをJevへ送っていない。

1. [練習確認cancel](QA/PRACTICE_CONFIRM_FINDING.json)：確認を開く前にtraining flagを消す経路があった。実際の新RUN開始まで維持する変更。original sourceは [初期main](QA/practice-confirm-initial/main.ts.txt)。root通知→記録→修正の順。
2. [reload後reset継続ID](QA/RESET_CONTINUATION_FINDING.json)：元saveを明示resetする際、run_id復元前にendしていた。元runをrestoreしてendする変更。同じ初期sourceを保全し、記録→修正→このfinding専用root通知の順だった。親への通知が修正より後になった運用逸脱を明示している。
3. [満杯列keyboard](QA/FULL_COLUMN_FOCUS_FINDING.json)：selectedColumnが満杯のdisabled buttonに残る経路があった。人手番のrenderで合法列へ移す変更。originalは [修正前main](QA/full-column-focus-initial/main.ts.txt)。root通知→記録→修正の順。

Sourceを固定後、rootへcompiledレビュー開始を通知した。authorの広範なbrowser・subjective Feel／Visual採点・実機iPhone・音／長時間体験は未実施。[Feel状況](GAME_FEEL_REVIEW.md)／[Visual状況](VISUAL_REVIEW.md)／[本人試遊](HUMAN_PLAYTEST.md)。公開許可はユーザーの今回の明示指示にあり、本人未試遊だけを公開保留条件にしない。技術的acceptance・名称確認・compiled review・本番配信・Analytics登録・候補表更新はroot工程で未確定。この報告はauthor実装の完了を示し、公開済み／候補表「済」ではない。

再開：SHAを [SOURCE_FREEZE](QA/SOURCE_FREEZE.json) と照合し、root統合後buildを使う。`GAME021_BASE_URL=http://127.0.0.1:4173/ CHROMIUM_PATH=/usr/bin/chromium GAME021_REPORT_DIR=docs/game021/QA/compiled-native node tests/game021/probe.mjs`。collectorはDEV hookを読まず、通常tap／click／キーで2人勝利・練習・retry・pause・reload明示resume・mute保存・portalを確認する。CPU難度、非同期undo、hint、長押し／cancel、storage拒否等は追加root QAが必要。これらをauthor browser確認済みにしない。

## Root統合・独立検証（2026-10-07 UTC）

最新main af2edf7から専用worktreeへ統合。他作の元作業を保全。共有変更は新作の途中RUN再開（既存observer UUIDのみ）、必要な安全primitive、021のCatalog/version/HTMLbuild入力/匿名Worker集計/取得CLI登録、Portalも含む未登録ID送信停止。既存001〜020のdefault送信・保存互換をテストした。Worker本番認証は未設定でdeployせず、新作送信は停止中。認証・D1 schema・広告・GA4・CREDIT設定を変更しない。

Root compiled4画面の対局→結果→retry→休憩→再読込→明示再開→Portal、音設定保持、debughook不在、pageerror0／横overflowなし。独立担当がCPU3難度×先後、hint、待った、保存UUID継続、練習と確認cancel、満杯列のkeyboard復帰も実操作した。[操作証跡](QA/compiled/report.json)／[独立追補](QA/compiled/reviewer-interaction.json)。Visual83/F13/H13、Gameplay成立PASS。本人の楽しさ／実機タッチ／実機音は未確認。

3findingは実HTTP200＋有効な4回答・独立判定・採否を[Shadow記録](QA/JEV_SHADOW.jsonl)へ保存。Jevは公開／面白さ判定に使っていない。共有Portalfinding1件は別log。単純count／未来ID更新の初回assertion失敗と環境ブラウザbinary不在は元ログを保持し、Jev対象外の理由を区別する。

本番公開と候補表A29更新はこのcommit後の期待SHA/CI/公開URL確認に続ける。実公開結果はQA/PUBLICATION.jsonと後続記録を参照。
