# 第2工程 独立コード／要求レビュー

担当: desk_rain（009/017実装担当、今回レビュー対象002/003/015/024/027の実装には不参加）。2026-10-15 UTC。Jevの回答は読んでいない。基準HEAD `4b32be51d8673906347cf69a3175d79ff5ed1c3c` に未commitの工程差分を重ねた状態をレビュー。実際のソースfingerprintは [STAGE2_REVIEW_SOURCE.json](STAGE2_REVIEW_SOURCE.json) に記録。ブラウザ固定候補の検証、Visual点、本人の面白さ・実機・聴感は本書のコード評価に含めない。

## Findings（実装担当へ先に報告、レビュアーは変更していない）

**STAGE2-G003-PHANTOM-DEMO: 本番初回に、物理bodyのない2棟が描画される。**

`src/games/game003/TowerScene.ts:25–26` は `s.stack.length ? s.stack : demo` で描画対象を選ぶ。`TowerRun.start()`／`reset()` は静的土台のみを登録して吊り荷を生成し、受理済みの `stack` は空で開始する。このため初回DROP前・初回落下中にも2棟のdemoが表示されるが、対応する物理bodyは存在しない。初回の吊り荷は見えているdemoを通り抜け、土台と接触する。ユーザーの「建物のデザインと当たり判定を一致」に矛盾し、どの建物が実際に存在するかを誤認させる。ソース観測での判定、ブラウザでの実画像・初回DROP再確認は未実施。

独立判断: 公開前に修正が必要。title用demoと本番描画を明示的に分ける。通常開始から1棟目受理までの画像と実入力で再検証する。Mainへ修正前に報告済み。Jevログや最終修正の結果はこの初期独立判定に取り込まない。

## 要求と保護範囲

| 対象 | コードで確認した内容 | 判定と残る実操作 |
|---|---|---|
| 002 | 乗車距離 `bikeStartDistance` を基準に1000m段階、速度2→4の上限、区間積分で倍率の遡及掛け直しを回避。NICEは旧距離に対して1回加算。障害物用 `roadTime` は最大2.6に抑え、隣接移動／波間隔／予兆を別に確保。`bestDistanceV2` と `bestScoreV2`、旧キー表示維持。 | 重大欠落は検出せず。通常通勤の差分は実質等速。最終高速域と初期域の通常入力、倍率文字と演出、ポーズ復帰は固定browserで確認する。 |
| 003 | 10形状の矩形unionをMatter compoundへ同一変換、部品密度を重心・質量へ反映。重力・回転・接触・摩擦・動的な既設物・崩壊。芸術点は実接触＋重心回復＋難しい形／傾き＋静止受理を条件にする。新 `rules3:best`／bonusと旧best/rules2保全。 | 上記demo findingは要修正。回転・位置・DROP、練習2棟と素材の見た目は実画像で再評価。 |
| 015 | 12経路、中央・同じ側・短い落下・移動橋・鳥回避。通常経路に振幅8/12/16、period5.2/7/9の移動床、乗ったプレイヤーに床の差分を加える既存モデルを維持。鳥はsine巡回、予兆と進行方向描画、relative sweep判定。 | 重大欠落は検出せず。拡張経路は旧物理単体の複数seed通常操作方策でも到達。本人の待ち時間と動線単調さは未評価。 |
| 024 | RUN開始と変化ごとに3～7を新抽選、96試行上限の壁生成。身体・餌・直進3マス／隣接曲がりを保護し、flood fillで餌までの到達性を確認。650ms移動停止、queue破棄、縁では新しい安全な進行方向。長さ160で壁撤去し400clear経路を保護。旧stateを保持し新版 `state-shifting-v2` へ保存、乱数／残個数／壁／演出ms等も含む。 | 重大欠落は検出せず。browserで壁変化中のpause/reloadと旧BESTの表示、変化演出を確認する。 |
| 027 | 本体物理・CPU選択・勝敗計算を変更せず、正本phase/matchからターンを描画。CPU思考後350msの予兆、世代tokenとtimer取消でpause/restart後の遅延発射を防ぐ。人／CPU／2人／移動／配置／pause／勝者の文言分岐。 | 重大欠落は検出せず。狭画面の盤面縮小と表示の判読性、通常CPU交代・再開後の予兆を固定browserで確認する。 |

## 独立で実行した検証

`npx vitest run tests/unit/workday-escalation.test.ts tests/unit/game003.test.ts tests/unit/game003-art.test.ts tests/unit/game015-routes-r04.test.ts tests/unit/game015.test.ts tests/unit/game024.test.ts tests/unit/game024-shifting.test.ts tests/unit/game027-turn.test.ts`

8ファイル89件PASS。追加で `npx vitest run tests/unit/game002-acceleration.test.ts` 1ファイル3件PASS。合計92件、上記対象に限定した実行。002は12000m上限域まで公開モデルの隣接入力を使う異なるframe rate検証、015は物理DROP／steer／brakeで64seedと長距離検証、003は実Matterの120形状試行と接触回復の加点、024は全しきい値と保存往復・400マスclear、027は正本状態からの文言を含む。

単体の通常操作方策は人間の判断・ブラウザ実入力の証拠ではない。上記findingを修正しても独立Visual／Feel／browser QA／公開確認は別途必要。

## 追記: phantom demoの限定修正を独立再確認

Mainからの修正通知後、Jevログを読まずソースを再確認した。`TowerScene.ts` は `titleMode=true` で開始し、controller.startでfalse／titleでtrue、描画は `titleMode ? demo : s.stack` になった。これにより本番の未着地stack0で架空の2棟を描く経路はソース上解消した。ブラウザの初回DROP画像による確認は固定候補で別途実施する。初期findingは消さず、[独立judgment](QA/stage2-g003-phantom-demo-judgment.json) を残した。
