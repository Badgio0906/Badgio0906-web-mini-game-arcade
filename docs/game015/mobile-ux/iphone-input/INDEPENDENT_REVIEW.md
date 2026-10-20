# 表示012／内部Game015 — iPhone入力取消の独立レビュー

2026-10-20 UTC。担当 `/root/game015_ui_review`。**固定候補のコードと下記Chromium操作では未解決の技術的blockerなし。ただし物理iPhone Safariの症状解消は未確認、Canvas幅揺れの原因はUNKNOWN。** 作者の実機評価・公開承認を代行する判定ではない。

対象は表示012「落下キング」＝内部 `game015`／`game015.html`。表示013は内部Game016であり、今回変更しない。基準はPR #11の既存候補 `e88245a9ce92c5aed3e1b1b990c4ee0cfddff5b9`。main `47c6cfe`と未公開PRを混同しない。

## 固定ソースとレビュー範囲

| ファイル | SHA256 |
|---|---|
| `src/games/game015/FallBoard.ts` | `e939d2122d817f1fe682dfbf87886d459fe55f8b43509a17dbc9e8f8a64db584` |
| `src/games/game015/style.css` | `525854fc15b66d675b9ae96a2f4690512eae363cbc32f38045ef0ac505493c38` |

実行終了後も上記SHAを照合した。製品ソース、Git、設定、外部API、CI、公開操作はレビュー担当が変更していない。今回の製品差分は入力adapterと操作面の選択抑止CSSだけで、main.ts／Analytics／物理モデル／保存／描画・レイアウト寸法には差分がない。

## コードレビュー

- document captureでpointerup／pointercancel／keyupを観測し、他UIやShadow DOM側のbubble停止で既存入力の解除が隠れる経路を減らす。既に受け付けたキーの解除であり、設定画面内の新しい押下をゲーム入力へ変換しない。
- capture所有者を保持し、全解除では所有者と入力mapを先に消してから明示的にreleasePointerCaptureする。単独解除でも所有者・touch所属を先に削除する。同期または後続のlostpointercaptureが再入しても同じ入力を復活させない。
- touchend／touchcancelのfallbackは、`touches.length === 0` の明確な最終解放だけでtouch由来pointerを解除する。keyboard／mouseを消さず、Touch.identifierとpointerIdを同一視しない。強制タイムアウトは導入していない。
- contextmenuの既知pointerIdが所有mapにある場合は、その1接点だけを解除し、同じボタンを押している別の指も保持する。identityを持たない一般的なselectstartでは、対象controlに属する接点を解除する安全側のfallbackとなる。他controlとkeyboardは維持する。
- selectstartがText nodeをtargetにする場合は親Elementへ正規化する。防止対象はCanvasと操作欄だけで、メニュー・通常の説明文・解析設定を一律選択禁止にしない。CSSも操作欄の子孫とCanvasへ限定される。
- visibilitychangeのadapter解除を追加しているが、**既存main側にも非表示時のpause→解除はあった**。本番全体で以前visibility解除が皆無だったとは判定しない。
- 入力解除は既存のhorizontal／heldDropフラグをneutralへ戻す。位置・速度を強制停止せず、既存の慣性を維持する。解除直後の移動量だけを「入力が残っている」と断定しない。

## 自身の通常ブラウザ実行

親担当のブラウザ枠を引き継ぎ、固定DEV4931の844×390／667×375と、固定compiled4933の390×844で実施した。終了後に全context／browserを閉じて返却した。

ブラウザ内のtutorialCompleted／mute／consent deniedは明示的な初期fixture。位置・得点・時計・モデルは書き換えていない。外部通信を遮断し、通常のCDP touch／keyboard／mouseを使用した。

全3ケースで以下が成功し、JavaScript例外は0だった。

1. keyboard右を保持しつつ、native touchの左＋DROPを同時押し。touch終了で左／DROPの押下表示が消え、keyboard右だけが残り、keyupで右も解除された。DEVでは解除後snapshotのhorizontal=1も読み取った。
2. 同じ左ボタンへnative2接点を押す。実際のgotpointercaptureを観測後、既知pointerIdを持つcontextmenuの**合成イベントfixture**で1接点だけを取消し、もう1接点の押下を維持した。
3. 続いてボタンText nodeへ一般selectstartの**合成イベントfixture**を送るとdefaultPrevented=true、残る左入力も解除された。後続native TouchMoveで実際のlostpointercaptureを観測し、touchEndで後始末した。これはSafariの長押しメニューそのものを再現した証拠ではない。
4. pauseの「遊び方」を開き、通常mouse dragで実際に `← → / A D で移動` を選択できた。説明段落上のselectstart／contextmenuも防止されなかった。
5. 通常操作で解析設定を開き、拒否ボタンが動作し、保存状態deniedを維持した。
6. 再開後に通常のゲーム進行でresultへ到達。結果を注入せず、844では天井終了・4m／6.5秒の結果画像を得た。

初回collectorはnative captureが次のpointerイベントで実現する前にgotpointercaptureを待ち、timeoutした。製品不具合と判定せず、native TouchMoveを挟んでgot／lostを待つcollectorへ修正した。初回スクリプトと失敗結果を別名で保持し、製品ソースはその修正時に変更していない。

### 自分で実viewした最終フレーム

- [844 playing](QA/independent/844-playing.png)
- [667 playing](QA/independent/667-playing.png)
- [390 playing](QA/independent/390-playing.png)
- [844 paused](QA/independent/844-paused.png)
- [844 natural result](QA/independent/844-result.png)

Canvas／操作／解析設定の見切れや、前候補からの新しい縮小は上記画像に認めなかった。resultの下にある任意共有欄は文書スクロールで到達する従来構成であり、playingのCanvas見切れと混同しない。今回は新しい美術・レイアウトの承認点数を付けない。

実行証拠：[script](QA/independent/run.mjs)／[結果JSON](QA/independent/review.json)／[初回collector](QA/independent/run-initial-capture-wait-failed.mjs)／[初回失敗](QA/independent/initial-capture-wait-failure.json)。原本は `/workspace/audits/game015-iphone-20261020/independent/`。親担当が同名で上記QAディレクトリへ保存する。

## 確認できた問題とUNKNOWNの分離

親担当は旧PRで終端pointer／lostcapture欠落を意図的に作ると残留入力になるRED、修正版ではnative最終touchendで解除するGREENを記録した。これは**イベント欠落への耐性**の証拠であり、物理Safariで今回どのイベントが欠落したかの特定ではない。24adapterテスト・1135件の全体テスト・固定ブラウザ171確認は親担当の実行範囲とし、本レビュー自身の3ケースをそれらへ重複加算しない。

Canvas幅揺れについて、main／旧PRの固定viewport計10条件・140sampleと、実際の長短status文を同期差し替える表示fixtureのログを読んだ。確認範囲のCanvas座標・寸法rangeは0だった。当初の「status折返し→cqh寸法変化」という仮説はこの証拠で確認できず、原因としない。mainは直接dvh、PRはcontainerサイズ依存という違いもあり、両方へ同じ原因を当てはめない。幅揺れは**未再現・原因UNKNOWN、無関係なレイアウト再設計なし**という扱いが妥当。

## 限界と残る実機確認

- WebKit／物理iPhone Safariは未実施。Safari固有の長押し選択・callout・アドレスバー・viewport変化が解決したとはまだ言えない。
- touch終端が1本だけ欠落して他の指が残る場合、最終touch0 fallbackだけではどの接点が終了したか分からない。既知pointerイベントでの個別解除と、全指終了での復帰を区別する。identityのない一般選択イベントでは影響controlの複数接点を安全側に解除する。
- 10秒のadapter保持はRAFを進めない単体fixture。通常ゲームの3／10秒操作中に正規終了した証拠を「10秒間の生存・有効入力保持」と呼ばない。
- 実機での再確認は、長押し→画面外→全指解除、左右＋DROPの指別解除、選択メニュー発生時、復帰・回転後のfresh入力、通常説明のコピーを行う。解除後のhorizontal／heldDropと慣性を分けて見る。
- 原因UNKNOWNのCanvas揺れは、発生時URL／本番かPR候補か、向き、Safariバー、inner／visual viewport、status高、Canvas DOMRectと動画を同時に記録してから追う。人間の操作快適性・面白さも引き続き本人確認が必要。
