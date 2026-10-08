# 提供素材の採用記録

ユーザーから本チャットへアップロードされた「掘って、埋める用テクスチャ.zip」の8画像を採用。指示書の想定英字名ではなく、日本語の実ファイル名／内容／原本SHAにより対応を確認した。作者や生成サービスの権利を独立に保証したものではない。外部ゲーム素材は追加していない。

原本ZIP SHA256: `24b0e29dce1234d7d23d9e549cb9cb5d20e870ee3f4ce6d2a8aa728a58c34a0c`。各原本は非公開`assets/game031/textures-a/v1/sources/`へコピーし、元アップロードは変更していない。公開ディレクトリには最適化WebP16枚と正規化manifestのみ。

[原本・加工・配信対応台帳](../../../../assets/game031/textures-a/v1/source-index.json)／[加工・権利メモ](../../../../assets/game031/textures-a/v1/RIGHTS_AND_PROCESS.md)。全原寸1254×1254 RGB PNG、透過なし。Block1苔土／2土／3石／4白石／5深部岩／6青結晶／7琥珀鉱／8暗色結晶、AIR0・境界9には提供画像を割り当てない。標準512、軽量256、LANCZOS縮小＋WebP quality90。正確な処理と各bytes/SHAは台帳の値を優先する。

[準備スクリプト](../../../../scripts/game031/prepare-textures.py)は入力フォルダを引数指定でき、通常CIは採用済み公開WebPだけで成立する。原本・公開16画像のdecode/dimension/hash一致、同原本から再生成した17公開fileの同一hashを検証した。

8素材それぞれ3×3繰り返し、元画像／縮小後／圧縮後を実viewして採用。目立つ硬い格子境界を確認せず、シーム補正・全面ぼかしは実施していない。完全シームレスの保証ではない。深部岩だけの粗い四角模様は提供原本の特徴であり、他素材を粗くしたり無断交換していない。

使うマップはBase Colorのみ。Normal、Bump、AO、Height、Metalness、Roughness、Emissionの推定画像は作っていない。標準画像8枚360,748bytes、軽量画像8枚112,120bytes。WebP縮小は転送量の削減であり、GPUメモリはRGBA8の10layerとmipmapとして別計算する。概算標準13.33MiB／軽量3.33MiBで、GPUドライバ内部割当の測定値ではない。
