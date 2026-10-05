# game019 — 井の中の蛙、大海を目指す ～WELL TO SPACE～ / revision2

溜める→方向と着地点を判断→離す→修正せず着地を待つ→落下から学ぶ。3別ボタンを撤去し、連続したチャージ時間による小・中・大相当へ変更。井戸と空の手作り24区間で場所とチャージを覚える。転落はGame Overではなく同じRUNの進行後退。

- PC：←/A・→/Dを押しながらSpaceを溜め、離す。無方向は真上。↓/Sは下を見る。
- mobile：独立した左右ホールド＋中央JUMPの多指長押し→release。cancel／pause／非表示で取り消す。
- 最大700ms、連続power。短押しは立ち位置、中は主力、長は高く遠くへ。本番POWER数値・正解軌道なし。カエルの独立3姿勢と短い音で読む。
- 空中制御0。固定地形55足場、井戸12／空12section、低い梁・狭い石・苔・crumble・動くバケツ1種類・安全／近道。
- 25/50/75m付近のcatchは地形、保存checkpointではない。失敗の後退1段〜数sectionに差を作る。リスクは下を見る操作と実棚の断面案内で示す。
- 100m海→鳥の短い演出→104m空→200m星着地CLEAR。「井の外の蛙、宇宙を目指す」。空から井戸側へ落ちても同じRUNで再登り。
- 12固定風域：左右／上昇／下降、弱中強。踏み切り時の風を着地まで固定し、途中で乱数変更しない。旗・線・HUDで読む。
- 練習7段は別model。本番score/BEST/run_start/run_end/章の記録を作らない。旧練習完了を新チャージ練習と混同しない。
- 保存互換：既存game019 namespace、整数dm BEST／mute。位置保存なし。総落下、井戸回数、宇宙到達、clear timeは019固有。

今回の実装・実入力QA・設計レビューは [改訂02報告](../../docs/game019/revision-02/IMPLEMENTATION_REPORT.md) と [研究](../../docs/GAME019_JUMP_DESIGN_RESEARCH.md) を参照。13必要poseはオリジナルの整数pixel authoring。参考画像やJump Kingのmap/artをコピーしない。

Jevのための [フィールドschema](../telemetry_samples/game019-revision02.schema.json) と [分析手順](../design_notes/GAME019_CHARGE_REDESIGN.md) を提供。端末内400件、primitive最大40field、外部送信なし。`node tools/analyze-game019.mjs device-export.json result.json` で観測charge平均／区分割合／失敗height帯／落下height対／50・100・空・200到達率を集計。分母は同じ保持windowで開始と終了を観測できたRUNだけ。欠測・未完RUNは別記し率を捏造しない。TOTAL FALLは全下降距離、progress_lostは失った進行で区別する。landing_successは後退も壁/梁衝突もない着地。

人間の面白さ・実機・音/FPS・再挑戦意欲は未実施。想定180–600秒は設計仮説。Jev API評価、global player analytics、公開の自動判断は接続していない。
