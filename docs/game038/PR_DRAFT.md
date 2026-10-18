# PR原稿（未作成）

Title: feat(game038): add local rainy umbrella lane prototype

Base: integrate/game037-game003-20261018（採用準備branchが先にmainへ反映済みなら、その反映後のmainに対する038差分だけに整理）。Head: feature/game038-rain-umbrella。

雨の街を3ラインで進み、通行人の傘を乗り換えて90秒で帰宅する初期プレイアブル。直接雨に濡れた累計3秒で失敗し、相手の属性で加減点する。同じ傘の再入場で得点を増やせない。既存017背景を変更せず、参照付きImageGenで人物9種と家/小物を制作し、透過14assetを同梱した。

初回練習は別ラインの傘への実乗換えを必要とし、BESTを更新しない。pause/入力/拒否された保存を扱い、038のCatalog追加/外部送信/広告/CREDITは行わない。Game037/003採用準備を基点とするが、038の完成版認定/公開は含まない。

Validation: 最終結果は[IMPLEMENTATION_REPORT](IMPLEMENTATION_REPORT.md)。モデル/型/build/固定ソース通常入力/4幅の証拠と独立レビューを参照。Windows/物理スマホ/Safari/実音/FPS/人間の面白さは未実施。

PUBLIC＋標準runnerの実行時間条件だけではpush費用を確定できず、Webhook403/外部build・deploy条件不明のためPRは作成していない。解除後もpush/PR連動処理を再確認し、main反映でPagesが自動公開する点を別判断する。
