# FIREWORK MAKER QA

モデル5件PASS。[単体テスト](../../tests/unit/game033.test.ts)。実行済み範囲とJev findingは[実装報告](IMPLEMENTATION_REPORT.md)を参照。

固定build後に通常入力collectorを実行する：

```sh
GAME033_BASE=http://127.0.0.1:4933 GAME033_REPORT=docs/game033/QA/fixed-native-01 node tests/game033/native.mjs
```

collectorは4画面の説明／無制限練習／通常花火／pause／帰還を操作し、phoneで実100秒RUN→結果→3幅で結果回転→retryを検証する。モデル改変・強制結果は使わない。実行前後の033source hash一致、BEST練習除外、保存reload、POST/pageerror、44px/viewport内を報告する。初回固定production実行はdesktop/phoneの通常操作とphone自然100秒結果まで通過したが、320×568の説明modalで全action同時表示assertionによりFAILした。初回原本は [report](QA/43deb-native-01/report.json)、source一致は [hash記録](QA/43deb-native-01/source-verification.json)。不足320/844は `GAME033_VIEWPORTS=narrow,landscape` で限定追補し、modalの各actionは通常scroll到達後のviewport／dialog内clipを測る。独立Visual／Feelは別担当の実画面レビューへ渡す。

collectorは初回document前にAnalytics consentをdeniedへ設定するQA fixtureを使用する。製品の同意UI／仕様は変更しない。全非GETリクエストをcontext routeで遮断し、試行があれば報告する。外部広告GETは空のmock、Analytics GETは503のoffline fixture。BESTの初期fixture123は未保存時だけ入れ、reloadで実RUNの保存結果を上書きしない。

追補 `43deb-native-02` は320×568／844×390の通常scroll／説明／練習／本番／pause／帰還PASS。初回desktop/phoneの成功と合わせ4case37check群を完了。source不変、pageerror/POST/write0。初回FAIL原本は保持。[最終技術集約](QA/FINAL_NATIVE_QA.json)／[追補原本](QA/43deb-native-02/report.json)。独立Visual／Feel／本人試遊／物理音声の合格を意味しない。
