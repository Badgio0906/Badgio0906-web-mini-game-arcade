from PIL import Image, ImageDraw
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
(root/'assets/game015/revision-02').mkdir(parents=True,exist_ok=True)
colors={'0':'#090911','5':'#fff7ec','4':'#d8d5e0','6':'#ffc38b','7':'#ffe369','8':'#b78228','b':'#ed353e','c':'#971923','d':'#8c36cd','a':'#54158c'}
def king(pose,frame):
 im=Image.new('L',(24,36),ord('.'));d=ImageDraw.Draw(im)
 def rect(box,c):d.rectangle(box,fill=ord(c))
 def poly(points,c):d.polygon(points,fill=ord(c))
 # The cloak has an outlined stepped silhouette and white ermine collar.
 poly([(6,17),(17,17),(21,23),(23,31),(19,33),(4,33),(0,31),(3,23)],'0')
 poly([(6,18),(17,18),(20,24),(22,30),(18,32),(4,32),(1,30),(4,24)],'c')
 poly([(6,18),(9,18),(6,29),(3,31),(2,30)],'b');poly([(15,18),(17,18),(20,25),(22,30),(19,31),(16,27)],'b')
 poly([(8,18),(15,18),(18,29),(15,31),(7,31),(5,29)],'0')
 poly([(9,18),(14,18),(16,28),(14,30),(8,30),(7,28)],'d')
 rect((9,20,9,27),'7');rect((14,20,14,27),'7');rect((7,28,16,29),'7')
 rect((6,23,17,25),'0');rect((7,24,16,24),'8');rect((10,23,13,25),'7');rect((11,24,12,24),'b')
 # Comical squat gold boots.
 rect((7,30,10,34),'0');rect((13,30,16,34),'0');rect((5,33,10,35),'0');rect((13,33,18,35),'0')
 rect((6,34,9,34),'7');rect((14,34,17,34),'7');rect((8,31,9,32),'8');rect((14,31,15,32),'8')
 # Black outer head, white side hair, peach face and deliberately large beard.
 poly([(7,7),(16,7),(18,11),(18,16),(16,19),(7,19),(5,16),(5,11)],'0')
 rect((6,10,8,15),'5');rect((15,10,17,15),'5');rect((8,8,15,13),'6')
 rect((8,10,10,10),'0');rect((13,10,15,10),'0');rect((9,11,9,11),'0');rect((14,11,14,11),'0')
 rect((11,12,13,13),'6');rect((8,13,10,14),'5');rect((14,13,16,14),'5')
 poly([(7,15),(10,14),(12,15),(14,14),(16,15),(15,18),(13,18),(12,19),(10,18),(8,18)],'5')
 rect((10,14,13,14),'0');rect((10,17,10,18),'4');rect((14,16,14,17),'4')
 # Crown: three prongs, rubies, solid black outline.
 poly([(5,2),(7,2),(7,4),(10,4),(10,0),(13,0),(13,4),(16,4),(16,2),(18,2),(18,8),(5,8)],'0')
 poly([(6,3),(6,6),(11,6),(11,1),(12,1),(12,6),(17,6),(17,3),(17,7),(6,7)],'7')
 rect((11,3,12,4),'b');rect((7,6,8,6),'b');rect((15,6,16,6),'b');rect((6,7,17,7),'8')
 # Fur collar and gold cape clasps remain readable during animation.
 rect((4,17,7,19),'0');rect((5,17,7,18),'5');rect((16,17,19,19),'0');rect((16,17,18,18),'5')
 rect((6,19,7,19),'7');rect((16,19,17,19),'7')
 if pose in ('falling','left','right'):
  rect((0,14,3,16),'0');rect((1,14,2,15),'6');rect((2,16,5,18),'0');rect((3,16,4,17),'b')
  rect((20,14,23,16),'0');rect((21,14,22,15),'6');rect((18,16,21,18),'0');rect((19,16,20,17),'b')
  if frame%2: rect((1,27,2,29),'b');rect((21,25,22,28),'b')
 else:
  rect((3,20,5,24),'0');rect((4,21,5,23),'6');rect((18,20,20,24),'0');rect((18,21,19,23),'6')
 if pose=='idle' and frame:rect((8,11,10,11),'0');rect((13,11,15,11),'0')
 if pose in ('landing','hard','drop'):
  out=Image.new('L',(24,36),ord('.')); out.paste(im.resize((24,30 if pose!='hard' else 26),Image.Resampling.NEAREST),(0,6 if pose!='hard' else 10));im=out
 if pose=='left':
  out=Image.new('L',(24,36),ord('.'))
  for y in range(36):out.paste(im.crop((0,y,24,y+1)),(-2 if y<18 else 0,y))
  im=out
 if pose=='right':
  lines=king('left',frame); im=Image.new('L',(24,36),ord('.'))
  for y,line in enumerate(lines):
   for x,c in enumerate(line):im.putpixel((23-x,y),ord(c))
 if pose=='death':
  out=Image.new('L',(24,36),ord('.')); out.paste(im.resize((22,13),Image.Resampling.NEAREST),(1,23));q=ImageDraw.Draw(out);q.rectangle((8,10-frame*2,15,14-frame*2),fill=ord('0'));q.rectangle((9,11-frame*2,14,13-frame*2),fill=ord('7'));q.rectangle((11,12-frame*2,12,13-frame*2),fill=ord('b'));im=out
 return [''.join(chr(im.getpixel((x,y))) for x in range(24)) for y in range(36)]
states=['idle','drop','falling','left','right','landing','hard','death']
frames={s:[king(s,i) for i in range(2)] for s in states}
(root/'src/games/game015/kingPixels.ts').write_text('/** Original 24×36 native pixel animation, authored from the user’s king direction. */\nexport const KING_PIXELS = '+json.dumps(frames,indent=2)+' as const;\n')
sheet=Image.new('RGB',(24*8,36*2),'#1b253e')
for col,s in enumerate(states):
 for row,f in enumerate(frames[s]):
  for y,line in enumerate(f):
   for x,c in enumerate(line):
    if c!='.':sheet.putpixel((col*24+x,row*36+y),tuple(bytes.fromhex(colors[c][1:])))
sheet.resize((768,288),Image.Resampling.NEAREST).save(root/'assets/game015/revision-02/king-animation-preview.png')
