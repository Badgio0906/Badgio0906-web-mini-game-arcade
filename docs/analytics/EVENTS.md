# イベントと計測範囲

旧local schema(name/at/primitive data)は維持。外部schema_version2は`src/data/analyticsEnvelope.ts`のstrict allowlistが正本。envelopeはevent_id/occurred_at/game_id/三種類のversion/browser_id/visit_id/session_id/run_id/event_name/environment/device_class/input_type/page/data。pageは既知pathのみ、queryなし。自由文・会話・URL・生stack・未知keyは送らない。外部dataは40field以内、数値finite、通常token80字／UTM100字。

- Portal：portal_view、game_card_impression、game_card_click、game_launch。旧portal_openはlocalだけ残し外部二重計上を避ける。impressionはカード50%以上を連続1秒、同一portal visitで同カード1回。背景化・表示率低下でタイマーを破棄。同意前の表示を後付け計上しない。
- Native：game_open/page_ready、任意説明・練習、run_start/run_end、retry、BEST、pause/resume、return_to_portal、page_exit、client_error。既存固有イベントはspecific_game_eventsのevent/event_type等を保持し、送信時に許可fieldへ絞る。
- 019：現行jump/jump_end、fall_start/fall_end、section_reached、catch_ledge_used、well_clear/chapter_reached/space_clear。短いjump/landing詳細は区間あたり各3件へ制限、3m以上の進行損失fall_endは保持。10m以上損失後の最初のjumpにはpost_fall_continueを追加し、samplingで継続を失わない。最高点回復は別のprogress_recovered。charge_start/cancel、軽い衝突や毎着地を無制限送信しない。ルール・風・地形は不変。
- 015：従来depth/fall/landing/platform/nice_drop/milestone/death/retryを利用。ゲームコード変更なし。
- 018：shoe/run_start、kickのjust/angle/spin/power、input_lock、special、rare_drawのeligible/won/probability、shoe_best_crossedを利用。rare_effect_shownは実際のboard.render後、対応するflightまたはiron-meteor着地/resultの表示をvisibleページで1回観測。wonとshownを区別。run_endへmax_height/landing_typeを補足。物理・抽選・描画・得点は不変。
- 003/006/007/008/009：既存の支持／芸術／駐車選択とブレーキ／配達／paceとspill／探索正誤と紙上げ等の数値・IDを再利用。追加SDKへゲームを書き換えない。
- 012〜014：legacy-shell-only。shellの閲覧・launch・任意説明練習・return・visibility・page_exit/session durationのみ。Godot内のRUN、得点、失敗、到達はlegacy_uninstrumented。shell起動をrun_startへ読み替えない。

page_exit欠測は離脱や退屈の証拠ではない。開始前に同意がないRUNでは開始イベントを後付け作成せず、後半のみ観測される場合はcensored。GA4には全ジャンプ等を送らず、coarseなサイトイベントだけを送る。
