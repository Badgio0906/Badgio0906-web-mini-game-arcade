# Game060「雷、予約しました。」GAPS SE改善

2026-11-02。対象はサイトのGitHub実装 `src/games/game060/`。基準main `7921686e793acf07942268787923bdd18c0f1869`、branch `codex/game060-gaps-se-20261102`。ランチャーに登録された独立試遊版ではない。

## 変更

Dドライブの既存GAPSをCLIで利用し、13種類のPCM16・48kHz WAVを制作・採用した。予約は短い電子音、予約不可は下降音、枠回復は控えめな通知音。落雷は短い放電・低い衝撃・ノイズの余韻を合成し、通常と3機以上のまとめ撃破に各2バリエーション、6機一撃に専用の太い落雷と上昇音を用意した。空振り、シールド損失、ボス命中、成功、失敗にも専用音を割り当てた。

WAVは合計609,884 bytes。全13音がGAPS信号QAを通過し、全13レシピのCLI再生成でasset IDが一致した。出典・権利・seed・各音のID・QA・export manifestは[制作台帳](../../../assets/game060/gaps-20261102/README.md)に保存した。素材はGAPSのprocedural音源で、第三者録音の持ち込み・外部生成API・生成サービス課金はない。GAPS本体のソースや既存ライブラリは変更しない。

WebAudioの既存master/compressorを使い、読み込みやデコードが間に合わない場合は元の合成音をその場で再生する。後からイベント音を遅延再生しない。全音源を最大10声で管理し、重要な落雷・成功音を優先する。同時の枠回復通知と短時間の予約不可連打を抑制する。消音・休憩・非表示・離脱・タイトル帰還・再挑戦時は既存音源も停止する。

独立レビューで、非同期suspend完了前の即時resumeが音だけ停止させる可能性を検出。希望する再生状態と現在のcontextを照合して補正し、後のpause/closeでは自動復帰しないことを回帰テストで確認した。[独立レビュー](QA/INDEPENDENT_REVIEW.md)は初回findingと修正後判定を両方保持する。Jevの外部requestは実行せず、独立コードレビューとローカル再現・回帰検証を実施した。Jev合格とは表記しない。

モデル、得点、0.9秒の着弾判定、入力の意味、保存キー、BEST、描画、カタログ、他作品、広告・解析・Worker/D1は変更していない。main.tsの変更はSEのライフサイクル呼び出しだけ。

## 実行した検証

- 型検査 `npm run check` と全体 `npm run build`: 成功。[最終build](QA/build-final.log)。
- 既存Jev helperのoffline契約テスト25件: Ubuntu WSLで成功。Windows直接実行ではLinuxのfcntlがなくimportできないため、その失敗を保全しWSLで実行した。[offline結果](QA/jev-offline-tests.log)。外部モデル/APIは呼ばない。
- 対象25テストが成功後、音声の非同期回帰を追加。最終の音声単体6テスト、全体153 files / 1294 tests成功。[全体最終結果](QA/full-unit-final.json)。
- Windowsの自動CRLF変換により初回全体検査で既存のbyte/hash保全5件が失敗。隔離worktreeの保護対象22テキストをGitと同じLFにそろえ、対象10件と全体1294件の成功を確認。保護対象はGit差分なし。原失敗[全体ログ](QA/full-unit.log)と[再検査](QA/windows-lf-recheck.json)を保持。
- 実際のproduction buildをEdge headlessで配信し、1280×720 /390×844 /320×568 /844×390を確認。320幅は `/trial/` 配下でも起動。全13WAVのHTTP取得・デコード、実クリック/キー入力の予約→6機落雷、空振り、休憩/再開、muteと再読込保存、帰還、横overflowなし、例外/HTTPエラー/外部通信なし。[通常操作検証](QA/browser.json)。
- 読み取り専用の既存攻略入力計画を通常マウス入力として使用し、実時間のフルRUNで20,400点・Sランク・8編隊防衛・ボス撃破・成功SEを確認。ゲーム状態・時計への書込みやproduction診断フックは使用していない。自動入力の技術試験であり、人間の楽しさの測定ではない。
- 別の検証用HTTP応答にだけaudio instance参照を追加し、全13cue、40回の連続落雷で最大10声、mute/close時の停止、破損WAV時の元合成音を確認。[全cue検証](QA/all-cues.json)。このテスト用参照は配信ソースに含めない。
- 通常操作検証と全cue検証の初回失敗は、帰還リンクselectorとプローブのoscillator追跡不足。ゲーム修正はせず、テストを修正して最終成功。失敗JSONもQA内に保持。
- 全体テストが生成した旧共通qaのplan/比較ファイルは保管済みの元ファイルへ戻し、今回のGit差分に含めない。

人間の聴感、実スマホのスピーカー、実iPhone Safariは未確認。独立レビューはコード・音源台帳・対象単体の評価であり、独立した人間聴取やゲームの完成認定ではない。

## GitHub・サイト

公開リポジトリと既存2 workflowsを確認。PRは標準ubuntu-latestで検証のみ、mainへの通常mergeで既存Pagesが公開する。Webhook一覧は取得成功・0件。新規workflow、Runner、サービス、キー、課金設定は追加しない。公開リポジトリでの標準Runnerの実行は[GitHub公式の無料利用範囲](https://docs.github.com/en/actions/concepts/billing-and-usage)に該当する。個人billing APIの参照はscope不足だったため、口座全体の費用確認済みとは扱わない。

PR22を通常mergeし、main `e0dfed9b`と既存Pages41386645437のbuild/deploy成功、本番15ファイル照合とPC/スマホ幅の再生を確認した。事後の詳細は[公開記録](PUBLICATION_REPORT.md)。製品はmain反映済みで、この事後記録は `docs/game060-gaps-publication-20261102` branchに保存する。
