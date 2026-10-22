# PR #14・#15公開と再審査前の残課題（2026-10-21 JST）

対象：Badgio0906/Badgio0906-web-mini-game-arcade。ユーザーの統合指示と、今回のWebhook／artifact・cache課金不明点を了承する追加回答の範囲で実施した。**公開したのはPR14とPR15だけ。Game012はPR13のDraft候補、Game015はPR11の未統合候補であり、本番と混同しない。AdSense再申請・管理画面操作なし。**

## A. 公開結果

|工程|承認された元HEAD|main merge SHA|Pages（各attempt 1）|
|---|---|---|---|
|[PR14](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/14)|f73dc5e820a9767239f339048a67b6514c5347e9|405572999e998ed0a7d702572a43127c4e1e96be|[39520695989](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39520695989)、build/deploy成功|
|[PR15](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/15)|55790917f1182b0dc91267b627e0d43c85d61cf1|ac5304fa81361f592942c472c7fa04f668d3b4bc|[39521734437](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39521734437)、build/deploy成功|

最新状態・CI成功・承認HEAD一致・競合なし・製品変更範囲を照合し、順番にReady→通常mergeした。force push、手動Actions起動／再実行、ワークフロー／課金設定変更なし。PUBLIC＋標準ubuntu-latestと既存Pages経路を確認した。Webhookは403、artifact/cacheの保存容量課金はUNKNOWNのままで、ユーザーの今回限定了承に基づく。無料を断定せず、新規有料契約・有料API・外部サービスを追加していない。

PR15はPR14公開後mainとの統合候補を別worktreeで準備し、check・976単体/101 files・build・19 browser cases・通常100秒結果/retry・keyboard確認を実行した。公開mainのtree `7f5c8bea59f23eaa3fa7b271f58792f818dca5a7` がその候補と完全一致する。独立QA用ローカルmerge commitはGitHubへpushしていない。

### 本番確認

- Game002/003/035：1440/390各幅で実際の開始・操作・一覧帰還。002の遊び方は無料で再挑戦できる説明を表示。035は自然な早期採点3エンド→結果・retryを確認。
- **Game003の証拠境界**：新しい位置・回転・積み上げのHTML文面を本番取得で確認した。既存CSSはintro欄を非表示にしているため、そのintro文を「画面に表示された」とは扱わない。画面上の本編操作説明は左右・R・DROPを示し、通常操作も確認した。introを見せるCSS追加は今回行っていない。
- Game033：本番の新規／許可済み／拒否済み／保存拒否など19ケース。開始前の許可・拒否・後で選ぶ・privacy、開始・説明・休憩・練習・撤回、自然な100秒結果・retryを確認。titleのみ非modal、その他のmodalを保持。実iPhone Safariの同意操作は未確認。
- Portal：1440/390/320/844の73チェック。26掲載、完成9/試遊17、OR/AND・状態絞り込み・favorite・非favorite発見・帰還を確認。画像26件decode、Game032/033/034/035の表示番号023/024/025/026を確認。
- HTTP 39 URL：公開ゲーム26本・トップ・about/privacy/ads.txtは200、retired004/007/010/021は案内200、削除026/028/029/030と保留031は404。ads.txtは指定行のplain text。初回collectorの退役文言期待「退役」を、実コードの「公開を終了」に直した4件限定再取得を区別して保存した。

本番は新しい隔離browser contextのみを使い、外部POST・Analytics・広告等を遮断した。fixtureはそのcontextの同意・favorite等だけで、実際の利用者データに接続していない。実広告クリック・共有記録投稿・本番データ書換えなし。広告配信の成立や物理端末の快適性を検証したという意味ではない。

[公開・統合・HTTP・Portal・本番browserの生データ](pr14-pr15-publication-20261021/QA/) に結果を保管した。ログ中の一時worktreeやcollector保存先は当時の実行場所であり、成果物はこのQAへ複写している。

## B. Game012候補

[横向き専用化の実装・検証・画像](../game012/LANDSCAPE_ONLY_20261021.md)を参照。対象は**内部Game012「お前の仕事は俺の仕事」**で、表示番号012＝内部Game015「落下キング」ではない。PR13をDraftのまま更新し、main統合・本番公開は行わない。

## C. PR11競合と人間確認

最終公開main ac5304f とPR11 HEAD `dbdf915a696b326f1247dd41c9f6cbf8765e9c56` のread-only merge-treeで、競合は **docs/CURRENT_STATUS.mdのみ**。双方が先頭へ別タスクの状態を追記したためで、製品変更パスの交差はない。[詳細な独立調査と実iPhone確認票](pr14-pr15-publication-20261021/QA/pr11-human-review.md)。解消・commit・push・Ready化・統合は行っていない。

将来承認されたら、最新mainとPR11の既存commitを保存した独立worktreeで通常統合し、CURRENT_STATUSの両方の事実を保持して手動解消する。Game015の縦専用・長押し終端・pause・入力解除を旧横向きCSSへ戻さず、最新統合候補でcheck/test/build、7サイズ・長押し/複数指・回転pause、Game033初回同意を検証する。今回その統合検証は未実施。

|作品|実iPhoneで作者が確認する内容|現在の版|
|---|---|---|
|内部012|横の人物/HUD/文字、親指tap、Safariバー、回転中断→明示retry、既存BEST|PR13候補。未公開|
|内部013|4領域と隣接誤入力、音/視覚/tap同期、3stageの自然な結果→retry、音出力先|公開版。今回はコード変更なし|
|内部015（表示012）|左右/DROP長押し・解除/複数指、縦の可視性、横でpause、戻っても自動再開しない、練習/結果|PR11候補。未統合・未公開|
|033|Safariの初回許可/拒否/後で/リンク、撤回、同意なし開始、modal/自然な結果/retry|今回PR15公開済み|

Game031はon-holdのまま。source・素材・保存互換を保持し、今回改善も再公開もしていない。旧IDは再利用しない。

## D. 再審査前の優先順

1. **公開前に対応が必要**：PR11はCURRENT_STATUS競合の安全な解消と統合後回帰が必要。PR13の横専用版とPR11の縦専用版はDraft/未公開であり、作者レビューと明示的な公開承認を経てから公開する。今回未解決の製品コード不具合を既知PASSで覆っていない。Game003のintro表示要否は必要なら小さな別設計として判断し、今回のHTML反映と区別する。
2. **作者の実機確認が必要**：上表4作品。Chromiumでの通常操作・矩形・保存境界検査を、Safari・聴感・面白さ・本人受入の合格へ読み替えない。[具体的なGame012手順](../game012/HUMAN_PLAYTEST_20261021.md)。
3. **後回しにできる**：Game012 native HUD/文字再設計、Game031品質改善と再公開、新作追加、全作品デザイン再制作、大規模共通エンジン改修。今回着手しない。

これは確認済み不具合と作者の品質方針に基づく順番であり、Googleが特定の画面向き・ゲーム本数・操作UIを合格要件として明示したという意味ではない。不承認の内部理由・審査通過確率はUNKNOWN。AdSense再審査はユーザーの判断に委ね、操作していない。

## 非変更・保存

PR14は002/003HTML・035文面、PR15は033title/modalに必要な2製品ファイルに限定。物理・難易度・得点・CREDIT・保存形式・広告/Publisher ID/CMP・Analytics送信仕様・Worker/D1/DNS・カタログ公開状態を変更していない。各元worktreeと未統合PR11は保全した。今回の残課題・QA文書はPR13作業ブランチへ保存するので、本番にこれらの文書追記が反映したとは扱わない。
