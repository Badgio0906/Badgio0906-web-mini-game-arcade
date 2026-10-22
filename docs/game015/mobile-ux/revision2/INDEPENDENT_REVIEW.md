# Game015 横画面UI revision2 — 独立レビュー

2026-10-19 UTC。実装担当と別のレビュー担当 `/root/game015_ui_review` がコード・実画像・compiled版の通常タッチ操作を確認した。**確認範囲に未解決の技術的blockerなし。作者の再承認は別途必要。**

## 前回判定と今回の受入条件

作者は初回案のCanvas縮小（844×390で304→250px、667×375で289→235px）を明確に不採用とした。前回のVisual83点はその作者判断を覆すものではなく、初回案を採用済みとも扱わない。今回のレビューは、Canvasを縮小せず、操作部と解析設定・プライバシー導線を空き領域へ収めたrevision2を対象とする。以下の得点も作者の操作性評価や公開承認を代行しない。

基準HEAD `85d6fa9d3917f9cbedadb922c04778d48514cb38`。レビュー中の最終ソースSHA256：

| ファイル | SHA256 |
|---|---|
| `src/games/game015/style.css` | `03a3c5281891f44f9fb39314abb28dffe81cf8a113d1a50b053e1b8be9b9877b` |
| `src/analytics/consentUI.ts` | `7eb6be05b6af6922de236d9b985a3545422b52528e1f420f332fdac4ad7fd138` |

レビュー担当は製品ソース・Git履歴・公開設定を編集していない。ブラウザ枠を親担当から引き継ぎ、最終ソース固定中に実行し、全context／browserを閉じて返却した。

## コードレビュー

- 共通 `consentUI.ts` の差分は既存2要素への `part="settings"` と `part="privacy-link"` の追加のみ。共通CSS文字列、同意表示・許可・拒否・撤回のhandler、保存キー、初回unknown時の表示、既定の高さに変更はない。
- 015の横向きplaying／endingだけで、設定hostを右下へ固定し、既存2要素を `::part()` で縦に並べる。プライバシーリンクにも44pxの高さを明示している。portrait／PC／メニューでは従来の文書フローへ戻る。
- hostにtransform・contain・container-typeを追加していない。同意パネルは既存のviewport基準fixed配置を維持し、狭い右下hostを基準に縮小・クリップされない。
- Canvas／操作を覆わない右側空き領域に設定を配置し、DROPの下に間隔を設ける。live-statusは左右のrail幅を除いた中央領域へ制限する。hostの最小幅は120pxへ調整され、内部paddingを引いても設定ボタンの自然幅を収める。
- 初回から引き継いだゲーム入力・物理・保存・記録・描画コードを今回再変更していない。ゲームループへDOM処理、viewport監視、外部API・ライブラリを追加していない。

共通ファイルへのpart公開は表示用の小さい変更であり、Analyticsの挙動変更ではない。外側の015固有CSSを読み込まない他ページには新しい見た目の指定がなく、共通既定表示を変えるコード差分もない。他ゲームの全画面実行は本レビュアー自身の実施範囲ではない。

## Canvasと構成の実確認

親担当の固定compiled7サイズ×5状態のDOMRectと844×390／667×375の画像を確認し、レビュアー自身もその2サイズで最終compiled4933を起動・撮影して実viewした。

| 条件 | 最初の既存版 | 不採用の初回案 | 今回revision2 |
|---|---:|---:|---:|
| 844×390 Canvas高さ | 304px | 250px | **314px** |
| 667×375 Canvas高さ | 289px | 235px | **299px** |
| 932×430 Canvas高さ | 344px | 290px | **354px** |

844のCanvasは約179×314px、667は約171×299pxで256×448比を保持する。初回案より64px高く、最初の既存版より10px高い。天井・床・HUDを切り取って大きく見せる方法ではない。これは作者指摘に対する具体的改善事実であり、数値だけで作者の快適性を認定するものではない。

大きな説明欄は引き続き横画面playから省き、左右112×64px・右DROP128×88pxを独立したrailに置く。ゲームを挟んで両側の操作を分離し、初回案の巨大な操作面積をCanvasのための空間へ戻している。解析設定とプライバシーは右下の2行に常時残り、中央Canvasや状態文と重ならない。実画像では設定とDROPの間も区別できる。Canvas内の足場・赤い危険・王様は初回案より大きく表示される。

## レビュアー自身のcompiled実操作

対象は最終compiled4933の844×390と667×375。ブラウザはChromiumのモバイル・touchエミュレーション。tutorialCompleted、mute、consent deniedをブラウザ内の明示的な初期fixtureとして使い、モデル・位置・時刻・スコアは変更していない。外部通信は遮断し、本実行で外部リクエスト試行は0だった。

両サイズで次を確認した。

1. native touchで左とDROPの2接点を同時に押し、両方の `data-held=true` と視覚的押下表示を確認。180ms後の実画像で王様の左移動・DROP／FALL表示を観測。
2. native touchEndで両方が `data-held=false` となり、DROP色が黄色へ戻ることを確認。解除後の実画像では落下中の王様と増加したFALL表示が見える。
3. 右下の設定をtapし、パネルの許可ボタンへfocusが移ることを確認。
4. 許可→設定を再度開く→許可しない、の通常操作で同意キーが `granted`→`denied` となることを確認。撤回導線は失われていない。
5. パネルを開いたままportraitへ回転。844由来の390px幅ではleft10/right380、高さ319.5px、667由来の375px幅ではleft10/right365、高さ319.5px。狭い右下カードを基準とせず、viewport内で読めるパネルのまま維持された。「今は選ばず閉じる」もtapできた。
6. 横画面へ戻り、設定ボタンとプライバシーリンクが各44px高であることをDOMRectで確認。844では幅132px、667では約112px。
7. プライバシーリンクを実際にtapして `./privacy.html` へ到着。既存title「プライバシーと解析データ設定 — GAME100 GARAGE」を確認。JavaScript例外0。

初回collectorではプライバシーページのtitleを誤って想定し、そのassertionだけで終了した。既存の実ソースと照合してcollectorを修正し、製品ソースを変えずに両サイズを再確認した。初回collectorも別名で保存し、製品不具合として扱っていない。

自分で実viewした画像：844／667のplaying、667のtwo-thumb／released／panel-rotated。生証拠は `/workspace/audits/game015-mobile-revision2/independent/` の `run.mjs`、`review.json`、各PNG、初回collector。親担当の8viewport同意検証・Game001既定表示・161機能検証・safe-area fixtureと、自身の上記2サイズ実行を区別する。

## Visual評価

| 項目 | 配点 | 得点 | 根拠・上限 |
|---|---:|---:|---|
| A Visual identity |15|13|navy坑道、赤い危険、冠の王様とgold操作の既存identityを保持。|
| B Character/object appeal |15|13|冠・顔・紫服を識別でき、初回案より大きい。狭い横画面では細部に限界がある。|
| C Background quality |10|7|既存の壁と前景分離を維持。今回の評価は序盤の実画面に限る。|
| D UI integration |10|9|操作と設定を別の領域へ配置。設定・撤回・privacyは読みやすさと44px高を保持。|
| E Composition |10|9|Canvasを主役へ戻し、左右操作とDROPを分離。右下の設定は常時到達可能。|
| F Gameplay readability |15|13|314／299pxのCanvasで王様・赤い危険・足場・FALLが初回案より大きく判読でき、上部HTML HUDも残る。最小画面の補助文字・人間の判断速度は別確認。|
| G Motion/effects |10|7|自分のnative2接点で左移動／DROP／解除の実状態と連続画像を確認。長期FPSや物理端末の滑らかさは評価していない。|
| H Production value |15|13|既存のゲーム／HUD／入力色と設定導線が矛盾せず、パネルのfocus・回転・撤回も成立。|
| **合計** | **100** | **84** | **技術的Visual gate80以上・F/H各12以上。作者承認や人間Feel合格ではない。** |

## 未確認と判断

今回のコード・実画面・短いcompiled実操作で修正必須の問題は見つからなかった。作者が拒否したCanvas縮小は解消し、元の既存版より高いCanvasを確認した。作者には844×390／667×375の比較と右下設定の見え方を提示し、再判断を待つ。

物理iPhone Safariの上下バー・切り欠き・横持ち親指の快適性、長時間FPS、実際の入力遅延・聴感は未確認。Chromiumの回転やsafe-area fixtureから実機合格を生成しない。許可後の本番Analytics送信、広告、CMP、管理画面や本番公開には一切操作していない。

## 保存用証拠リンク

親担当が生証拠を同名で `QA/independent/` へ保全するための対応先：

- [実行スクリプト](QA/independent/run.mjs)／[実行結果](QA/independent/review.json)
- [844 playing](QA/independent/844-playing.png)／[667 playing](QA/independent/667-playing.png)
- [667 同時押し](QA/independent/667-two-thumb.png)／[667 解除後](QA/independent/667-released.png)
- [667由来のportrait同意パネル](QA/independent/667-panel-rotated.png)
- [初回collectorの誤ったtitle assertion](QA/independent/run-initial-title-assertion-failed.mjs)

保存済みの独立実行証拠: [QA/independent](QA/independent/)。
