from pathlib import Path
import json
p=Path('src/games/game045/content.ts');s=p.read_text();rooms=json.loads(s[s.index('=')+1:s.rindex(']')+1]);new=rooms[:2]
for i in range(10):
 a=1+i%2;b=5 if i%3 else 4;c=3;top=i%2;mid=3+(i%3==0);bottom=6 if i%2 else 5;start=5 if i%3 else 6
 mirrors=[{'x':a,'y':start},{'x':a,'y':top},{'x':b,'y':top},{'x':b,'y':mid},{'x':c,'y':mid},{'x':c,'y':bottom}]
 targets=[{'x':0,'y':start},{'x':a,'y':top+1},{'x':a+1,'y':top},{'x':b,'y':top+2},{'x':b-1,'y':mid},{'x':c,'y':bottom},{'x':6,'y':mid}]
 initial=['\\','\\','/','/','\\','/'];switch={'x':b,'y':bottom,'need':6};gate={'x':6,'y':mid}
 if i%2:
  for point in mirrors+targets+[switch,gate]:point['y']=6-point['y']
  start=6-start;initial=['/'if v=='\\'else'\\'for v in initial]
 new.append({'startRow':start,'mirrors':mirrors,'targets':targets,'initial':initial,'switch':switch,'gate':gate,'locked':[3]})
p.write_text("import type{Room}from'./model';\nexport const rooms:Room[]="+json.dumps(new,separators=(',',':'))+';\n')
p=Path('src/games/game045/model.ts');s=p.read_text().replace('gate?:Point}', 'gate?:Point;locked?:number[]}').replace('charged=reflections>=room.switch.need','charged=reflections===room.switch.need').replace('ammo:36','ammo:48');s=s.replace("s.notice=rooms[n].switch?'4回反射 → ◆充電 → 鏡を変えてゲートの奥へ！'", "s.notice=rooms[n].switch?`${rooms[n].switch!.need}回ぴったり反射 → ◆充電 → 鍵の鏡を解放してコアへ！`")
s=s.replace("s.angles[i]=s.angles[i]", "if(!s.unlocked&&rooms[s.room].locked?.includes(i)){s.notice='この鏡は施錠中。先に◆を充電しよう。';return false;}s.angles[i]=s.angles[i]")
s=s.replace("'4反射、充電完了！ 4番の鏡を変え、右のコアへ。'", "'充電完了！ 鍵の鏡が解放。経路を組み直してコアへ。'").replace("'ゲート閉鎖中。先に◆へ4回反射で充電しよう。'", "`ゲート閉鎖中。先に◆へ${rooms[s.room].switch?.need}回ぴったり反射で充電しよう。`");p.write_text(s)
p=Path('src/games/game045/main.ts');s=p.read_text().replace('[0,1,2,3].map','[0,1,2,3,4,5].map').replace('for(let i=0;i<4;i++)','for(let i=0;i<6;i++)').replace("el.textContent=`${i+1} ${s.angles[i]||''}`", "el.textContent=`${i+1} ${s.angles[i]||''}${!s.unlocked&&rooms[s.room].locked?.includes(i)?' 🔒':''}`");s=s.replace('4回反射','6回反射').replace('4反射','6反射').replace('4番の鏡','鍵の鏡').replace('36発','48発');
if "from './content'"not in s and "from'./content'"not in s:s="import{rooms}from'./content';\n"+s
p.write_text(s)
p=Path('src/games/game045/input.ts');s=p.read_text().replace("['1','2','3','4']","['1','2','3','4','5','6']");p.write_text(s)
p=Path('src/games/game045/renderer.ts');s=p.read_text().replace("s.unlocked?'ON':'4'", "s.unlocked?'ON':String(room.switch.need)").replace("c.fillText(String(i+1),x-23,y-16)", "c.fillText(String(i+1)+(!s.unlocked&&room.locked?.includes(i)?'🔒':''),x-23,y-16)");p.write_text(s)
p=Path('game045.html');s=p.read_text().replace('4回反射のスイッチとゲート','6回反射と施錠鏡・ゲート').replace('id="life">36','id="life">48').replace('<button id="fire">','<button id="mirror4">⑤ /</button><button id="mirror5">⑥ /</button><button id="fire">');p.write_text(s)
p=Path('src/games/game045/style.css');s=p.read_text()+'''\n.controls{grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:44px 44px 48px auto}.controls button{min-height:44px;font-size:15px}.controls #fire{grid-row:3}.controls #fire img{height:25px}@media(min-aspect-ratio:13/10){.controls{grid-template-rows:44px 44px 48px auto}}\n''';p.write_text(s)
p=Path('src/games/game045/storage.ts');s=p.read_text().replace('game045:rules2','game045:rules3').replace('rulesVersion:2','rulesVersion:3').replace('rulesVersion===2','rulesVersion===3');p.write_text(s)
