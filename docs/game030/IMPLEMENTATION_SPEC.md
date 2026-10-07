# Game030 — コンセントどこ？ ～PLUG ROUTE～

ユーザーの第2バッチ指示・追補が過去の短時間終了／宇宙化等に優先。時間制限なし。机・棚・箱を避けて、固定長のコードでプラグを白いコンセントへ届ける。人物・手の素材不要、SVGで独自描画。

600×500 world単位（100単位を1mと表示）の独自20ステージ。primary解法は独立検証可能な固定waypoints。初期L字→複数障害→狭い中央と外側のルート選択。全primary経路は25単位の描画プラグ・コードclearanceにさらに4単位の入力余裕、最低70単位の長さ余裕。画面サイズ・DPRで座標や長さは変わらない。

入力は今のプラグからのdrag、pointer capture、離すと経路維持。再開時も今のプラグのみ。指の上に別プラグpreview。矢印8単位／Shift2単位の操作と44px方向ボタン。盤面だけtouch-action:none、外側はscroll可能。

全移動線分をexpanded rectangleへsweep検査し、targetだけの衝突判定をしない。外へ出たgestureは離すまで停止し、再進入ワープ不可。単純化はほぼ同一直線だけ、replacementのsweepと自己交差を検証。自己交差不可。巻き戻しは直近の1線分への連続戻りだけ（6単位以内を線上へ投影）、遠い過去線へ飛び移って消去不可。コードが尽きると残長だけ移動し、ゲーム終了にはしない。

「プラグを戻す」はpathだけreset、同じRUN・hint回数維持。「ステージやり直し」は新RUNでhint回数もreset、既存BEST／解放は保持。ヒントはnearest解法線分の次waypoint1個だけ、全ルート描画／自動操作なし。クリアでstage別最短長・次stage解放をatomic保存、端末内local resultIdで一度だけ計上。optional observer UUIDがnullでも通常保存は成立。

初回すぐ遊ぶ／説明／実L字練習は任意。練習はproduction RUN/BEST/解放なし。保存stage/path/budget/rules/ledgerを検証、復元は手動再開待ち。拒否後はmemoryOnly、捨てたRUNをpagehideで再保存しない。menu物理clickは同じ世代・同じbuttonのfresh pointerdownが必要、native keyboard detail0保持、heldEnterのphase持越しを遮断。

既存TelemetryService、game_open/run_start/run_end/retry/best_update/return_to_portal、specific_game_events level_start/path_length/reset/hint/level_clear。座標列・経路全文・毎フレーム送信なし。remoteCollectionEnabled:false、本番Workerと解除は親担当。広告・CREDIT・GA4・他ゲームは変更しない。
