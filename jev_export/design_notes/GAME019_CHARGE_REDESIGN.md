# Game019改訂02 データと設計境界

旧サイズ選択ゲームのprofileを再利用しない。今回の核は連続チャージ・離した時の方向確定・空中修正0・記憶可能な手作り地形・異なる落下損失。井戸100mと固定風の空200mは同じRUN。独立7練習をproduction runへ混ぜない。

## データ入口

ポータル「この端末の記録」のJSON保存から、既存 `web-mini-game-arcade:telemetry:v1` の最大400件を取り出す。browserで任意に公開送信しない。既存envelope schema1と`game_id=game019`、ページごとの`session_id`＋RUNの`run_id`を使う。人物ID・世界の利用者母数ではない。

```sh
node tools/analyze-game019.mjs device-export.json game019-analysis.json
```

charge平均／short・medium・long割合は保持された実jumpだけ。失敗height帯はjump_end.start、落下対はfall_end.from/to。50mは記録された高度やrun_endのscore、100m・空・200mは明示された章eventを使う。開始と終了が同じwindowにあるRUNだけ到達率の分母。見切れたstart／endは別count、分母0はnull。run_end.jumpsと観測jump数のcoverageも表示し、window外のcharge・fallを補わない。

TOTAL FALLは通常ジャンプの頂点から着地への下降も含む。progress_lostは踏み切り時より下へ戻った距離。前者1842m、最高100mのような笑いはprofile/resultの価値で、同じ意味の死亡countではない。着地成否は後退または壁/梁衝突を失敗とする。crumble後の自然落下は新jumpを偽造しない。

## 調べられること／限界

- どの開始height帯でlanding_success=falseが多いか。
- 観測jumpの平均charge_ms、3区分、方向と固定風の組合せ。
- 実fall.from→to、dropとprogress_lost、catchイベント。
- section到達、50/100/sky/spaceの観測RUN到達率。

実QA sampleはnative入力＋readonly診断で採取したこの端末の記録で、人間の上達・楽しさの証拠ではない。synthetic sampleは明示した形の例。異なる出典を混ぜない。保持制限で長いRUNの開始が落ちるため、欠測率を見ずに『全playerの100m到達率』と言わない。未報告値、Jevの評価・global利用者数はunknown。現在のコード、manifest、研究・Feel・Visual・QAをprofileの判断材料へ添付するが、Jevによる自動修正や公開gateは実装しない。
