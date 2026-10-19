# Game015 スマホ縦横UI — 独立コード／Visualレビュー

2026-10-19 UTC。実装担当とは別のレビュー担当 `/root/game015_ui_review` が実施した。**対象範囲で未解決のコード／Visual blockerなし。Visual 83/100、F12/15、H13/15で技術的なVisual gateを満たす。** 人間の遊びやすさ、面白さ、物理iPhone Safari、実音、連続FPS、公開可否の判定とは区別する。

## 対象と固定ソース

基準main `47c6cfe1ea93f71325fc47ff7031980ef9be9f74`、候補branch `codex/game015-mobile-landscape-ux`。以下の最終SHA256を照合した。レビュー担当は製品ソース・Git履歴・外部設定を変更していない。

| ファイル | SHA256 |
|---|---|
| `game015.html` | `ebd0f0e6fa519845347350a693d2cc5a689f115e9667655116540e3e87d10db5` |
| `src/games/game015/style.css` | `8edd9fef6d52df5c136ecedef5a2bd8cefe5713a2f024ce0e2b60ba7571e30a0` |
| `src/games/game015/main.ts` | `f55027e793c36dd787b9ad823eedc8b9d0a592220b09f3055a032c312a8f198c` |
| `src/games/game015/FallBoard.ts` | `c934e75f77981499145523f1aff39e21f77fd01ef275f42ab2750dcc6921c220` |

AGENTS、PROJECT_CONTEXT、CURRENT_STATUS、GAME_DEVELOPMENT_RULES、Game015 revision04報告、既存Visual rubric、今回のユーザー指示を読んだ。CURRENT_STATUS内の過去の「Phase 1未公開」は履歴であり、現在のmainの状態を上書きする根拠には使用していない。

## コードレビュー

- 変更は015のHTML viewport、固有CSS、Canvasを囲む1個の `.fall-surface`、入力の安全解除／押下表示、既存説明から作るpause helpに限定される。
- `FallRun`、得点・衝突・重力・慣性、Canvas内部256×448、`paint`／練習描画、RAF／tick、保存キー、記録・Telemetryの処理には差分がない。入力解除は既存の `setHorizontal(0)` と `setDropHeld(false)` を使い、位置・速度・得点・時刻を変更しない。
- 押下表示は入力・解除イベント時のみ3個の `data-held` を更新する。ゲームループへのDOM処理追加、毎フレームの再構築、新しい依存関係、viewport監視ループ、外部API呼び出しはない。性能低下を示すコード上の要因は見つからなかったが、FPS・実機遅延の実測ではない。
- pointer capture中の画面外移動は座標で判別し、そのpointerだけを解除する。画面内へ戻るだけでは再入力されない。`pointerup`／`pointercancel`／capture喪失の既存解除、blur、pause、回転・resize時の解除も維持する。既存の画面epochによる遅延click防止は維持される。
- 新しいCanvas周辺余白を押しても左右入力へ変換しない。左右とDROPの複数pointerを別々に保持する。押下中に回転した場合のfresh input要求は、ゲームを初期化せず成立する構成になっている。
- HUDは既存DLと既存IDをCSS Gridでヘッダーと同じ行へ表示する。DOMの複製や追加の更新経路はない。省略した既存ルールはpauseのdetailsから読める。PCは説明欄を保持し、Canvasの高さのみフッターを含む割当に収める。
- `viewport-fit=cover` に伴い、モバイルの全状態でbodyにsafe-area paddingを置き、共通ヘッダー側との二重加算を避けている。親担当の実CDP safe-area override検証とは別に、本レビューではCSSを確認した。物理iPhoneの切り欠きとSafariバー挙動は未検証。

### 検出・修正確認した閉じた練習dialog

親担当の通常操作QAで、横画面の練習終了後にも共通CSSの `display:grid` が閉じたdialogのUA非表示を上書きし、次のPLAYを遮る既存不具合が見つかった。初回失敗を合格へ読み替えていない。

最終候補の `body[data-arcade-game='game015'] #arcade-training:not([open]) { display:none; }` は015に限定し、元の練習Grid指定よりspecificityが高い。共通ファイルや他ゲームへ影響を広げない修正である。レビュアーが**compiled build 844×390で実touch操作の練習開始→閉じる→fresh PLAY**を再確認し、閉じたdialogは `open:false / display:none / height:0`、本番playingへ正常到達した。

## 実画像とDOMRectの評価

実装担当が固定候補で撮影した `final` の844×390／667×375 playing、390×844 playing、844×390 title／paused／result、1440×900 playingの7画像を実際に閲覧し、7サイズ×5状態の `layout.json` を読んだ。修正前の同状態DOMRectとも比較した。

| 条件 | 修正前Canvas高 | 最終Canvas高 | 最終の主な配置 |
|---|---:|---:|---|
| 844×390 playing | 304px | 250px | 左右各225×126px、右DROP225×262px、ヘッダー44px |
| 667×375 playing | 289px | 235px | 左右各175×119px、右DROP175×247px、ヘッダー44px |
| 390×844 playing | 626.5px | 587.2px | 操作をCanvas下へ保持、フッターまで表示 |
| 1440×900 playing | 747px | 665.2px | 右の全説明欄と下の3操作を維持 |

横画面Canvasの高さが修正前より小さくなるのは、既存の64px解析設定フッターまで同一viewport内へ収めたため。元の256×448比を維持し、天井・画面下部を切って大きく見せてはいない。対象7サイズのplaying／endingに縦横overflowはなく、title／resultの必要な文書スクロールは残る。result画像下端の共有ボタンの一部が初期viewportより下にあることを、プレイ画面の見切れと混同しない。

### Visual A–H

| 項目 | 配点 | 得点 | 実画像・実行に基づく理由／限界 |
|---|---:|---:|---|
| A Visual identity | 15 | 13 | navy坑道、赤いトゲ、goldのDROPと王冠が一貫。装飾追加ではなく既存作品の識別性を保持。 |
| B Character/object appeal | 15 | 13 | 冠・白い顔／髭・紫服・赤マントをPC／phoneで識別できる。小型横画面では細部は小さい。 |
| C Background quality | 10 | 7 | 壁と足場・危険物を分離する既存背景を保持。序盤の反復背景以外の新評価はしていない。 |
| D UI integration | 10 | 9 | 同じ色と角形枠、明確なDROP、簡潔なheader HUD、title／pause／retryが統一。 |
| E Composition | 10 | 9 | 横画面で中央Canvas・左2操作・右DROPを分離。PCガイドを保持し、縦画面も操作とfooterが収まる。 |
| F Gameplay readability | 15 | 12 | 赤い危険／平らな灰色床／soft床と主人公を識別可能。HTMLのDEPTH／BESTが補助。小型横画面のCanvas内文字は小さく、初見の判断速度は人間確認が必要。 |
| G Motion/effects | 10 | 7 | レビュアー自身の通常入力で右移動→DROP→落下、押下色の解除、pause停止→再開を観測し、連続2frameを実view。短い観測であり、長期frame pacing・実音・端末FPSを加点していない。 |
| H Production value | 15 | 13 | gameplay／title／pause／resultが破綻せず、ゲーム固有の見た目・帰還・再挑戦が一貫。狭い横画面での小さなゲーム内補助文字は上限。 |
| **合計** | **100** | **83** | **80以上・F/H各12以上を満たす。人間Feel合格とは別。** |

## レビュアー自身の短時間実行

2026-10-19 UTC、DEV4931の667×375／1440×900、compiled4933の844×390。ブラウザ枠を親担当から引き継ぎ、ソース固定中に実施した。終了後に全context／browserを閉じ、枠を返却した。

- consent denied・tutorialCompleted・muteはブラウザ内の明示的な初期fixture。モデル・位置・時刻・得点の書換えはない。外部通信は遮断し、local serverだけへGETする。
- 667×375：通常右キーで3.3481px移動、通常DROP中の2観測間で12.7417px落下。DROP解除、pause中の時計／playerY不変、遊び方の末尾までスクロールして読む→再開を確認。JavaScript例外0。
- 1440×900：通常右キーで3.3565px移動、同様に13.4388px落下。DROP解除・pause停止・help末尾・再開を確認。JavaScript例外0。
- compiled844×390：native touchで練習を開閉し、閉じたdialogが矩形0となりfresh PLAYへ到達することを確認。
- 実viewした自身の画像：667のfalling1／falling2／help、1440のfalling2、compiled-practice-closed-playing。押下中DROPの橙色→解放後黄色、王様と落下距離表示の変化も確認した。

保存済みの実行スクリプト／値／画像は [QA/independent](QA/independent/)（原始証拠 `/workspace/audits/game015-mobile-20261019/independent/` の `run.mjs`、`review.json`、各PNG）。親担当の統合QAと、この独立実行の範囲を混同しない。初回inline collectorは括弧の構文エラーでブラウザ起動前に終了したため、修正したcollectorを1回実行した。製品ソースはその間変更していない。

## 残る限界と判断

未解決のレビューblockerは見つからなかった。共通練習dialogの失敗は上記のcompiled実操作で修正を独立確認した。本レビューは公開の承認や人間の操作快適性を代行しない。

物理iPhone Safariの上下バー展開／縮小・切り欠き・横持ち親指操作・実際のタッチ遅延・聴感・長時間FPSは人間／実機確認が必要。特に667×375ではCanvas内HUDが小さいため、HTML HUDで数値を補えることと実際の敵／足場の見分けやすさを本人に確認してもらう。今回の短い移動証拠から「面白い」「両手で快適」とは認定しない。
