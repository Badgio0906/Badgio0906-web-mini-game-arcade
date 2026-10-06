import type {MeetingScenario,Minutes,Statement,StatementRole} from './contracts';
export const emptyMinutes=():Minutes=>({who:'',task:'',due:''});
export const FIELDS=['who','task','due'] as const;
const say=(speaker:string,text:string,role:StatementRole,patch:Partial<Minutes>):Statement=>({speaker,text,role,patch,stateChange:role==='decision'||role==='correction'?{...patch}:{},readSeconds:Math.max(3.8,Math.min(7,2+text.length*.11))});
const chair=(text:string,role:StatementRole,patch:Partial<Minutes>)=>say('部長',text,role,patch);
const colleague=(text:string,role:StatementRole,patch:Partial<Minutes>)=>say('同僚',text,role,patch);
export function decisions(scenario:MeetingScenario,through=scenario.statements.length-1):Minutes {return scenario.statements.slice(0,through+1).reduce((state,statement)=>({...state,...statement.stateChange}),emptyMinutes());}
const scenario=(id:string,title:string,structure:string,extra:boolean,difficulty:1|2|3,expected:Minutes,statements:Statement[]):MeetingScenario=>({id,title,structure,extra,difficulty,expected,statements,readSeconds:statements.reduce((sum,s)=>sum+s.readSeconds,0)});
export const SCENARIOS:readonly MeetingScenario[]=[
 scenario('proposal-after','展示の準備','決定の後に未採用の期限案',false,1,{who:'田中',task:'試作品',due:'木曜'},[
 chair('担当は田中さんで決定です。','decision',{who:'田中'}),colleague('田中さんは試作品を用意してください。決定です。','decision',{task:'試作品'}),chair('期限は木曜で確定します。','decision',{due:'木曜'}),colleague('金曜にする案もありますが、まだ決定ではありません。','proposal',{due:'金曜'}),chair('金曜の食堂はカレーですね。雑談でした。','chat',{due:'金曜'})]),
 scenario('owner-handoff','請求書の確認','担当変更と旧担当の雑談',false,1,{who:'鈴木',task:'請求書',due:'火曜'},[
 chair('担当は佐藤さんに決めます。','decision',{who:'佐藤'}),chair('作業は請求書の確認で決定です。','decision',{task:'請求書'}),colleague('期限は火曜です。これで確定します。','decision',{due:'火曜'}),chair('担当を佐藤さんから鈴木さんへ変更します。','correction',{who:'鈴木'}),chair('佐藤さんの弁当、おいしそう。仕事の話ではないです。','chat',{who:'佐藤'})]),
 scenario('task-replace','展示物の用意','作業だけ訂正、後から期限',false,1,{who:'山田',task:'展示品',due:'水曜'},[
 chair('山田さんが担当です。決定しました。','decision',{who:'山田'}),chair('作業はチラシの用意で決定します。','decision',{task:'チラシ'}),colleague('訂正です。チラシではなく展示品を用意してください。','correction',{task:'展示品'}),chair('期限は水曜で確定です。','decision',{due:'水曜'}),chair('机に古いチラシが残っていますね。雑談です。','chat',{task:'チラシ'})]),
 scenario('deadline-extend','納品の連絡','期限を延長、旧曜日は雑談',false,2,{who:'中村',task:'納品連絡',due:'来週火曜'},[
 chair('中村さんが担当で決定です。','decision',{who:'中村'}),chair('納品連絡をお願いします。作業はこれで確定です。','decision',{task:'納品連絡'}),colleague('期限は金曜で決定します。','decision',{due:'金曜'}),chair('印刷が遅れます。期限を来週火曜へ延長します。','correction',{due:'来週火曜'}),chair('金曜は雨らしいですね。期限の話ではないです。','chat',{due:'金曜'})]),
 scenario('proposal-adopt','見積書の作成','提案を後で正式採用',false,2,{who:'高橋',task:'見積書',due:'水曜'},[
 colleague('担当は高橋さんという案です。まだ決まっていません。','proposal',{who:'高橋'}),colleague('作業は見積書の作成で決定します。','decision',{task:'見積書'}),chair('期限は水曜で確定です。','decision',{due:'水曜'}),chair('先ほどの案を採用します。担当は高橋さんで決定です。','decision',{who:'高橋'}),chair('中村さん、あとでお茶にしませんか。雑談です。','chat',{who:'中村'})]),
 scenario('double-change','申込の準備','担当と作業を同時訂正、期限保持',false,2,{who:'加藤',task:'申込書',due:'月曜'},[
 chair('担当は伊藤さんで決定です。','decision',{who:'伊藤'}),chair('案内文を作ることに決めます。','decision',{task:'案内文'}),chair('期限は月曜で確定します。','decision',{due:'月曜'}),colleague('訂正です。担当は加藤さん、作業は申込書へ変更。期限はそのままです。','correction',{who:'加藤',task:'申込書'}),chair('古い案内文、引き出しにありました。雑談です。','chat',{task:'案内文'})]),
 scenario('cancel-replace','説明会の準備','取りやめと代替作業、後の案を拒否',false,2,{who:'田中',task:'説明資料',due:'木曜'},[
 chair('担当は田中さんで決定です。','decision',{who:'田中'}),chair('試作品を用意することに決めます。','decision',{task:'試作品'}),chair('期限は木曜で確定です。','decision',{due:'木曜'}),colleague('試作品は取りやめます。代わりに説明資料を用意してください。決定です。','correction',{task:'説明資料'}),chair('水曜という案もありますが、採用されていません。','proposal',{due:'水曜'})]),
 scenario('condition-no','発送の準備','条件つき案が不成立、元の決定維持',false,3,{who:'鈴木',task:'発送ラベル',due:'金曜'},[
 chair('鈴木さんが発送ラベルを作ります。これで決定です。','decision',{who:'鈴木',task:'発送ラベル'}),colleague('期限は金曜で確定です。','decision',{due:'金曜'}),colleague('今日印刷できれば期限を木曜にする案です。まだ未採用です。','proposal',{due:'木曜'}),chair('今日は印刷できません。案は採用せず、期限は金曜のままです。','decision',{due:'金曜'}),chair('木曜のおやつ、楽しみです。雑談でした。','chat',{due:'木曜'})]),
 scenario('topic-detour','展示の申請','別議題の脱線と本議題への復帰',false,3,{who:'山田',task:'展示申請',due:'月曜'},[
 colleague('別の会議では高橋さんがポスター担当でした。雑談です。','chat',{who:'高橋',task:'ポスター'}),chair('ここから今回の決定です。担当は山田さんです。','decision',{who:'山田'}),colleague('今回の作業は展示申請で確定します。','decision',{task:'展示申請'}),chair('今回の期限は月曜で決定です。','decision',{due:'月曜'}),chair('別の会議の期限は水曜でしたね。今回は関係ないです。','chat',{due:'水曜'})]),
 scenario('rollback','最後の担当確認','変更を撤回し2欄を元へ戻す',true,3,{who:'田中',task:'提出資料',due:'木曜'},[
 chair('担当は田中さん、作業は提出資料で決定です。','decision',{who:'田中',task:'提出資料'}),chair('期限は木曜で確定です。','decision',{due:'木曜'}),chair('担当を鈴木さんへ、期限を金曜へ変更します。','correction',{who:'鈴木',due:'金曜'}),colleague('先ほどの変更を撤回。担当は田中さん、期限は木曜へ戻します。','correction',{who:'田中',due:'木曜'}),chair('鈴木さんは金曜にお休みでしたね。雑談です。','chat',{who:'鈴木',due:'金曜'})]),
 scenario('condition-yes','印刷の最終確認','条件成立が明示されて2欄変更',true,3,{who:'高橋',task:'印刷原稿',due:'水曜'},[
 chair('担当は中村さん。作業は印刷原稿。これで決定します。','decision',{who:'中村',task:'印刷原稿'}),colleague('期限は金曜で確定です。','decision',{due:'金曜'}),colleague('校了すれば高橋さん担当で水曜にする案です。まだ未採用です。','proposal',{who:'高橋',due:'水曜'}),colleague('校了しました。案を採用し、担当を高橋さん、期限を水曜へ変更します。','correction',{who:'高橋',due:'水曜'}),chair('金曜は中村さんとランチの予定です。雑談でした。','chat',{who:'中村',due:'金曜'})]),
 scenario('three-revisions','最後の資料変更','作業2回変更、期限だけ最終訂正',true,3,{who:'加藤',task:'説明資料',due:'来週月曜'},[
 chair('担当は加藤さん、作業は案内文で決定します。','decision',{who:'加藤',task:'案内文'}),chair('期限は木曜で確定です。','decision',{due:'木曜'}),chair('案内文ではなく申込書へ変更します。','correction',{task:'申込書'}),chair('再度訂正です。申込書ではなく説明資料を用意してください。','correction',{task:'説明資料'}),colleague('期限だけ変更。来週月曜で確定します。担当と作業はそのままです。','correction',{due:'来週月曜'}),chair('古い申込書は金曜に片付けます。今回の決定とは無関係です。','chat',{task:'申込書',due:'金曜'})])
];
export const PRACTICE_SCENARIO=scenario('practice','短い議事録の練習','提案／決定／訂正／聞き返し',false,1,{who:'田中',task:'展示品',due:'木曜'},[
 chair('担当は田中さんで決定です。記録してみましょう。','decision',{who:'田中'}),colleague('期限は金曜という案です。まだ決定ではありません。','proposal',{due:'金曜'}),chair('期限は木曜で確定します。','decision',{due:'木曜'}),chair('作業は試作品で決定です。','decision',{task:'試作品'}),colleague('訂正です。試作品ではなく展示品を用意してください。','correction',{task:'展示品'}),chair('水曜の天気が気になります。雑談です。','chat',{due:'水曜'})]);
