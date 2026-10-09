# Portal discovery revision-01 — 折畳みと再読込時並替え

ユーザーのスマホ操作改善依頼により、絞り込み欄全体を元の位置で初期折畳みにした。件数・empty state・保存失敗noticeは閉じても見え、選択済みタグ・OR／AND・状態名はsummaryで確認できる。native detailsによるkeyboard開閉、cream／inkの枠と既存カードを維持する。テキスト検索は今回追加しない。

お気に入りは☆／★、aria-pressed／label、localStorageを直ちに更新する。並び用にはpage-load時のfavorite集合を別Setで保持し、click／別タブstorageではカード移動・position更新・observer再接続をしない。タグ／状態／mode／clearでもloaded集合だけをsortへ使う。実再読込で保存状態を読み直し、favorite→nonfavorite、各群releaseOrder昇順を適用する。誤tap後の同座標解除を容易にし、新作・非favoriteは引き続き残る。

## Gitと変更範囲

開始時status空、branch codex/portal-discovery、HEAD／fetch後origin/mainはdcefa6f2e491d7bded8204bff619a7dfd77a1126で一致。安全な新branch codex/portal-discovery-comfortを作成。reset／clean／force操作なし。

runtime変更はindex.html、src/portal/DiscoveryControls.ts、main.ts、style.cssのみ。再利用browser probeと現行仕様、今回QA・独立報告・CURRENT_STATUSを更新。過去QAは履歴として保持する。game ID／active30・010退役／全trial／route／releaseOrder、全ゲーム本体・保存、AdSense、Records／record sharing／TOP10、Telemetry event schema、Worker／D1、GA4、CREDITは変更なし。作者の完成判断を自動で行わない。

## 検証

- npm test: 919 tests／80 files PASS。npm run check、公開と同じ既存frontend設定のnpm run build PASS。
- build警告は既存のclassic arcade-navigation script、build後copyするnavigation.css、CSS構文、500kB超chunk。今回追加した警告なし。
- 固定source／dist hashはQA/SOURCE_MANIFEST.jsonとBUILD_MANIFEST.json、測定probe修正後はSOURCE_FINAL_MANIFEST.json。ブラウザは1440×900、390×844、320×720、repository subpath320を通常mouse／tap／keyboard入力で検証し208checks PASS（QA/browser-accepted）。page／console errors0、非analytics POST0。同座標解除、reloadだけ並替え、OR／AND／状態／empty／clear、既存node、Records／sharing／TOP10、PLAY／card launch、consent／observer／dedupを確認した。
- 独立source／実画像／操作レビューはINDEPENDENT_REVIEW.md。固定buildの3width、同座標解除・cross-tab・keyboard・reload・storage取得拒否など74checks PASS、page／console errors0・POST0（QA/independent-accepted）。Jevはfinding発生時のみ使用し、全PASSをAPIへ送らない。

公開CIと公開ブラウザ／配信版照合は後続記録へ追記する。物理スマホと作者本人の主観評価は今回未実施で、自動viewport結果とは区別する。

### 初回同座標probeの測定

PCは完了、390pxでbbox完全一致の初回assertが失敗した。測定を追加した第2runも同assertだけ失敗し、star=false、scrollY9437不変、positions1〜30不変、button44×44不変、bbox差x/y約0.79pxと記録された。既存game-card:hoverはtranslate(-2px,-2px)／150ms transitionであり、tap直後の途中bboxを厳密比較していた。probeはstableなcard offsetTop／scroll／順番の完全一致と、既存transform最大2pxだけを許す比較へ変更し、製品は変更していない。独立調査と全幅再runを必要とし、初回FAIL／画像はQA/browser-local、個別測定FAILはQA/browser-measuredへ保持した。Jev C1findingはShadowとして1回だけ送信、回答は独立レビュアーへ渡していない。

### 独立fixture初期ページの例外

独立probe初回は72動作checkが成功した後、pageErrorsの最終assertでFAIL。about:blankのみを開き製品resourceを一切読み込まない対照でも同じSecurityErrorが再現し、stackはinitScriptのunguarded localStorageアクセスを示した。opaque originをskipするfixture guardだけで0件となった（QA/OPAQUE_STORAGE_DIAGNOSTIC.json）。製品ソースは変更せず、初回QA/independent-finalを保持して新QA/independent-acceptedで全幅再実行する。Jevは観測時に別C1findingとして1回送信し、回答を独立レビュアーへ渡していない。

配信差分監査（QA/SCOPE_AUDIT.json）では既存327build fileが一致し、変更はindex.htmlとportal専用index JS／CSSだけ。全ゲームHTML／asset、広告、解析・Records共通assetは一致した。

第3run（QA/browser-final）はPC／390成功後、320pxで同じ測定assertの寸法完全一致だけFAIL。bbox width44→43.999984741pxという浮動小数点の差で、card offsetTop9601／scroll9271／positions不変、star解除成功だった。probeの寸法比較だけ0.01px未満の数値誤差を許容し、QA/browser-acceptedで再検証する。製品や既存hoverCSSは変更していない。

Jev Shadowは2finding／2実API／HTTP200で有効回答。独立Codexは両件をTEST_INFRA_BUGと判定し、主原因の選択はJevと2件とも不一致、次の証拠は2件一致。追加作業判定に見逃し0、重大risk見逃し0。回答を修正・公開Gateには使わず、実測／独立レビュー／再テストを継続した。QA/JEV_SUMMARY.jsonに母数・費用・限界を保持する。

最終統合QA/browser-acceptedは全208checks成功。既存hoverの2px範囲と0.01px未満の寸法計算誤差以外は、同座標解除でcard offsetTop／scroll／positionsを厳密に比較した。完成した公開前候補に未解決findingなし。
