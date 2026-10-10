# Game032 revision02 — 独立公開QA

対象公開URL：<https://game100garage.com/game032.html>。期待runtime commit `5eb81b95ae8b4d14f98931f44ada7dec4b4440c3`、公式Pages run `38043219921`。実装担当の配信193ファイル照合は [VERSION](QA/public-version-01/VERSION.json) に分離されている。以下は別QA担当の実ブラウザ操作で、byte照合そのものや公式CIを独立して再実行した記録ではない。

## 公開ゲーム画面

2026-10-10 19:01:11〜19:03:41 JST（10:01:11〜10:03:41 UTC）、ローカル固定候補で成功した **同じcommitted runner** を公開URLに対して実行した。

```sh
NODE_USE_ENV_PROXY=1 GAME032_QA_URL=https://game100garage.com GAME032_QA_OUT=docs/game032/revision02/QA/public-browser-UNIQUE node tests/game032/revision02/qa.mjs
```

[REPORT](QA/public-browser-01/REPORT.json) は合計 **390項目成功**。内訳はPC1280×900／390×844／320×740／844×390の通常操作379項目、別の明示的FullscreenAPI利用不可fixture9項目、全体のpageerror／POST確認2項目。4画面の通常操作には時計・乱数・モデル・API返答を注入していない。API利用不可fixtureは独立した技術試験で、実ネイティブ操作へ読み替えない。

- 公開版で本番魚を各画面1匹、計4匹釣り上げ、5分の完了前に魚の種類／最大サイズ／最大魚と最新魚の日時／履歴が保存されることを確認。再読込の保存bytesと表示の日時が一致する。
- 練習ルアー釣果を各画面1匹、計4匹取り込み、永続魚記録へ混ざらないことを確認。
- 全画面の川で通常入力の釣り、Pause／再開、記録と水槽の全画面観賞、魚の実時間の泳ぎ、戻る操作、ESC／touchcancel／縦横変更、Portalへの実到着を確認。4画面でネイティブ`#app`全画面が成立し、非対応fixtureでもCSS全画面と退出が機能する。
- 観賞中の釣行時計とphaseを停止し、魚の観賞時計だけ動く。実viewport PNGの青緑の水槽画素も検査し、DOMがopenだけで描画成功と判断していない。水槽見出しと共通Portal代理リンクの重なりを解消した公開画像を確認。
- Game032の34source／HTML／全22WebP／fontとrunnerの開始・終了SHAは不変。pageerror0、POST試行0。4回のPortal帰還で意図的に停止したAds／Analytics GETに対応するconsole `net::ERR_FAILED`8件がある。console error0とは報告しない。

代表画像は同じディレクトリの `pc-gallery-viewport.png`、`phone-gallery-viewport.png`、`small-fullscreen-ready.png`、`landscape-fullscreen-pause.png` 等。`*-gallery-swim-start.png`／`*-gallery-swim-next.png`は約1.25秒差の通常描画で、合成した魚配置ではない。

## 公開Portal

ゲームQA終了後にブラウザを閉じ、別の [public-portal runner](../../../tests/game032/revision02/public-portal.mjs) をPC1280×900／スマホ相当390×844で順次実行した。 [REPORT](QA/public-portal-01/REPORT.json) は **28項目成功**。

```sh
NODE_USE_ENV_PROXY=1 GAME032_EXPECTED_SHA=5eb81b95ae8b4d14f98931f44ada7dec4b4440c3 GAME032_QA_URL=https://game100garage.com GAME032_QA_OUT=docs/game032/revision02/QA/public-portal-UNIQUE node tests/game032/revision02/public-portal.mjs
```

- 各fresh contextで既存の解析同意選択UIが表示され、拒否を実操作できた。
- 31作品のカード、退役010の不掲載、Game032の表示、実サムネイル640×360のdecodeを確認。
- 44px以上でcenter hitするPLAYをクリック／タップし、Game032の公開URLと新しい「魚の記録」「水槽を眺める」のタイトル操作へ到着。実帰還リンクでPortalへ戻り、31カードが維持される。
- Portalの既存AdSense scriptが開始／帰還後とも存在する。広告の配信成功を意味しない。
- source／runner SHA不変、pageerror0／POST0、全context／browser終了済み。

公開版への5分の仮想時計試験・架空RUNの外部送信・新しいAnalytics呼出は行っていない。解析同意拒否、全POST監視、許可先外Ads／Analytics GET停止を維持した。実機iPhone／Androidの制約・触感・発熱、聴感、人間のrevision02新機能の使いやすさは未確認。ユーザーの「楽しさはそこそこイイ感じ」はrevision01への既存感想であり、revision02の人間合格とは別である。
