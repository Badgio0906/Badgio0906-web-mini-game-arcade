# Game019 改訂02 — チャージジャンプ全面改修・公開報告

対象はGame019「井の中の蛙、大海を目指す」のみ。以前は大ジャンプ中心の固定間隔の登りで、離す前にSpaceが発射する。改訂02は、溜めて離す連続ジャンプ、飛ぶ前の方向決定、空中操作なし、同じ地形を覚えて登り直すゲームへ再設計した。Jump Kingの地形・画像・セリフ等は使用していない。

## 最終仕様

- Space／中央JUMPを押して溜め、離して発射。左右／A・D／左右touchで離す時の方向を決める。短押しは位置合わせ、中は主力、長は高く遠くへ飛ぶが梁や壁・飛びすぎのリスクがある。最大700msを超えて保持しても自動発射しない。
- 本番の数値POWER、飛行予測線、空中補正はない。3段階のオリジナルpixelしゃがみと控えめなSEで溜め具合を示す。
- 0〜100m井戸12区間、100〜200m空12区間、55足場。低天井、苔、根、木、崩れる棚、動くバケツ1種類。70mの安全経路と2跳躍少ない危険経路、25.2／50／75.2m等の物理catch。失敗は近い棚・数足場・27.5m以上の落下に分かれ、底でも同じRUNを続ける。
- カメラは上側を広く映す。下を見る操作と小さな縦shaft図でcatchを読む。pixel描画位置は整数に丸める。
- 100mで海→コミカルな鳥→「井の外の蛙、宇宙を目指す」。空は12個の固定風区間、左右／上昇／下降と弱中強。発射時の風は次の実着地まで固定し、途中の突然変更はない。200mの星へ実着地してCLEAR。
- 任意の「すぐ遊ぶ／説明を見る／練習する」。7練習は専用の安全エリアで実跳躍・着地により進む。本番BESTや統計を汚さない。pause・blur・touchcancelは溜めを安全に中止。RESTARTは明示確認。
- 旧BEST／muteを保つ。最高高度、井戸到達数、宇宙到達、最速ms、累積落下dmを端末保存。TOTAL FALLは通常の頂点後の下降も含む。死亡・時間制限・自動位置復帰はない。

## 順序と独立判定

1. [Web調査](../../GAME019_JUMP_DESIGN_RESEARCH.md)を実装前に作成。公式説明、プレイ解説、肯定／否定レビューの原理を抽象化した。本家を購入して実プレイしたという記録ではない。
2. 独立workerが旧版を通常PC／touchで実操作し、[Before分析](../../GAME019_BEFORE_REDESIGN.md)を記録。旧版にも空中制御0／RUN継続はあり、問題を事実に合わせた。
3. 平地の連続チャージ、空中0／弱24比較、20m手作り試作。独立[試作gate](PROTOTYPE_FEEL_REVIEW.md)が技術・設計PASS後に全体制作へ進んだ。
4. 全体map、変化する落下、海／鳥／空／宇宙、pixel art、控えめな3章音楽、入力・7練習を統合。[Level設計](LEVEL_DESIGN.md)、[Visual報告](VISUAL_REVIEW.md)、[Feel報告](GAME_FEEL_REVIEW.md)、[QA報告](QA_REPORT.md)を別担当が記録。
5. 統計の整数保存に修正を限定し、実StorageService単体とcompiled版4画面の再読込で閉じた。物理／map／入力のhashが不変のため200m全RUNを無目的に再反復しない。

## 実行した検証

| 証拠 | 結果と限界 |
|---|---|
| `npm run check` / `npm test` / `npm run build` | 最終294単体／32files、型検査、全19本build PASS。[最終ログ](QA/all-unit-final.log)、[型](QA/check-final.log)、[build](QA/build-final.log)、[実時刻](QA/final-validation-timing.json)。 |
| 全体物理model | 安全54／近道52跳躍で200m。106/106指定の±20ms同棚着地、バケツ4位相、1.1〜27.5m進行損失。最大だけの有限探索112試行／38状態は20m未到達。数学的全解否定ではない。 |
| 独立native browser | PC1440／phone390／320／横844の全4画面で200m、7練習。空中0、左右真上、最大保持、cancel、梁／壁、苔／崩れ／バケツ、catch、海鳥、4方向3強度風、宇宙。人間の試遊ではない。 |
| compiled本番候補 | [root4画面](QA/production-root-retest/report.json)、[相対subpath4画面](QA/production-subpath/report.json) PASS。DEV hookなし、通常入力20m、明示restart、旧BEST／整数累積落下の再読込、JS／CSS／font／thumbnail hash一致、console／HTTP error0。 |
| 他ゲーム保護 | [最終監査](QA/FINAL_SCOPE_AUDIT.json)。他18／共通の303file、他profileとcatalog19file、他thumbnail18entryがbaselineと同一。CREDIT・AdSense・外部Jev・共有SDK変更0。 |
| Visual | 独立83/100、F12/H12。実画像36枚以上の閲覧記録。小画面のfrog／旗が小さく、resultはscrollを要する限界を残す。 |

初回FAILを消していない。狭い57.2m棚の許容幅、横titleの3択、整数readerへ小数保存の製品問題を修正。固定入力の累積位置ずれ、HUD更新前read、collectorが実棚を経路へ含めない失敗、coverage候補未実行等は検証基盤として分離した。[独立QAの分類と原本](QA_REPORT.md)を参照。

## Jev向けデータ

[更新Profile](../../../jev_export/game_profiles/game019.md)／[設計note](../../../jev_export/design_notes/GAME019_CHARGE_REDESIGN.md)。ジャンプcharge ms／power／direction、実着地成功、落下start/end/distance、section、catch、風、chapter、well／spaceを既存の端末内400件記録へ出力する。外部API送信はしない。

[実測QA sample](../../../jev_export/telemetry_samples/game019-revision02.observed.json)と[合成フィールド例](../../../jev_export/telemetry_samples/game019-revision02.synthetic.json)は別ファイル・出自ラベルで区別。[集計CLI](../../../tools/analyze-game019.mjs)は始終の揃ったRUNのみを到達率の分母にし、不足時はnull。実測400件は初頭が欠けているため到達率未算出。global player統計や面白さ評価ではない。

```sh
node tools/analyze-game019.mjs device-export.json output.json
```

## 公開

ユーザーの既存「検証後、すべて公開まで進める」の許可を適用。検証済み候補をPRへまとめ、既存GitHub Pagesのbuild/deploy後、正式HTTPS上でcompiled asset hashとnative入力を確認する。最終公開commit／CI／URLは [PUBLICATION.json](PUBLICATION.json) へ実結果のみ記録する。公開確認前はpendingであり、local PASSを公開PASSへ変換しない。

## 残る人間評価

[Human Playtest](HUMAN_PLAYTEST.md)は未実施。初見の楽しさ、再挑戦意欲、chargeを身体で覚えられるか、長い落下の許容、実機の親指・FPS・音量は自動成功では保証しない。変更対象外の他18本はhash保護と全単体／buildで確認し、今回全18本を実機で再プレイしたとは主張しない。
