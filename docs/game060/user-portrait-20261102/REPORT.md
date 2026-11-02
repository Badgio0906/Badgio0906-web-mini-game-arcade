# Game060 左下HUDキャラクター差し替え

2026-11-02 JST。基準main e0dfed9b（PR22 GAPS音源を保持）。添付の人物・端末をImageGenで背景透過化。人物を新規企画で描き直す意図はなく、添付に基づく切り抜き編集。加工済みPNGはassetsとpublicへ保存。左下heroNormalだけに使用。勝利カットインheroSmug・敵・背景・GAPS/audio/model/storageは変更しない。

型検査・対象17tests・個別Vite build成功。通常入力によるPC1280/390/320/844の4画面で起動/一時停止/再開、例外・assetエラー0、HUD可視を確認。390幅実画像を目視し、人物と予約枠の重なりなし。実機未確認。

画像編集ツール: ImageGen、直近のユーザー添付1枚を参照、transparent_background=true、背景と下端青線のみ除去し人物/端末/表情/衣装を保持する指示。出力原本と配信PNGは同一byte。

ローカル候補、未push/未公開。前回の公開1回承認を流用しない。次: 作者が実画面確認→今回分のGitHub/公開費用不明点了承→通常CI/公開。
