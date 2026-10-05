# Game016 負けじゃんけん ～LOSE TO WIN～

2026-10-05。ユーザーの今回の実装指示を実装・レビュー用に整理した要求記録。人間のプレイ評価は未実施。

## ゲーム

相手に実際に負ける手だけが正解。相手グー→チョキ、相手チョキ→パー、相手パー→グー。勝ってしまう／あいこ／時間切れは1回でRUN終了、残機なし。既存じゃんけんのUI表示だけを逆にしない。通常じゃんけんの習慣を抑え、負ける手に変換する認知的混乱が本質。

左グー／中央チョキ／右パーは説明・練習・全Phase・Reflexで必ず固定。各手の色で答えを示さず、難しさを選択肢シャッフルで作らない。

PC：←/A グー、↓/S/Space チョキ、→/D パー、クリック。スマートフォン：画面下部の大きい3択、十分な間隔、Portrait。PCでもゲーム領域は小さくしない。

## 4段階

1〜10問：相手と3択が大きい統一イラスト、2.0秒。
11〜20問：相手・3択とも「ぐー／ちょき／ぱー」のひらがな、2.0秒。「イラストなら余裕ですね。次は文字で負けてください。」等の短いTransition。
21〜30問：文章から相手の手を特定し、さらに負ける手を出す。30問以上のデータPoolから重複なし10問。問題文の読書中は時間制限なし、Tap/Click/Enter/Spaceで理解した後に進める。選択肢が入力可能になった瞬間から2.0秒。読む入力が回答に転用されないkeyup／pointerrelease等のInput Guard必須。「文字も大丈夫そうですね。では少し遠回しに言います。」等のTransition。
31問〜：30連敗の後に一旦止め「30連敗。もう考える必要はありません。ここからは反射神経です。」→REFLEX MODE。相手と3択は再びイラスト。常に0.8秒、勝手に0.7/0.6/0.5秒へ短縮しない。正解の短いLOSE!と気持ちよい短いSE後すぐ次問。上限なし、1ミスまでENDLESS。

どの制限時間も、相手の問題が表示され回答可能になった瞬間から計測。Pause／非表示は時計を凍結し、明示再開する。背景タブの壁時計を勝手に短いフレームへ丸めない。

## Question Data

各問題は id/question/opponentHand（rock/scissors/paper）を持つ。自然言語解析は不要。曖昧な問題・難解な国語問題は禁止。一意な簡単な文章を明示的な意味データで検証可能にする。

ユーザーの例：
- グーとパー以外を出すよ → scissors
- チョキには勝てる手を出すよ → rock
- パーに負ける手を出すよ → rock
- グーには負けない手で、グーではないよ → paper
- チョキでもパーでもないよ → rock
- 紙を切れる手を出すよ → scissors
- 石に勝てる手だよ → paper
- はさみに負ける手だよ → paper
- パーとあいこになるよ → paper
- グーに勝つけどチョキには負けるよ → paper

## 得点／結果

各正解：1〜10 +100、11〜20 +150、21〜30 +250、31〜 +300。
Reflex速度加点：回答0〜300ms +200、300ms超〜500ms +100、500ms超〜800ms +0。少数の分かりやすい段階で実装。30問完了5000点、以後Reflex連敗が上位のスコアを作る。
結果：SCORE、連続で負けた回数、到達Phase、REFLEX STREAK、BEST、称号、進行コメント、回答／相手／正解、Retry／タイトル／ポータル。
理由：勝ってしまいました／あいこです・負けてください／考えすぎです。失敗自体が笑える逆説的な文言。
称号の目安：1〜5負け下手、6〜10負けの初心者、11〜20立派な敗者、21〜30負けるが勝ち、31〜40敗北のプロ、41〜60連敗王、61〜100負けじゃんけん名人、101以上超絶アルティメット敗北神。0回も扱う。
コメント：序盤「普通に勝とうとしてませんか？」、10突破「イラストでは負けられました。」、20「文字でも負けられました。」、30「もう負け方は完璧です。」、Reflex10「考える前に負けています。」、30「敗北が身体に染みついています。」、100「勝ち方を忘れていませんか？」。

## CREDIT／保存／Onboarding

既存Feature Flagの試作版では無料・無制限。再有効化時は1 CREDIT = 1 RUN、RUN開始時のみ1消費、途中や終了時に再消費しない。初回3、0は補充選択、広告境界をStub明記。既存15本の消費時点を変更しない。
初回：短い説明「相手に勝ってはいけません。相手が出す手に、負ける手を選んでください。」→練習→本番。
練習は無制限の3問：相手グー→チョキ、チョキ→パー、パー→グー。誤答しても練習継続。固定位置で覚える。完了「OK！ 勝ったら負けです。負ければ正解です。」。本番へ進むまでRUN時計・得点・CREDIT・BEST・RUNイベントを変更しない。2回目以後はすぐ遊ぶ／練習する。初回に後続Phaseの秘密を全部説明しない。
BEST／mute／練習完了は独立ゲームLocalStorage、破損・保存拒否を既存StorageServiceで扱う。Retryで再読込不要。終了1回、quitとGame Overを分離。

## Visual / Audio / Portal

レトロなテレビ番組風×ポップなじゃんけん。明るい、太い輪郭、大きい手、読みやすい太字、バラエティ番組的。015のファミコン風とは別。汎用SaaSの角丸カードだけにしない。背景はプレイの認識を邪魔しない。相手とあなたを明確に区別。0.8秒でシルエットが瞬時に分かるグー／チョキ／パー、絵文字を主素材にしない。Image Generationを使う。画像は軽量・統一、生成元素材と由来を記録。
Timerは読む必要がない感覚的なバー等。正解「負け！」はPositive Sound、勝つ／あいこ／Timeoutを区別。muteを持つ。
Catalog表示「負けじゃんけん ～LOSE TO WIN～」、英題LOSE TO WIN。Tagline第一候補「勝ったら負け。負ければ勝ち。」／「負けろ。全力で。」Art Director決定。
Genres cognitive/reaction/arcade/janken、mechanic reverse-rock-paper-scissors/response-conversion、skill cognitive-inhibition/reaction/rule-conversion。既存Catalog Schemaに合わせる。
サムネイルは大きな相手手と下部3択、実ゲームと同じVisual。豪華な別物にしない。

## Telemetry

共通trackEvent経由。phase_reached、round_reached、opponent_hand、player_hand、lose_success、accidental_win、draw、timeout、response_latency_ms、reflex_streak。共通game_open/run_start/run_end/score/retry/quit等も維持。run_endに失敗分類、Phase、累積連敗、Reflex連敗・最高、応答時間累計・件数を記録し、10/20/30突破率、Reflex到達率、平均Streak、勝ってしまった率・あいこ率・Timeout率・平均応答時間を将来分析可能にする。現在console／200履歴Stubで実ユーザー統計は未収集。

## 必須工程とQA

Art Director→Visual Brief→Image Generation→Implementation→Desktop/Mobile Screenshot→Visual Review→Revision→QA。
ゲーム本体担当と独立Game Feel／Visual／QAを分ける。動作正常だけで面白さ合格としない。人間の面白さ／実機評価は別途記録。
じゃんけん全9組み合わせUnit Test必須。PoolのopponentHandの存在・有効値・欠損・重複・意味の一意性を検証。
Tutorial／練習／固定3択／全4Phase／読書ガード／2000msと800ms／3失敗／Score／速度加点／BEST／開始時CREDIT／Flag無効／PC／Portrait／音／Portal／thumbnail／reload／LocalStorage／buildを検証。
共有Catalog/routing/UI/tutorial/CSS/Assetsの変更はRegression Test。既存15ゲームを破壊しない。
npm install相当の依存確認とnpm run build成功、TypeScript0エラー、consoleエラーなし。可能なPlaywright通常入力でPortal→新作→初回練習→本番→終了→retry/portal。

## 人間のプレイテスト

ルールをすぐ理解できるか、固定位置を覚えるか、2秒の難度、イラスト→ひらがなの変化、文章の一意性・テンポ・逆変換の面白さ、0.8秒があと少しと感じるか、普通の勝つ癖が出るか、1ミスの緊張・悔しさ・笑い・再挑戦意欲、1〜30の形式変化の飽き防止を評価する。人間評価を自動操作の合格と同一視しない。
