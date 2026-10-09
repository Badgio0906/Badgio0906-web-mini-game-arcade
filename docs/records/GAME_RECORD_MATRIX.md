# 全active作品の記録対応表

調査基準: main `249748d`。2026-10-08 JSTにAGENTS、PROJECT_CONTEXT/CURRENT_STATUS、GAME_DEVELOPMENT_RULES/JEV_REVIEW_RULES、REQUESTと以下の保存/結果コードを読んだ。表の初版を定義・adapter実装より先に作成。010は退役で対象外。保存キー・スコア式・ルールは変更しない。publicは導入後に確定する結果のみ、既存BESTの遡及投稿なし。

`P` = `web-mini-arcade:v1:gameNNN:`。scalarは文字列の非負整数。表のrulesは比較用でpresentationとは別。補助欄の「本番」は練習を含まない。public対象の built-in special modes は既存BESTと同じ比較条件であり、新たに難度を合成しない。

|ID|ゲーム|既存保存/形式|代表表示（単位・方向）|rules / mode / 補助|本番確定箇所|local / public・理由|
|---|---|---|---|---|---|---|
|001|軌道をズラせ！|`orbit-shift:v1:best` scalar|最高スコア 点・高|1 / all / 本番|`src/main.ts` onEnd result.score→floor BEST|読取可 / 対象|
|002|ゆううつな月曜日|P`bestScore`, `best` distance, clearTimeMs|最終スコア 点・高|1 / all / 本番|main onEnd result.score（距離×nice dodge bonus）|読取可 / 対象。distanceを代用しない|
|003|我が国の建築は世界一ぃ！|P`rules2:best`; bonus別キー|階数 階・高|2 / all / 本番・組込C国含む|main onEnd result.floors|読取可 / 対象。height/bonusを混同しない|
|004|あなたの短期記憶、無事ですか？|P`best`|到達LEVEL LEVEL・高|1 / all / 本番|main onEnd result.level|読取可 / 対象|
|005|右往左往の仕分け術|P`best`|仕分け数 個・高|1 / all / 本番|main onEnd result.sorted|読取可 / 対象|
|006|ギリギリ駐車|P`best-rules-v2`; old best保持|スコア 点・高|2 / all / 本番・禁断含む|main onEnd result.score|読取可 / 対象|
|007|まだ乗れます|P`best:transport:v2`; old best保持|配達点 点・高|2 / all / 本番|main onEnd result.score|読取可 / 対象|
|008|コーヒーこぼすな|P`best-delivery-v2`; old距離best|配達点 点・高|2 / all / 本番・追加杯含む|main onEnd r.score|読取可 / 対象|
|009|印鑑どこですか|P`bestRules2`; old best保持|スコア 点・高|2 / all / 本番・整頓含む|main onEnd result.score|読取可 / 対象|
|011|ウンコかウコンか|P`best:v2`, bestFinalStreak別|最高スコア 点・高|2 / all / 本番・FINAL含む|main onEnd value.score|読取可 / 対象|
|012|お前の仕事は俺の仕事|Godot `user://high_score.cfg` `[scores] best`（変更なし）＋確認済み小型mirror|最高スコア 点・高|1 / normal / 通常|native game_finished 確定1回|読取可 / 任意共有準備対応。得点規則一致の旧BESTを個人最大へ保持、過去BESTは投稿しない|
|013|タスク天国|元 `task_heaven.cfg` を保持＋`game100_records_v1.cfg` `[game013.normal.r1]` / OJT別|補助なしスコア 点・高（0–11400）|1 / normal / RUN全体OJT未使用|native show_result 確定1回、途中stage除外|読取可 / 任意共有準備対応。旧混合BESTは条件不明、OJT ON→OFFも通常に昇格しない|
|014|指ハートチャレンジ|新 `game100_records_v1.cfg` `[game014.normal.r1]`＋確認済み小型mirror|元成功回数 回・高（0–25）|1 / normal / 通常|native _finish 確定1回|読取可 / 任意共有準備対応。元永続BESTなし、成功判定/段階/間隔維持|
|015|落下キング|P`best` scalarが旧版から再利用|最大深度 m・高|03 / all / 本番|main onEnd value.score（整数m）|旧key単独は版不明legacy。導入後currentrules表示snapshotで読取 / 対象|
|016|負けじゃんけん|P`best`|最高スコア 点・高|1 / all / 本番|main finish event result.score|読取可 / 対象|
|017|雨って避けたら濡れないよね|P`best`|最高スコア 点・高|1 / all / 本番|main end event.result.score|読取可 / 対象|
|018|靴とばそ|P`bestDistanceDecimeters`; score/shoe別あり|飛距離・全靴 m・高（保存dm）|1 / all-shoes / 本番|main flight完了r.distance|読取可 / 対象。全靴個人/公開を統一|
|019|井の中の蛙、大海を目指す|P`bestHeightDm` 0..2000; old bestHeight別|最高到達高度 m・高（保存dm）|2 / all / 本番|saveBest→finish quit/restart/clear、明示保存/pause|旧key単独は版不明legacy。導入後rules2snapshotで読取 / 対象。転落でRUN再作成しない|
|020|すっきり牌合わせ|P`clearedBoards`, bestPairs|クリア盤面数 盤面・高|1 / all / hints undo shuffle許可|main complete clearedBoards|読取可 / 設計上なし。24/48牌のpairsを競争へ変換しない|
|021|ならべて4つ|P`state` JSON archive.stats条件別wins/losses/draws|対局数 局・高|1 / all / assisted別既存集計|persistence.finalize|読取可 / 設計上なし。CPU/2人勝敗を合成BESTにしない|
|022|ひと息ソリティア|P`session` JSON stats.clears; rules klondike-v1|クリア回数 回・高|klondike-v1 / all / hints undo assist含む|persistence.reportClear|読取可 / 設計上なし。最短時間BESTは保存していない|
|023|伏字ことば|P`question` JSON history（既出語）/reportedLedger有界|出会ったことば 語・高|1 / all / hint可|保存question.history|読取可 / 設計上なし。historyは正答数/clearsではない|
|024|ひとマススネーク|P`state` JSON stats.best[4/6/8]|餌数・ゆっくり 個・高|1 / speed-4 / 本番補助なし|main recordEnd;既存BESTはfood取得時も更新|読取可 / 対象。速度4を固定、6/8除外|
|025|こつこつマインスイーパー|P`snapshot` JSON stats.won/lost|クリア回数 回・高|現行1 / all / hint可|Save.reportResult|読取可 / 設計上なし。elapsedMsは現盤面値で最短時間BESTではない|
|026|出世すごろく|P`snapshot` envelope.stats.matches/wins|対局数 局・高|1 / all / chance/多人数|save.reportResult|読取可 / 設計上なし。CPU勝数で競争追加しない|
|027|ひと息ビリヤード|P`state` JSON stats.games/wins/fouls/shots|対局数 局・高|1 / all / CPU/2人|save.finishReport|読取可 / 設計上なし。モード混在勝利数をBESTとしない|
|028|ぽんぽん卓球|P`state` JSON stats.bestRally|ラリー記録 回・高|1 / all / CPU難度/11点5点混在|main point/maxRally→save.finishReport|読取可 / 設計上なし。保存BESTに比較条件がなく公開比較不可|
|029|給湯室の落としもの釣り|P`save` JSON best score/finishes|帰宅時スコア 点・高|1 / all / 本番通常upgrade含む|main finishRun→Save.reportFinish|読取可 / 対象。既存BESTの確定スコアのみ|
|030|コンセントどこ？|P`snapshot` JSON progress.best[20] shortest cord|クリア済ステージ数 ステージ・高|1 / all / hint可|Save.recordClear|読取可 / 設計上なし。stage別長さは異条件、合算距離を発明しない|
|031|掘って、置くだけ。|IndexedDB game100garage-game031 worlds/current Snapshot stats|この世界の採掘数 個・高|1 / current-world / 自由遊び|SaveStore.save同一transactionの軽量metadata|metadataのみ読取 / 設計上なし。seed/world/chunksを読まず外部送信なし。旧metadata未生成は旧保存説明|

## 調査根拠と残る制約

Nativeの保存・確定根拠は各 `src/games/gameNNN/main.ts` と上表の保存module。012–014は原本pin（012 50a97c3、013 ddc854b、014 36877d5）と追跡済み `tools/legacy-record-patches/` を正規Godot4.5.1で全source exportし、公式JavaScriptBridge固定primitive通知を追加した。詳細と再現は [旧Godot記録連携](../legacy-records/IMPLEMENTATION_REPORT.md) / [正規export](../legacy-records/GODOT_EXPORT.md)。正本ConfigFileをnative自身が読む。Portalは小型IDB mirrorだけを取得し、Engine/FSを起動・解析しない。実際のゲーム起動前は旧native保存BESTをまだ連携できないため「記録なし」、拒否/破損は「取得できません」。公開共有は現行共通API未設定のため「準備中」。バイナリresource移植による改修は行わない。

未知版、破損、保存拒否は0へ置換しない。数値0の既存キーがあるときは有効記録として読む（保存キーの存在だけで初プレイを断定しない）。除去後は無cacheで元保存を再読取。031は同transactionのmetadataだけが正本、旧worldがあるかはgetKeyによる存在検査（chunks未読）と区別。表示用snapshotの版不一致はlegacyとし、既存保存を削除しない。

## 数値上限と保留基準

storageScaleは018/019=10（dm）、それ以外=1。元の保存を丸めて書き戻さない。019最大2000dmは200mgoal、024最大397foodは20×20−初期3。有限game008は二配達の理論上限8560点（1杯3280+2杯5280、DEADLINE=32秒/leg）、pendingAbove8560。一般の無限score/depthはJavaScript安全整数を拒否上限とし、100万を超えたら不正断定でなく保留審査。018も安全整数、10億dm超を保留目安にする（宇宙演出をhard capで切らない）。029既存Save検証上限10億点を維持、100万超は保留審査。これら保留値は実測分布由来ではなく初期管理閾値。Analytics不使用、架空本番値なし。

### 019旧版キー再利用の確認と修正

旧版と現行チャージ版の `bestHeightDm` 共用は、revision-02/IMPLEMENTATION_SPEC.md:39とmain初期化を照合して確認。単独保存値を現行rules2と解釈せず、015同様に導入後本番確定の現行ruleset snapshotを利用する。旧BESTは保持、根拠となる元キーsourceStampが変わった/除去されたら古い表示snapshotを無効にする。Rootへ修正前観測を渡しShadow Review実施後にadapter対応。読み出しログがないことを未読の証拠とはしない。

## Adapter検証

2026-10-08T14:51:12Z（日本時間23:51）: `npx vitest run tests/unit/record-definitions.test.ts tests/unit/record-local.test.ts` 15件成功、`npm run check`成功。catalog active一致、退役/未知ID、比較board一意、0と欠測、破損/拒否、distance対score/floors対bonus、canonical dm、旧版マーカー/削除、snake速度分離、非競争stats/既出語、031metadataだけのget＋world存在getKeyを検証。IDBテストはtransaction契約の合成fixtureであり、実ブラウザIndexedDB確認の代用ではない。ゲームEngineの起動・本番記録の取得・外部送信はこの調査では実施していない。

### 最終マーカー方式

015/019の導入後記録は別IndexedDB `game100-record-current-v1` の `markers` にゲームごとに保存。read-max-writeを単一readwrite transactionで行い、別ゲームの消失と同条件の低値上書きを防ぐ。元BESTキーは変更せず、元値sourceStampが削除・変更された表示snapshotは無効化する。旧localStorage表示mapは読取互換だけで、新しいwhole-map書き込みは行わない。保存が使えない環境で旧記録を現行ルールへ推測昇格しない。
