# Game018 — 公開工程の記録

次のCloudタスクへの公開手順は[最新引き継ぎ書](PUBLICATION_HANDOFF.md)へ整理済み。候補の最新HEADを取得し、カスタムドメインの通信許可反映後に公開を進める。この引き継ぎ作成ではmainへの反映・018 deployは行っていない。

2026-10-05（日本時間）。Game018はまだmainへ反映していない。mainは017採用commit `1ab4fcf5a35637b15554d7942d944763e79920c9`、018候補の取得時HEADは `fd852a7ed1e9e8376bae283dc298973b13b932c1`。ソース採用commitは `90c8c68c64e36f761c8ad06a575778608b377c98`。mainが候補の祖先であることを再確認した。

## 新環境で実行した検証

Node24.19.0でnpm ci、TypeScript check、248/248単体、build成功。freeze対象301ファイルの個別SHA256はすべて一致し、runtime hash `4e491ba21ec7f5b3bcfc86c1b5656e186d7dffc1f22fc94903afc1d19f27bfbd`を保持。root／subpathのPC1440×900・phone390×844で018の4段階練習→本番→結果→Retry→Portal帰還を4件PASS、017の経路描画練習→本番→結果→Retry→Portal帰還を4件PASS。18カードと実thumbnail640×360、font／script、保存reload、CREDIT OFFの無料導線を確認。[今回の集計](publication-qa/VALIDATION_SUMMARY.json)。

017の初回probeは、context終了時に未完了のresponse.body取得が残る検証スクリプト側の例外で終了した。[初回log](publication-qa/GAME017_PRODUCTION.log)を保持し、取得完了を待つ検証コピーの[再実行](publication-qa/GAME017_PRODUCTION_RETEST.json)で4件PASS。ゲームのruntimeコードは変更していない。過去のQA原本は上書きしていない。

## 公開先と残工程

引き継ぎのGitHub Pages URLは現在 `http://game100garage.com/index.html`へ301転送される。ユーザーがこの転送先を意図したURLと確認した。現環境ではGitHub APIとbadgio0906.github.ioへ接続できるが、enforced revision6の許可ホストにgame100garage.comがなく、HTTPSはproxy CONNECT403。転送後のHTTPも403。[実通信記録](publication-qa/NETWORK_INITIAL.json)。

公開URLがHTTP200で読めるという引き継ぎ条件を満たすまでmain pushを保留する。許可反映後、最新mainの祖先確認→018候補をmainへfast-forward push→Pagesの対象commit／build・test・deploy successを記録→実公開URLのPC／phone検証とasset hash照合を実行する。公開probeコピーは[018](publication-qa/game018-public.mjs)／[017](publication-qa/game017-public.mjs)へ準備済み。`PUBLIC_MOUNT`に実際の配信root、`PUBLIC_QA_OUT`に未使用の出力ディレクトリを指定する。各コピーは公開Portalの両カード・タイトル・thumbnail・hrefを確認し、カード起動・直接reload後に無料プレイを検証する。公開上ではまだ実行していない。

人間の面白さ・実機親指操作・音・FPS・酔い・JUST難度は[フォーム](HUMAN_PLAYTEST.md)の未実施項目のまま。旧Godot3本の再プレイも今回未実施。Jevの再呼出・自動公開判断は行っていない。

## 通信再確認（2026-10-05 日本時間）

ユーザーの再確認依頼でGitと公開先を再調査。enforced revision10でもgame100garage.comは許可ホストに含まれず、HTTPSはCONNECT403。mainは1ab4fcf、候補はed8a463でruntime更新なし。GitHub Pages URLの301転送と拒否の[今回の原本](publication-qa/NETWORK_RECHECK_REVISION10.json)を保存。HTTP200先行条件を満たさず、main push／新Pages deploy／公開DOM確認は未実施。
