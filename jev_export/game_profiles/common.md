# 全ゲーム共通のタグと開始導線

タグは`src/data/tagCatalog.ts`の安定IDと日本語ラベルを使用。全19本のmetadataに保持し、カードには最初の4個を表示。`filterCatalog(tagIds)`はAND条件で絞る純粋関数。フィルタUIは未実装。

012は「お前の仕事は俺の仕事」、013は「タスク天国」。ユーザー一覧の12/13はタイトルで照合し、既存ID・route・保存を入れ替えない。

全ゲームで「すぐ遊ぶ / 説明を見る / 練習する」を提供。説明/練習を強制しない。既存コンテンツと練習は残し、練習の得点/本番BEST/消費を分離。Godot移行3本は元のgame loopを保持してshellに導線を提供する。

面白さの核は本番までのテンポと初回理解の両立。失敗は説明を読む人の減少や意図しない練習完了扱い。将来Jevには開始方法別のrun_start比率、練習完了と再挑戦の関係を相談する。ただしring内のdevice-localイベントでは全利用者の成功率・人気は推測できない。

Telemetry schemaはtutorial_view / tutorial_skip / practice_start / practice_complete / run_start / run_end / score / best_update / phase_reached / death_reason / specific_game_eventsを含む。native既存作品で各イベントの送出網羅は異なり、Godot3本はshellのみ。イベントがない値はunknown/nullで保持する。
