# Game031 技術QAと証拠の読み方

基準main dd31ed5818893c1e45c0af304a55f61aab7acc2dから隔離実装。QAごとに独立出力先を作り、失敗画像・状態・ソースhashを保持した。ディレクトリ名の日付は実行時刻の根拠にせず、各REPORTのat/checked_atを参照する。通常入力、読み取りだけの目標計画、保存／負荷fixture、独立実画像、本人試遊を区別する。

## 完了済みの基礎・保存試験

- model17、save41、input14、新作登録を含む全体816tests/71filesの初回統合PASS。ROOT_TEST_01.txt。最終統合結果は実装報告で別記する。
- PhaseA32³：水平穴へ通常歩行、中心に立って足元を掘った落下、20採掘＋導入3／8配置、帰還・ジャンプ・保存復元。phase-a-extended-20261007T233518Z/REPORT.json。初回は身体が隣の床にも乗っていた試験計画を修正、物理を変更して合格にしなかった。
- 自分で置いた段差をジャンプで登る、橋を置き支持ブロックを掘っても固定を保持。independent-building-20261007T2339Z/REPORT.json。
- 実IndexedDBの遅延transactionで明示終了の最新snapshotを検証、未対応generator2を無断置換せず原本書出し／確認。native-save-20261007T233252Z/REPORT.json。
- native-IDB final128-world stress: storage-native-20261007T235356Z/REPORT.json。1,000/5,000/10,000座標の最終差分、元地形に戻した差分除去、savecapture後の追加編集、txabortで旧保存保持、QuotaExceeded注入、deny/blocked/破損/不正import/安全位置復帰。容量不足は失敗注入であり、実端末容量を使い切った試験ではない。

10,000変更fixtureは48Chunk・JSONバックアップ67,068bytes、save2.3ms/load1.7ms/復元38.8ms。この環境の単発測定であり、端末のIndexedDB割当容量や全スマホ性能ではない。5,000採掘＋5,000配置という合成統計は通常入力の実績へ数えない。

## 通常入力・描画

同じ世界で100採掘/50配置を目標にfull-world-normalの独立出力先へ実行。初回は103/13でプレイヤーが自分の配置に囲まれ、候補計画が停止した。身体内配置禁止が正しく働いたことを独立再構成で確認し、地上帰還や移動による計画を見直した。失敗REPORTを削除せず、再実行の結果は実装報告で示す。

スマホ相当はCDPのtrusted複数指でmove/look/DIG/place/cancel/lostcaptureと素材選択を検証する。実機の触感・発熱・音の証明にはしない。最終128世界、公開版でのPC/phone10採掘5配置・保存復元は、それぞれのREPORTを参照する。

WebGLはChromiumのSwiftShader software GPU。frame-time/FPS/drawcalls/triangles/dirty/editlatencyは測定条件付きで記載する。品質設定は表示のみ、世界の寸法・seed・差分・所持を変えない。アクティブ時間は実装上の上限付き進行dtで積算し、大きな処理落ちでは壁時計時間と一致しない。

## 外部サービス

Worker実ローカルD1: integration-20261007T233014Z/WORKER_LOCAL_D1.json、42合成events/13RUN。新作031匿名集計、admin/Codex認証分離、GET専用、未実装032・生world情報拒否、既存ingest回帰。Cloudflare本番権限不足のため登録と031外部送信は保留。QAは同意拒否＋必要な外部送信abort、架空RUNを本番へ送らない。

人間試遊はHUMAN_PLAYTEST.md、Jevの実呼出と独立判断はJEV_USAGE_REPORT.md。Jev・点数・CIだけを公開許可や面白さの代行にしない。
