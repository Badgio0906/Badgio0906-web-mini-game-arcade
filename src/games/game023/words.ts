/** Original initial vocabulary and short clues; no imported puzzle collection. */
export const categories = {
  food: '食べ物', animal: '動物', object: '身近な物', nature: '自然', transport: '乗り物', place: '場所',
} as const;
export type Category = keyof typeof categories;
export interface Word { word_id: string; reading: string; category: Category; difficulty: 'easy' | 'normal'; clue: string }
export const kanaGroups = [
  { id: 'plain', label: '清音', keys: [...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'] },
  { id: 'voiced', label: '濁音・半濁音', keys: [...'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゔ'] },
  { id: 'small', label: '小文字・長音', keys: [...'ぁぃぅぇぉっゃゅょゎゕゖー'] },
] as const;
export const allKana = new Set<string>(kanaGroups.flatMap(group => group.keys));
export const normalizeKana = (value: string): string => value.normalize('NFC');
const source: Record<Category, string> = {
food: `おにぎり|手のひらでまとめたごはん
きゃべつ|葉が重なった丸い野菜
りんご|しゃりっとした果物
みかん|皮をむいて房を食べる
ばなな|曲がった黄色い果物
ぶどう|小さな実が房になる
いちご|赤い実に小さなつぶつぶ
すいか|夏に切り分ける大きな果物
めろん|網目のある甘い果物
にんじん|根を食べる橙色の野菜
たまねぎ|むくと層が続く野菜
じゃがいも|ほくほくする土の中の野菜
さつまいも|甘くなる秋のいも
だいこん|白くて長い根の野菜
きゅうり|緑色で水分の多い野菜
かぼちゃ|かたい皮の中が黄色い野菜
ほうれんそう|濃い緑の葉をゆでて食べる
とうもろこし|黄色い粒が並ぶ野菜
えだまめ|さやから出して食べる豆
おもち|焼くとのびる白い食べ物
うどん|太くて白いめん
らーめん|汁と一緒に食べるめん
そーめん|細くて白い夏のめん
ぱすた|いろいろな形のめん
しょくぱん|四角く切って焼くパン
くっきー|さくっとした焼き菓子
ぷりん|やわらかい卵のおやつ
ちーず|牛乳から作る食べ物
ぎょうざ|皮で具を包んで焼く料理
おちゃづけ|ごはんに温かい飲み物を注ぐ`,
animal: `うさぎ|長い耳でぴょんと跳ぶ
きつね|ふさふさの尾を持つ
たぬき|丸い顔の森の住人
ももんが|木の間を滑るように飛ぶ
ねずみ|小さな体でちょろちょろ動く
はむすたー|ほっぺに食べ物をためる
もるもっと|草を食べる小さな仲間
はりねずみ|背中にとげを持つ
らいおん|たてがみのある大きなねこ
きりん|長い首で高い葉を食べる
しまうま|白と黒のしま模様
いのしし|土を掘る鼻の長い森の動物
しろくま|雪や氷のそばで暮らす白いくま
こあら|木の上で葉を食べる
ぱんだ|白と黒の体で竹を食べる
ぺんぎん|翼で水の中を泳ぐ鳥
あひる|水辺で暮らす身近な鳥
にわとり|庭でこつこつ歩く鳥
ふくろう|夜に活動する丸い顔の鳥
つばめ|細い翼で空をすばやく飛ぶ
すずめ|小さな茶色い身近な鳥
からす|黒い羽の賢い鳥
いるか|海で跳ねる仲間
くじら|海に暮らす大きな仲間
あざらし|水辺で休む丸い体の仲間
くらげ|水に浮かぶ透き通った体
りくがめ|陸を歩くこうらの仲間
かえる|水辺で跳ねる
ちょうちょ|花の間を舞う虫
てんとうむし|丸い背中に小さな点`,
object: `きって|手紙に貼る小さな紙
えんぴつ|削って使う筆記具
けしごむ|書いた線をこすって消す
ものさし|長さを測る道具
はさみ|紙を切る二枚の刃
のーと|書き留めるための冊子
てちょう|予定を小さく書き留める
ふでばこ|筆記具をまとめる箱
かばん|持ち物を入れて運ぶ
とけい|針や数字で時刻を知らせる
めがね|目の前にかける道具
ぼうし|頭にかぶるもの
てぶくろ|指を包んで温める
くつした|足にはく布の服
まふらー|首に巻いて温める
すりっぱ|室内ではく履き物
たおる|水分をふき取る布
せっけん|泡を立てて洗う
はぶらし|口の中をきれいにする
へあぶらし|髪を整える道具
かがみ|自分の姿が映る
やかん|お湯を沸かす容器
こっぷ|飲み物を入れる容器
すぷーん|すくって食べる道具
ふぉーく|先の細い食事の道具
こざら|少しずつ食べ物をのせる器
ちゃわん|ごはんを盛る器
まくら|寝るとき頭をのせる
ふとん|寝るとき体を包む
ざぶとん|座るとき下に敷く`,
nature: `あさひ|朝にのぼる光
ゆうひ|夕方に沈む光
あおぞら|晴れた日の頭上
あまつぶ|空から落ちる水の粒
ほしぞら|夜に小さな光が並ぶ
つきあかり|夜を照らすやわらかい光
あまぐも|水を落とす灰色の雲
かみなり|雲から響く大きな音
こなゆき|さらさら降る細かな雪
つらら|屋根などから下がる氷
しもばしら|土から伸びる細い氷
あさつゆ|朝の葉につく水の粒
そよかぜ|頬に当たる弱い風
はるかぜ|春に吹く風
しおかぜ|海から届く風
さざなみ|水面に並ぶ小さな波
しおみず|海のしょっぱい水
かわら|川のそばの石が並ぶ場所
たきつぼ|流れ落ちた水がたまる場所
ためいけ|水をためて使う小さな場所
みずうみ|大きく水をたたえた場所
しんりん|木がたくさん集まるところ
はやし|木が寄り集まるところ
くさはら|草が広がるところ
やまみち|山を歩く細い道
どんぐり|秋に拾う木の実
まつぼっくり|かさが重なる木の実
ひまわり|大きな黄色い夏の花
たんぽぽ|綿毛で種を飛ばす花
あじさい|梅雨に小さな花が集まる`,
transport: `じてんしゃ|ペダルをこいで進む
さんりんしゃ|三つの車輪で進む
いちりんしゃ|一つの車輪で乗る
くるま|道路を走る四輪の乗り物
ばしゃ|馬に引かれて進む車
まいくろばす|小さめの車体で大勢を運ぶ
たくしー|行き先を伝えて乗る車
とらっく|荷物を運ぶ大きな車
きゅうきゅうしゃ|急ぐ人を病院へ運ぶ車
しょうぼうしゃ|火を消す道具を積む車
ぱとかー|街を見守って走る車
おーとばい|二つの車輪でエンジンを使う
すくーたー|足元が平らな二輪車
でんしゃ|線路を電気で走る
きかんしゃ|列車を引く動力車
しんかんせん|遠くへ速く走る列車
ちかてつ|地下の線路を走る
ろめんでんしゃ|街の道路に沿って走る列車
ものれーる|一本の軌道に沿って走る
けーぶるかー|綱に引かれて坂を上る
ろーぷうぇー|空中の綱に下がって進む
ひこうき|翼で空を飛ぶ
へりこぷたー|上の羽を回して飛ぶ
ききゅう|大きな袋で空に浮く
せんすいかん|水の下に潜って進む船
ふぇりー|人や車を乗せる船
よっと|帆に風を受けて進む
ぼーと|小さな船をこいで進む
かぬー|細長い舟をこぐ
すけーとぼーど|板に小さな車輪がつく`,
place: `こうえん|木や遊具のある憩いの場所
がっこう|みんなで学ぶ場所
ようちえん|小さな子が集まる園
ほいくえん|小さな子が過ごす園
としょかん|本を借りて読める場所
びょういん|体の具合を診てもらう場所
やっきょく|薬を受け取る場所
ゆうびんきょく|手紙を送る場所
ぎんこう|お金を預ける場所
こうばん|街の安全を見守る小さな建物
しょうぼうしょ|火を消す車が待つ場所
はくぶつかん|昔や自然について展示する
びじゅつかん|絵や作品を展示する
どうぶつえん|いろいろな動物に会える
すいぞくかん|水の中の生き物に会える
しょくぶつえん|いろいろな草木を見られる
すーぱー|食べ物や日用品を買う店
こんびに|身近な品を買える小さな店
ぱんや|焼いたパンが並ぶ店
はなや|花を選んで買う店
ほんや|新しい本が並ぶ店
ちゅうしゃじょう|車を止めておく場所
くうこう|飛行機を待って乗る場所
みなと|船が行き来する場所
おんせん|地面から湧く温かいお湯の場所
うみべ|波のすぐそば
はまべ|海に沿った砂の場所
ひろば|人が集まれる開けた場所
いちば|食材などの店が集まる場所
たいいくかん|屋内で運動する大きな建物`,
};
// Keep reads consistent and metadata stable; IDs never derive from answer text.
export const words: readonly Word[] = Object.entries(source).flatMap(([category, rows]) => rows.split('\n').map((row, i) => {
  const [reading, clue] = row.split('|');
  return { word_id: `w_${category}_${String(i + 1).padStart(3, '0')}`, reading: normalizeKana(reading), category: category as Category,
    difficulty: [...reading].length > 5 ? 'normal' as const : 'easy' as const, clue: normalizeKana(clue) };
}));
export const wordById = new Map(words.map(word => [word.word_id, word]));
export function validateWords(dataset: readonly Word[] = words): string[] {
  const errors: string[] = [], ids = new Set<string>(), reads = new Set<string>();
  for (const word of dataset) {
    if (ids.has(word.word_id) || !/^w_[a-z]+_\d{3}$/.test(word.word_id)) errors.push(`id:${word.word_id}`);
    if (reads.has(normalizeKana(word.reading))) errors.push(`duplicate:${word.word_id}`);
    if (!(word.category in categories) || !['easy', 'normal'].includes(word.difficulty)) errors.push(`metadata:${word.word_id}`);
    if (word.reading !== normalizeKana(word.reading) || [...word.reading].length < 3 || [...word.reading].length > 8 || [...word.reading].some(kana => !allKana.has(kana))) errors.push(`reading:${word.word_id}`);
    if (!word.clue || word.clue.length > 35 || word.clue !== normalizeKana(word.clue)) errors.push(`clue:${word.word_id}`);
    ids.add(word.word_id); reads.add(normalizeKana(word.reading));
  }
  return errors;
}
