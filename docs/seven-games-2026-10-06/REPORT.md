# 既存7作品・改訂02 — 統合報告

対象003／006／007／008／009／010／018の実装・個別QA・独立レビュー・関連データを更新した。公開状態の正本は末尾の公開記録。Game015／019は対象外で、本人の最新評価「とても面白くなっていた。イイ感じ」をCURRENT_STATUSへ記録した。その評価を全機能・全端末検証へ拡張していない。

[依頼原文](REQUEST.txt)。同じnativeエンジンを維持し、広告／CREDIT／本番API／Jev自動修正／DNS変更は行わない。ブランチ、レビュー、main、CI、公開URL、本人試遊を別状態として記録する。

|作品|変更したこと／維持したこと|実行証拠と独立判定|
|---|---|---|
|003 我が国の建築は世界一ぃ！|全支持面・同一密度の重心判定、回復する左右芸術ペア、3実練習、新旧BEST分離。フル幅、中央PERFECT6px、15mC国、速度2／P3維持。|[実装と初期→最終配点](game003/IMPLEMENTATION_REPORT.md)、18対象単体、4画面native、実22階→C国。[独立83／F12／H13](independent/game003/INDEPENDENT_REVIEW.md)。|
|006 ギリギリ駐車|3導入後の安全／挑戦枠、同じ円弧上の一度の有限ブレーキ、実車体clearance、限定near-miss。角度→パワー、禁断×2、無制動旧結果維持。|[実装](game006/IMPLEMENTATION_REPORT.md)、18単体、旧5入力bit一致、4画面native。[独立88／F14／H13](game006/INDEPENDENT_REVIEW.md)、実11台／禁断＋挑戦。|
|007 まだ乗れます|目的階／期限／配達点／将来待機を見て容量予約、途中出発、10Fと任意14F追加便。上行き・450kg・既存人物素材維持。|[実装・方策比較](game007/IMPLEMENTATION_REPORT.md)、8単体、4画面実10F＋14F。[独立81／F12／H12](independent/game007/VISUAL_REVIEW.md)と[Feel](independent/game007/GAME_FEEL_REVIEW.md)。|
|008 コーヒーこぼすな|陶器／暗い液体／取っ手／トレー／両手を authored描画、慎重／急ぐ、予告hazard、締切、任意2杯。左右支え・既存廊下方向とURL維持。|[実装](game008/IMPLEMENTATION_REPORT.md)、5単体、3方策比較、4画面実配達＋phone追加。[独立84／F13／H12](game008/VISUAL_REVIEW.md)、横の潰れを修正・別担当再view。|
|009 印鑑どこですか|26専用形（非印鑑24）、特徴指定、紙の実遮蔽とめくり、机3問再利用、軽い整理コスト。邦題・英題・机の素材方向維持。|[実装](game009/IMPLEMENTATION_REPORT.md)、8単体、4画面75秒／24品／scroll。[独立83／F13／H12](independent/game009/INDEPENDENT_REVIEW.md)、実3練習と26素材view。|
|010 会議、聞いてます？|内職／監視を廃止し、担当・作業・期限の決定と訂正、2回聞き返し、3議題＋追加、12手作り異構造。タイトル／人物素材／URL維持。|[実装](game010/IMPLEMENTATION_REPORT.md)、8単体、30seed方策比較、4画面実3議題＋入力境界。[独立12＋練習の意味確認](independent/010/CONTENT_REVIEW.md)、[Visual83／F14／H12](independent/010/VISUAL_REVIEW.md)。|
|018 靴とばそ|固定長の自然な膝／8pose、commaメートルHUD、UFO正確+500ms、JUST必ず5靴演出、条件付き3レア。5靴の物理／得点／従来BESTを維持。|[原因・値・確率・比較](game018/IMPLEMENTATION_REPORT.md)、38単体、20同入力の全軌道と得点一致、seed10,000分布。[独立poseとnative](independent/018/)。Visual84／F13／H12。late JUST描画の限定再検証も同所。|

上記のVisual点は実画像を見た独立AIの評価で、人間の面白さを意味しない。全7の技術的Feelを別担当／別工程で実行。通常mouse／keyboard／touchscreen inputとreadonly観測で進め、モデル位置・時計・得点を変更したプレイをnative証拠にしていない。probability0/1やstorage拒否、hidden fixtureは明示した技術検証として分離。

## 統合QAと保存・素材

- [全体単体](QA/unit-integration.log)：36ファイル、315 PASS。他作品のモデルも含む。各ゲームの個別QAを終えてから最終統合した。
- [本番build](QA/build-final-assets.log)：TypeScript／Vite成功。既存Phaser大chunk warningは残る。新共通SDKやエンジン移植なし。
- [compiled production](QA/production-summary.json)：全7×4サイズ（1920×1080、390×844、320×568、844×390）、通常起動・実操作・pause／再開・mute再読込・font／画像HTTP、debug getter不在。repository prefixでも全7起動。個別の長いRUN・練習・BEST・入力repeat・phase跨ぎ・hidden・retry・storage拒否は各ゲームreportにあり、短い統合smokeだけで代替していない。
- 原本は保持。[最初の統合collector失敗](QA/production/FIRST_FAILURES.md)はIDの仮定、gesture guard待機、lazy画像読込の誤り。製品変更なしで失敗16profileだけ再検証。独立018のlate二重靴と擬音遮蔽は別の製品描画不具合として限定修正・再view。
- [範囲保護](QA/SCOPE_PROTECTION.json)：既存217保護ファイル、他12のCatalog entry／プロフィール／サムネイルentryが不変。既存のshared fontもbyte不変。
- [font](QA/FONT_COVERAGE.json)：旧1075glyphすべて保持、新1150、対象の必要日本語0欠落。7作品だけ新URLを使用。元TTFはSIL OFL、reserved familyを改名。unicode fallback装飾は必要日本語と分ける。
- [7サムネイル](QA/THUMBNAILS.json)：実装した通常入力画面の比例crop／resize／solid letterboxだけ。fixture rare／宣伝合成なし。26SVGは[009台帳](game009/ASSET_INDEX.json)、手元は[008台帳](game008/ASSET_REPORT.md)。今回画像生成APIは使っていない。
- [Telemetry／Jev profile](TELEMETRY.md)：7プロフィールとCatalogを更新。外部送信なし、max400／primitive40の既存境界、practiceと本番分離。
- [Jev実4地点と不一致](JEV_REPORT.md)：018A、003B、008C、009B。モデル本文分類を画像合格や公開判断へ転用しない。006／007／010のAPI未使用も明記。

## 人間未実施と残る確認事項

本人の今回7作品の試遊、実機スマホの親指・音声・FPSは未実施。各HUMAN_PLAYTESTに記録。特に003の芸術点と中央点の価値、006の制動の納得感、007の320px将来票（小文字）、008の手の自然さと速度判断、009の細い物のタッチと24品scroll、010の3.8–7秒の読解時間、018のSE／レア体感を本人に確認する。自動成功率・Visual点で代替しない。

018の横Resultは通常ページscrollが必要、320説明は下端に近い。行き止まりではなく通常操作で次の靴／タイトルへ到達できることを確認し、strict初期viewport検査のFAIL原本を全PASSへ改変していない。007の将来票小文字と009の細いshape hitも実機確認として残す。

## 公開記録

**正式HTTPS公開済み。** [ゲームセンター](https://game100garage.com/)／[PR #4](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/4)はmainへmerge済み。runtime main `58718f908c7e9432d3deff3f3c32ff629b2d4455`、[Pages run37413280501](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37413280501)のnpm test／build／deployが成功。

[公開native7](QA/public/native/report.json)は390×844で通常mouse／keyによる起動・操作・pause／resume・mute再読込・font／画像、portal19をPASS。これはスマホ相当viewportの自動ブラウザ確認で、実機touchの本人試遊ではない。実touchscreen入力の各個別4画面証拠は別に残す。[配信比較39file](QA/public/ASSET_HASHES.json)は全HTML／必要JS・CSS・新font・7thumbがHTTP200でローカル最終buildとSHA256一致。Nodeの外部DNSに依存せずsame-origin browser fetch＋WebCryptoで確認した。

[公開記録](QA/PUBLICATION.json)。候補ef17a48、main58718f9、CI／公開確認／人間未評価を別記録にした。最後の公開証拠・CURRENT_STATUS・このreportの追加commitは文書と検証utilityだけで、runtimeを変更しない。
