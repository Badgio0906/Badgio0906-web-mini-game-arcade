# 全体BEST・歴代TOP10 STEP 1仕様

基準main `f8b8444dc1d942aba56f23199498226caa38fd22`。正本は `src/data/recordDefinitions.ts` のpublicEnabledで、初期20board。active30、非競争10、Game010退役を維持する。012通常得点、013全RUN OJTなし通常得点、014通常成功回数の既存bridgeとルールをそのまま利用する。

## 参加者と適格記録

参加者は「共有資格情報を保持するブラウザ単位」。厳密な1人1枠・端末間統合ではない。明示共有の直前に32byte暗号乱数を専用localStorageキーで生成する。Web Locksで初回生成をタブ間で直列化し、同じゲーム・別ゲーム・複数RUNで再利用する。Web Locks非対応時は既存資格情報のみ継続可とし、新規生成を安全に停止して説明する。解析browser_id、端末fingerprint、IP、氏名から生成しない。共有OFF・閲覧だけでは作らない。保存拒否時はページ内のメモリだけで継続し、限界を表示する。

サーバーは資格情報SHA-256を照合し非公開UUIDへ結び付ける。公開名は独立乱数の12桁を使う「ガレージ住人 123456789012」形式。数字だけなので自由入力・不適切な単語を含めず、UNIQUE制約と再試行で衝突を扱う。名前を知るだけでは認証できない。資格情報・receipt・管理Secretは公開応答に含めない。

board内でacceptedかつ所有者を確認できるactive参加者の記録だけを公開する。参加者ごとの有効BESTを1件選びhigherは降順、lowerは昇順。同点は受付日時→内部投稿IDで安定選択し、順位は1〜10連番。数値は変更しない。表示同点には注記する。0は有効値、欠測はnull。

全体BESTとTOP10は同じ派生参加者BESTから取得する。投稿・status変更・派生更新・revisionは同じD1 transaction。取消・撤回で本人次点と他人順位を再計算し、withdrawnは管理復元不可。recalculateで正本submissionから全派生を再構築できる。

導入前および旧クライアントの未識別投稿はparticipant_id=NULL（legacy_unattributed）。消さず、所有者を推測せず、名前を勝手に発行しない。旧BEST行もmigration時に保持するが、新公開APIの適格集合へは含めない。未識別だけのboardは公開empty/nullとなる。過去の個人BESTの自動投稿は行わない。

## UIと公開境界

サムネイル下の個人BEST／みんなのBESTを維持し、20作品に「TOP10を見る」。ゲームリンクとランキングbuttonは兄弟要素。カードタップ・キーボードリンク・impression・launchを維持し、ランキングクリックではゲームを起動しない。

1つのnative dialogを再利用。見出しへfocus、Esc／閉じる、閉じた元buttonへfocus復帰、背景inert、背景スクロール停止。ゲーム名・条件・順位・匿名表示名・単位付き値・未共有でも個人BESTを表示。個人値から全体順位を推測しない。320／390／844横／1300PC、safe-area、長い数値、10行scrollに対応する。

TOP10は開いたboardだけGETし、60秒メモリcacheと同時GET共有。一括BESTのrevisionが進んだら古いTOP10を表示しない。TOP10の新しいsnapshotはBESTへ反映し、古い一括GETが上書きしない。失敗時に使える前回値は明示、既知の新revisionより古い値は失敗扱い。正常公開応答だけcache、認証付き登録／投稿／管理／失敗はno-store。

表示は「ランキングを読み込み中」「まだ記録はありません」「ランキング準備中」「ランキングを取得できませんでした」「前回取得したランキング」。endpoint未設定では準備中、実投稿なし、ダミーなし。

## 新作登録

比較可能な現行条件をrecordDefinitionsへ登録しpublicEnabledをtrueにする。新ルールは別boardId、既存IDを使い回さない。確定結果だけ共通RecordSharingへ通知し、同じ定義で個人adapter・整数上限・mode／assistance・Worker条件テストを追加する。個人進捗ゲームを競争へ変換しない。SQLへゲームごとの分岐を追加する必要はない。

検証・公開状態は [報告](IMPLEMENTATION_REPORT.md)、本番接続は [HANDOFF](HANDOFF.md)。
