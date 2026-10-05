# Game017 — 雨って避けたら濡れないよね ～RAINSHIFT～

Native Canvasの新作を追加。雨の到来中に超加速を起動し、視点移動完了後の5秒で線を描き、1.4秒の高速移動でGOALへ向かう。赤い着地点とプレイヤー半径を一致させ、折れ線全区間の連続衝突判定を行う。到達可能な経路を辺単位で検証し、再生成24回＋検証済みfallbackで生成時間を制限する。

固定練習・同段階の再試行・線の続き／引き直し・指先ルーペ・4残像・風（4ラウンド以降）・大粒雨（6以降）・streak／close-call得点・BEST／mute保存を実装。CREDITは既存OFF、将来有効時のみ開始1回消費。練習は得点・BEST・RUN・CREDITから独立。Storage／Audio／Telemetryを既存サービスで扱い、Phaserや新しい依存を追加していない。

ポータル17本候補、公式タイトル／英語タイトル／「雨？ 当たらなければ晴れです。」／実プレイ640×360サムネイル、物理HTML、Vite入力、meta/fallbackを登録。旧1020文字を保持して1029文字のローカルfontへ拡張。

実行結果：npm test 219/219（017は23件）、npm run check／build成功。native PC1440×900／phone390×844／320×568／844×390の4件、入力・練習・保存拒否guard3群、Shift限定再テスト、production root／subpath PC・phone4件、既存modern14経路×2=28件がPASS。旧374ファイルを保持。Godot3本は今回は再プレイせず、export一致のみ。既存Phaser共有chunkの500kB警告は継続。

独立Feel：PCとphoneで実入力の練習失敗・復帰、本番6連続CLEAR、風／大粒／7ラウンド失敗とretryを確認。独立Visual：81/100、可読性F13/15、完成感H12/15。独立QAのShift modifier不一致は修正し通常入力との限定再検証に合格。レビュー実プレイのhashと最終Shift差分は各レビュー文書に区別して記載。

修正対象：GOALの厳密x比較を到達領域へ変更、描画経路の逆走に対応した残像、dash時間に合わせた雨の落下、phoneの余白／文字／描画サイズ、Canvas resize直後のテスト座標取得、resultの失敗理由、ポータル旧本数、modifier一致。CDP単一moveのclick欠落は素のページで再現し基盤側として記録、ゲーム修正の証拠に転用していない。

最終runtime/public freezeは [SOURCE_FREEZE.json](SOURCE_FREEZE.json) のa3025ff2f7c4e3d489a0ebe4b82e535f24b4779d8a7943a4036ffbeeba02536e（290 files）。基準commit442089a、成果commitはgit logの「Add Game017 RAINSHIFT with native reviews and Jev shadow evidence」。公開先は既存16本、mainへpush／公開していない。Game018は別commitで追加する。

[検証摘要](QA/VALIDATION_SUMMARY.json)／[gate](QA/RELEASE_GATE.json)／[Visual](VISUAL_REVIEW.md)／[Feel](GAME_FEEL_REVIEW.md)／[Jev実測](JEV_SHADOW_REPORT.md)／[人間フォーム](HUMAN_PLAYTEST.md)／[LESSONS](LESSONS.md)／[再開手順](CONTINUATION.md)。楽しさ、実機の親指・音・酔い・FPSは人間未確認。技術PASSを人間合格や公開承認へ読み替えない。
