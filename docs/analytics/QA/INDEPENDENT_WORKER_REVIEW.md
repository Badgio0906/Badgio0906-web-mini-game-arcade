# Independent Worker / D1 / aggregation review

2026-10-06（日本時間）。実装担当とは別のレビュー担当が、ユーザー指示書のbackend・retention・security・analytics・Worker QAをコードと実行結果で照合した。レビュー担当はproductionコードを編集していない。以下の検証はsyntheticまたは端末内SQLiteのみで、一般利用者データを作成・取得していない。

## 判定

**Worker/backendは下記固定版でPASS。** 初回指摘は担当者が修正し、独立再確認した。本番Cloudflare/D1へのdeploy、実際のcron実行、Cloudflare上の負荷検証は未実施であり、local合格を本番稼働の証明にしない。clientの実描画・同意・sampling連携は別の統合レビュー範囲。

## 初回指摘と再確認

| 指摘 | 修正・確認 |
|---|---|
| Cross-gameが同一ゲームの最後のRUNを起点にし、A→B→Aを取りこぼす | 最初のRUNを保持。独立fixtureでA→B→AのA側率1/1を確認 |
| version条件を他ゲーム・再訪のcontextにも適用し、異なる版への移動が消える | 選択対象だけversionをfilterし、期間・環境内contextを維持。Worker単体の異なる版A→B→A確認がPASS |
| 日次履歴にversion条件を適用しない | 許可されたversion keyだけをbindしたSQL条件へ追加。source確認 |
| 日次履歴がexclusive終了日の全UTC日まで含む／部分日の意味が不明 | `day < ceil(to UTCday)`へ修正。実SQLiteのunitでexclusive最終日と他versionを除外。日次は完全UTC日、部分edgeは指定期間全体の正確な合計ではない旨をcoverageと`history.partial_edge_days`に明記 |
| Game019の大落下をジャンプ頂点からの降下距離で数え、進行を失っていない着地を混同 | `progress_lost >= 10m`を使用。頂点から14m降りてもprogress_lost=0なら大落下0件 |
| 同一RUN継続と失った高度の回復が同じ意味として読める | 率は「観測された同一RUN継続」であるとcoverageに明記。再獲得高度は別の`progress_recovered`観測。samplingの欠測を離脱と断定しない |
| 大落下をattempt_idでdedupeし、ジャンプせず再度滑落した場合を合算 | distinct event_idを保持。D1がUUID再送を除外するため、同じattemptの別の実落下を消さない |
| 全体のvisit平均・中央値がgame別visitを分母にしていた | browser+visitで集計。1visitでA3RUN+B1RUNの平均・中央値4を独立確認 |
| contextを何度も全走査する二乗計算 | browser/visit/game/RUNのindex化。独立Node測定で10,000rows単一計算3,116ms→74ms、20,000rows131ms。18game集計20,000rows508ms。端末内測定でありCloudflare CPU合格ではない |
| Wranglerのproxy noticeがD1 JSONの前に出てlocal collectorが失敗 | 初回失敗を保持。machine JSON部分のparseを修正後、独立実行がPASS |
| raw完全性の窓と実削除のUTC日境界が異なる | 共有`rawCutoff`をretention／raw_window_from／raw_period_completeへ適用。実際に削除済みの部分日を完全なraw期間と宣言しない |

Game018のeligible／won／shownは別の状態として扱う。既存rare_drawだけでshownを証明できない点を統合担当へ伝達した。実際の描画からのshown observerとGame019のsampling後の継続イベントについては、client統合レビューと合わせて確認する。

## Security boundary

- Public POSTはproductionの2originだけを許可し、developmentの場合だけloopbackを追加。Origin/CORSはブラウザ境界であり、正当なプレイを証明する認証ではない。clientが送る値は改ざん可能。
- 固定event/game/page allowlist、envelope exact keys、primitive field allowlist、有限数・文字長・UTC timestamp、最大50events/64KiBを確認。client側は25events/32KiB。未知game、退役010、未知event、email・生stack・URL/query・入れ子は外部schemaで拒否する。
- UUID `event_id` primary keyと`INSERT OR IGNORE`で再送をdedupe。SQLの値はbindし、動的version列名は固定リストからのみ構築する。
- adminはWorker secret Bearer tokenを要求し、digest比較。secret未設定時503、認証欠落401。集計JSONにraw browser/visit/session/run IDsを返さない。
- 本番またはENVIRONMENT未設定の場合、qa/synthetic/development eventは拒否する。rate limiter bindingは任意で、現行configには未設定。本番の不正送信・大量負荷対策が完成したとは扱わない。
- Worker migrationとSQLには生IP、完全UA、氏名、メール、入力文章、Authorizationを保存する列・実装がない。運営infraログとは別の境界。

## 実行した検証

- `npx vitest run tests/unit/analyticsWorker.test.ts`: 最終11/11 PASS。Node SQLiteに実migrationを適用するunit検証で、D1本番の代替とは呼ばない。
- `npm --prefix analytics-worker run check`: 最終PASS。
- `npm --prefix analytics-worker test`: 最終固定版の独立再実行PASS。Wrangler workerdと実local D1で12項目（migration、health、valid batch202、UUID dedupe、unknown event400、invalid origin403、oversize413、admin unauth401、aggregate200、game detail200、no raw IDs、実D1件数2）を確認。
- 独立synthetic集計probe: A→B→A、ジャンプ頂点の通常降下、site visit平均・中央値を確認。
- 独立retention境界probe: 固定now=2026-10-06T03:17Z。日境界切り上げcutoff=2026-07-09T00:00Zより前を削除し、残rawは90日以内。日次archive4件分を保持し、翌cronでも古いarchiveを消さず5件分へ増加。個別IDをarchive JSONへ書かない。

割合は母数0ならnull、20未満なら少数を明示。RUN時間は観測start/endがそろったRUNだけ。未終了RUN、同意なし、legacy native内部、sampling欠測を「つまらなくて離脱した」と推定しない。日次distinct数は足し合わせて期間distinct数に変換しない。

## 固定版SHA-256

```text
39938c94452b959479c04d15b19675bea8d54f8a4950155084f0aa346661f399  analytics-worker/src/index.ts
70810ff4e45de22877afd2913910cc4b376ebaf086299672b24c208178faf63a  analytics-worker/src/aggregate.ts
1a2f6fb2a1463945c0dac3f5dd62a411bb16eb7298893f9974a6ff861afa87c6  analytics-worker/src/types.ts
21cd3545e9b051dc36f96c2ccc65a58fc9c73abd5644f9c53814aaa40cfaf219  analytics-worker/migrations/0001_events.sql
7282d095484ecbeacf901344c3a78fc407cfc1bf0b12faf5daccfcc059654c9e  analytics-worker/wrangler.jsonc
5dcb134cf1bd503ff302cf25add4b482b70d6080588d3035223b4e93d7880d81  src/data/analyticsEnvelope.ts
```
