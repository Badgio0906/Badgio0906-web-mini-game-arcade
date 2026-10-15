# 第2工程 通常入力QAと最終source照合

担当sorting_parking（002/003/015/024/027実装者とは分離）。2026-10-15 UTC。コード独立判定は[別担当のレビュー](STAGE2_INDEPENDENT_REVIEW.md)、本書は通常入力・実画像・保存・source差分の技術証拠を統合する。本人の面白さ、実機、音声聴感、最終Visual、公開配信確認の代替にはしない。

## Sourceと判定

**第2工程の本書scopeは技術QA ACK。** 確認したsourceの継承は次の通り。全ゲームを最終commitそのものでブラウザ再実行したとは記載しない。[全hashと機械照合](STAGE2_BROWSER_SOURCE_AUDIT.json)。

1. 固定`a52677d22911f423769cb2b206704b08f2a87b68`で002/003全4幅、027844、bike最高段、snake実2変化、pool通常完局を実行。015/024/027のその他幅の基本lifecycleは旧固定`5bd5f03`で確認し、その後の対象ファイル差分を分離。5bd→a526は002style、003TowerScene/style、027styleだけで、015/024 sourceに差分はない。受理した7reportのsource manifestをそれぞれ宣言Git sourceと再計算照合し、全件mismatch0も確認した。
2. `a526→4ab395bf9158cde2cdc8807b0a400e544e4ebf16`で第2工程5作の変更は**027横画面CSS1行だけ**。HUD/操作のgrid行を分離。4ab production844の通常2人/CPU shot・実台・HUD重複検査と実画像2枚の目視を追加した。4ab compiledで5作×1440/390の主要UIも実行。
3. `4ab→c3c531e9df9ac37be9d7d98cc17b056b0ff948d7`で対象ゲーム差分は**002/003/024/027のmain計5行のTelemetry追補だけ**。本担当が実際のdiffを読み、002/003の既存newBest条件内best_update、024の既存training/二重終了guard下quit/score、027の既存current/track境界下quitの追加を確認した。モデル、得点、入力、保存、結果遷移、CPU、物理、レイアウトは変更していない。rootの既存92対象＋VM12/イベント35target成功報告と独立code readを継承し、7分以上のモデルRUNを繰り返していない。root実行の検証を本担当の再実行とは数えない。**c3で新たなbrowser RUNを行ったとの主張はしない。**

最終build/CI、Art Directorの最終判定、015新要素の追加通常操縦、公式公開と配信版照合はroot/各担当の別証拠へ接続する。本人合格や完成版metadataへ自動変換しない。

## Accepted通常入力証拠

すべて`QA/stage2-unique/`以下。各reportはpass=true、対象source SHA前後一致、pageerror0、外部write0。check数はassertion数で、独立テスト作品数や人間の試遊回数ではない。

| Report directory | source | 実行と確認範囲 | checks |
|---|---|---|---:|
| `a526-002-003-four-widths` | a526 | 002/003×1440/390/320/844。説明・独立練習・本番・通常入力・pause・mute・自然結果・retry・BEST/reload・帰還・戻る。002mobileは本番stage tap。003実2棟練習、移動/4回転/落下、実1棟受理と次L字のcanvas候補・physics連番。 |1420|
| `a526-027-844` | a526 | 実台326.875×179.781（内部327×180、58sampled色）。通常練習、2人shot途中pause/save/reload→1回判定、白球配置、CPU実shot/banner。 |140|
| `a526-bike-cap` | a526 | 通常0mから操縦。1000m旅、2000mでbike、全stage0〜7、速度2→2.25→2.5→2.8→3.1→3.4→3.7→4、得点倍率1→9。最高×4後250m以上回避継続、自然衝突で9343m/31921点/NICE3/110%。区間積分30987＋通常距離NICE加点934.3のfloor=31921と実表示が一致。retry/title/reloadで距離BEST9343保持。得点BEST31921は結果の実画像で確認し、reload assertionは距離BEST対象と区別。 |7626|
| `a526-snake-shifts` | a526 | 通常tap操縦で餌5個→第1変化、次しきい値7、計12個→第2変化、次6。壁0→4→7、bodyを保った実盤面変更、変化後pause/reloadのsnapshot完全一致。 |192|
| `a526-pool-terminal-recovered` | a526 | 通常マウスdrag・rangeキー・shotで同端末2人戦19shot完局。4幅の獲得結果と回転方向別実台検査、通常retryでgames1/shots19/fouls0を保持。 |96|
| `4ab-027-844-production` | 4ab | DEV hook不在、通常2人shot/交代・CPU実shot。HUD対操作の重複面積0をaim/通常shot/aftershot/CPUshotで実測。two-player-aimとcpu-shot画像をview_imageで実見し、説明・group・target・操作の重複解消を確認。 |43|
| `4ab-production-major-ui` | 4ab | compiled5作×1440/390、10case。DEV hook不在、title/main/pause/帰還、44px/横overflow/主要UI、027実台と実pixel。 |614|

旧`final-four-widths`の003/015/024/027各4幅と0021440は通常lifecycleを確認したが、ファイル全体は既知3FAILのためpass=falseのまま保持。015の鳥/移動床到達はこの基本DROP/自然死QAだけでは確認せず、runner_fallの追加collectorを別証拠とする。

## 失敗原本と修正分類

`desktop-initial`、`desktop-retest`、`practice-budget-retest`、`final-four-widths`、`a526-pool-terminal`、`a526-pool-terminal-retest`を削除・成功へ書換していない。

- output親directory不在、固定170msでのlane完了待ち、45wall秒/11.6simulation秒というforced SwiftShaderとbudget不足、練習success terminal判定漏れはcollectorの不備。ゲームソースを変えず、親作成/状態poll/通常Chromium構成/terminal判定を限定修正した。015の最初のheld-input境界という仮説は元記録を保持し、後のelapsed証拠に基づき訂正。
- 002844のhow-button41×44は製品CSS。rootがmin-width44へ限定修正しa526の全4幅で再確認。
- 027の旧44pxcontrol-only検査はcollapsed実台とHUD重複を検出できず、旧case PASSの限界として保持。実台寸法/実pixelとHUD交差面積を後から追加し、root/Artのfindingと修正を補完した。初回の未検出を隠さない。
- poolは最初の通常19shot結果到達後、390portraitの249.9375×454.421875をlandscape用幅250基準で誤FAIL。回転方向に合わせportrait幅130/高250、landscape幅250/高130、0.5CSSpx許容＋nonblank pixelへ修正。再検証では320portrait163.59×297.44も実描画を確認。これは補助的なcollapse検査であり、読みやすさのVisual点ではない。
- exec-server outageで4172/4175等の既存serverが終了し、接続拒否となった原本は`a526-pool-terminal-retest`。ゲームを起動していない環境失敗として分離。固定worktreeでserverを再起動し、新directoryへ再実行した。

Jevは6件実API/24回答、全6件独立注釈、比較可能な範囲でcodex_false_pass/release_risk_miss各0。これはこの6findingの観測で一般性能ではない。[Shadowログ](QA/stage2-unique/JEV_SHADOW.jsonl)と各finding/judgmentへ分離。API実測・独立判断・実際の再検証を保持し、原因や公開許可をJevへ委譲していない。実dataのprivacy/同意を検証するために外部writeを許可したものではなく、未承認通信はcollectorでabortしattemptを記録する。

## 限界・引継ぎ

DOMルールやreadonly座標で回答/操縦を選んだ自動操作は、通常inputと進行/保存の技術証拠。人間の認知・反応・楽しさ、物理smartphone、FPS実機、音声実機、実BFCacheは本書で合格にしていない。画面orientation変更/ブラウザ戻りは一部基本caseの技術確認に限定する。公開URL/liveランキングの稼働はrootの公式公開後確認へ残す。

Collector再実行と証拠の読み方は[README](QA/stage2-unique/README.md)。ブラウザ/contextはすべてcloseし、runner_fallへ枠を直接返却済み。稼働server/一時processが次のタスクにも残ることを前提にしない。
