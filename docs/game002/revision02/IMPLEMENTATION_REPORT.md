# Game002 バイク1000m加速 revision02

2026-10-15 JST。第2工程。実装担当によるモデル／表示／単体検証を記録する。独立QA／Visual／Feel／本番公開／本人試遊は統合工程で別途記録する。

バイク選択は現行どおり2000m。乗車時点を保存し、そこから1000mごとに速度2.0→2.25→2.5→2.8→3.1→3.4→3.7→4.0（上限）、得点倍率1→1.5→2.2→3.2→4.5→6→7.5→9→10.5（上限）。通勤1000m、徒歩継続は既存の速度・入力・配置を保持する。ランダムな1／2レーン障害物とNICE条件を維持。

スコアは過去区間を再評価せず、乗車前の通常距離＋各1000m帯の積分＋通常距離への従来NICE加算。例：4500m（乗車2000m、NICE3）=2000+1000+1500+500×2.2+450=6050。NICE倍率を加速済み距離へ重ね掛けしない。

距離／背景のworldTimeと障害物のroadTimeを分離。障害物速度は2.0→最大2.6で、車速4.0でも可視予告1.5秒、最終レーン確定から衝突まで0.60秒以上。bike波間隔2.7 road秒で、常に1レーン以上通過可能。横移動はroadTimeに従い、2レーンも連続入力で実移動する。50ms上限＋240Hz substepの連続衝突を維持。SPEED／BONUS表示、短いSPEED UP文字演出、音、背景スクロールで加速を示す。

## 記録統合

- rules／presentation `2`。旧 `best`／`bestScore`は読み取り表示のみで保持。新 `bestDistanceV2`／`bestScoreV2`へ保存。
- 新board／local reader／Analytics version正本の統合はroot担当。旧結果を今回のRUNとして送らない。
- 出社フラグと従来の出社時間は通勤ルール不変のため維持。

## 検証

対象既存25件PASS（game002、workday-escalation、revision-features）。追加game002-acceleration 3件PASS：乗車相対境界、区間積分／NICE単独、4seedを通常adjacent入力で12000mまで全加速段階＋上限高速域へ到達。可変dt 1/120・1/30・50ms、可視時間／最終レーン反応時間、ポーズ相当無step、長フレーム50ms制限、再開始を確認。

既存継続テストは加速後にworldTimeを障害物操縦へ使い3265mで衝突。Jev 1 finding実HTTP200（判断を伏せた独立調査）後、roadTimeへ更新し全5seedの5200m継続PASS。過去の初期bike敵データ完全一致は今回予兆が異なるため形状／初期位置一致へ更新。[Shadowログ](QA/JEV_SHADOW.jsonl)。Jevは公開判断をしない。

全体TypeScript確認では対象ファイルエラーなし、同時編集中のGame003の未完了エラーが出た。最終check/buildは統合担当が固定sourceで再実行する。実ブラウザ／高速度での人間の反応／実機の音・面白さは未検証。


## 一括改修の最終統合・公開状態（2026-10-16 JST追補）

今回のcanonical runtimeは `57dce24977e4d3c7dfd42e99315c67fa07bb0243`。12作品×4画面のcompiled48組とPortal27作品のroot/subpath150項目を確認した。固有の通常RUNと後追い限定差分は [source chain](../../catalog-reorganization/QA/FINAL_SOURCE_CHAIN.json) に分離し、過去の失敗原本を保持する。最新の公式workflow・公開commit・配信SHA・実公開操作は [公開記録](../../catalog-reorganization/PUBLICATION.md)、ゲーム別結果と本人/実機/聴感の未実施範囲は [最終報告](../../catalog-reorganization/FINAL_REPORT.md) を正本とする。以前の「準備中」は各記録時点の履歴。
