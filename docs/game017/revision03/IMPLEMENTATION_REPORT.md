# 表示014の雨ゲーム — 改良候補への訂正報告

2026-10-19。ユーザーの意図は既存雨ゲームの改良だった。新作Game038という解釈を撤回し、表示014/内部Game017のrevision03候補へ移管した。番号の一致をCatalog実モジュールで確認し、別作品である内部Game014（指ハート、表示011）には触れていない。

## 実装

038候補のmodel/render/style/assetsをGame017/revision03へ移設。候補HTMLは`game017-revision03.html`、DEV readonly診断もgame017/display014/rules3を返す。既存正式HTML/Catalog/gameVersions/recordDefinition/Worker等は不変。038の製品HTML/source/public assetは現行treeから撤去し、旧QA/raw/履歴はdocs/game038に撤回表示を付けて保持した。新IDの予約・本数加算はしない。

モデル・styleと14個の配信WebPは移設前と同じbytes。renderの参照path、画面の識別、固有保存namespaceを訂正し、旧雨宿りBESTの読取表示を加えた。ImageGenを新たに呼んでいない。背景は既存017の雨の街そのものを保持する。

新BESTは`game017:umbrella-r3:best`、旧`game017:best`と`bestRelayV2`は更新しない。038の誤った試遊BESTも保全するが、新候補へ移さない。旧Portalは引き続きrules2のBESTを読む。新候補の点数を旧オンラインboardへ混ぜず、通信を有効化しない。

## 検証

移設後の型/単体/限定buildと固定sourceの新しいbrowser検査を実施し、この項目へ追補する。移設前のGame038名義の77/20成功・独立Visual81をそのまま新しい実行結果にはしない。旧renderer/sourceのSHAと背景/旧saveの不変も別に確認する。

本人/物理端末/Safari/実音/連続FPS/公開環境・正式採用は未実施。main反映・deploy・PR作成・Actions手動起動/再実行/取消は行わない。
