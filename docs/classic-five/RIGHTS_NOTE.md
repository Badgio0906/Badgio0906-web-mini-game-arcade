# Classic five — 権利・名称の限定確認

独立担当: `classic_review`。2026-10-07 15:05 UTCまでにweb connectorで公開情報を検索・参照。基準commit `af2edf70cdf8fe46175f4fcf38fec607dda997d0`。これは限定された一次調査で、許諾、商標登録不存在、日本法の個別判断、ゼロリスクを保証しない。製品ソース・実画像の採用状況はこの時点では未レビュー。

## 名称の実検索

検索語は次の通り。引用符付きでも関連語の結果を返す検索サービスのため、結果に完全一致がないことを不存在と扱わない。

| 予定名称 | 実施query | 確認した結果・限界 |
|---|---|---|
| ならべて4つ | `"ならべて4つ" ゲーム`, `"ならべて4つ"`, `"FOUR IN A ROW" game` | 和名の完全一致製品を今回の結果では確認せず。近似の「ならべて4ゲーム」が中古出品にある。英題は[GNOME公式Four-in-a-row](https://help.gnome.org/four-in-a-row/)や[既存App Store作品](https://apps.apple.com/us/app/four-in-a-row/id292882605)で使われる一般的な記述。独占的名称と扱わない。 |
| ひと息ソリティア | `"ひと息ソリティア" ゲーム`, `"ひと息ソリティア"`, `"KLONDIKE" game` | 和名の完全一致製品を今回の結果では確認せず。「ひと息」の関連表現は多い。英題は古典ルール名で、[Bicycle公式Klondike](https://bicyclecards.com/how-to-play/klondike/)と既存作品で使用。 |
| 伏字ことば | `"伏字ことば" ゲーム`, `"伏字ことば"`, `"KANA GUESS" game`, `"KANA GUESS"` | 和名の完全一致製品を今回の結果では確認せず。英題の完全一致ラベル「Kana Guess」は[KotogakiのApp Store掲載](https://apps.apple.com/ng/app/kotogaki/id6792779899)のミニゲーム一覧に存在。名称の唯一性・独占性を主張しない。 |
| のびのびスネーク | `"のびのびスネーク" ゲーム`, `"のびのびスネーク" site:playstation.com`, `"のびのびスネーク" site:sce.scene7.com`, `"のびのびスネーク" "トロ"`, `"のびのびスネーク" site:sce.scene7.com/is/content/playstation/software/manual/manual_bcjs30034.pdf`, `"SNAKE" game official` | **和名の同名使用を確認**。[PlayStation公式manual PDF](https://sce.scene7.com/is/content/playstation/software/manual/manual_bcjs30034.pdf)の検索snippetはゲームカタログに当該名を表示。[GameFAQsのトロともりもりトロフィー](https://gamefaqs.gamespot.com/ps3/959935-toro-to-morimori/trophies)と[電撃オンライン記事](https://dengekionline.com/elem/000/000/158/158499/)が同じ名前を記載。PDF本体取得はサイズ上限で失敗したため、本文・画像を確認したとはしない。公開前に和名置換を推奨し、rootへ観測を伝達済み。登録商標・侵害の断定ではない。英題SNAKEは[HMD公式発表](https://www.hmd.com/en_int/press/iconic-snake-game-is-back)など多数の既存使用がある。 |
| こつこつマインスイーパー | `"こつこつマインスイーパー" ゲーム`, `"こつこつマインスイーパー"`, `"MINESWEEPER" game Microsoft` | 和名の完全一致製品を今回の結果では確認せず。英題は[Microsoft公式作品](https://www.microsoftcasualgames.com/minesweeper)を含む既存使用がある。Microsoftのブランド・表現は採用しない。 |

2026-10-07 15:06 UTC追補: root指定の候補について、`"ひとマススネーク" ゲーム`、`"ひとマススネーク"`、`"ゆったりスネーク" ゲーム`、`"ゆったりスネーク"`を実検索。今回返った結果にどちらの完全一致製品名も確認しなかった。主にゆったり／スネークの別語を含む関連結果だったため、存在しないとの証明ではない。既に同名ゲームが見つかった「のびのびスネーク」より回避策として有用な候補。採用判断はroot／ユーザーが担当し、どちらも登録商標未調査という限界は残る。

採用追補: ユーザーがGame024和名を**ひとマススネーク**へ変更することを選択。正本は[AMENDMENTS.md](AMENDMENTS.md)。元和名の同名使用と回避の根拠を上記履歴として保持する。英題SNAKE・古典ルール・予定ID024は同じ。名称調整に関する追加承認はAMENDMENTSを参照する。

## ルールと具体的表現の境界

[米国著作権局Games](https://www.copyright.gov/register/tx-games.html)を本文取得。ゲームのアイデア・遊び方と、説明文・図画などの表現を区別している。**米国の説明であり、日本での法的クリアランスではない**。ルールを理解する参照を、他社コード・説明文・画像の転用許諾へ読み替えない。

[WPN権利者側Connect 4製品情報](https://wpn.wizards.com/en/products/connect-4)と[Hasbro公式instructions](https://instructions.hasbro.com/en-us/instruction/connect-4-game-instructions)を本文取得。権利者の名称、赤黄ディスク、脚・slider barを含む商品構成を確認。今回の四目並べは独自の平面盤、青緑／琥珀、異なる中央記号で制作し、Connect 4／Connect Fourの公開名・ロゴと青い立体枠＋赤黄駒＋脚／開閉機構の外観セットを採用しない。

[Bicycle Solitaire](https://bicyclecards.com/how-to-play/solitaire)と[Klondike](https://bicyclecards.com/how-to-play/klondike/)を本文取得し、52枚、7列、組札A→K、赤黒の降順、空列K、3枚めくりの上札利用という抽象ルールを確認。特定ページの表現やカードデザインは採用しない。部分列移動・1枚めくり等の今回要件はREQUESTを正本として独自実装する。

Minesの[公式説明](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/doc/mines.html)は本文取得timeout。[作者の生成器解説](https://www.chiark.greenend.org.uk/~sgtatham/quasiblog/mines-solver/)は検索snippetで推測なし生成の説明を確認したが、本文取得timeout。独自生成・見える情報だけのsolverを実装し、当該コード・盤面・説明文はコピーしない。参考リンクがあることだけで保証機能が実現したとはしない。

かな問題は一般語の独自リスト・独自ヒント、Snakeは独自の身体・餌・音、Minesは独自盤面・旗・数字UIとする。新規OSSを採用する場合はファイル／version／license／必要表示の別確認が必要。

## 取得失敗・未確認

- JPOの[商標検索案内](https://www.jpo.go.jp/e/support/j_platpat/trademark_search.html): web open 403 Forbidden。
- [J-PlatPat](https://www.j-platpat.inpit.go.jp/): 本文は`Loading...`のみ。登録検索は未実施。日本の商標・特許・意匠の網羅的調査は未完了。
- PlayStation manual: web open 400、12,771,948 bytesでcontent-length上限。検索snippet以外の本文・画像未確認。
- Mines公式説明と作者解説: web open 400 timeout。説明本文・実装コード未取得。
- 参考画像はrootが見たという引継ぎとREQUESTの配色・余白の説明のみを受領。この独立担当は元画像自体を見ていない。盤面の正しさや権利判断の設計図として扱わない。

最終採用コード・素材・実画面の比較は凍結candidate受領後に別工程で確認する。作者本人の面白さ・主観評価、実機iPhone試遊は未実施。作者未試遊の試作公開はREQUESTで明示承認されている。
