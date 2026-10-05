"""Original 32x28 frog pixels; reference direction only, no image tracing/copying."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib
root=Path(__file__).resolve().parents[1]
palette={'O':'#102e20','G':'#75ce36','g':'#399939','D':'#246039','C':'#fff0ac','W':'#ffffff','K':'#071d15','P':'#fa9973','H':'#b3ed65'}
states=['idle','charge','small','medium','large','fall','land','wind','fail']
frames={}
for state in states:
 im=Image.new('RGBA',(32,28)); d=ImageDraw.Draw(im)
 def poly(points,c):d.polygon(points,fill=palette[c])
 def rect(box,c):d.rectangle(box,fill=palette[c])
 # Profile silhouette: broad haunch, cream throat, projecting nose, high eye.
 crouch=state in ['charge','land']; oy=3 if crouch else 0
 def p(points,c):poly([(x,y+oy) for x,y in points],c)
 def r(box,c):rect((box[0],box[1]+oy,box[2],box[3]+oy),c)
 p([(3,22),(1,19),(2,13),(6,10),(14,9),(18,7),(19,3),(24,2),(27,5),(27,8),(31,10),(31,15),(28,17),(22,20),(21,24),(8,25)],'O')
 p([(4,20),(3,16),(6,12),(15,11),(20,8),(21,4),(24,4),(25,7),(25,10),(29,11),(29,14),(26,16),(20,19),(19,23),(8,23)],'G')
 p([(18,18),(23,16),(27,16),(24,20),(21,23),(15,23),(15,20)],'C')
 p([(4,16),(6,14),(11,13),(14,15),(14,20),(11,22),(6,21)],'g')
 p([(7,17),(10,16),(12,18),(11,20),(8,20)],'D')
 r((7,12,11,12),'H');r((15,11,17,12),'D');r((13,15,15,16),'D')
 r((21,5,24,11),'W');r((24,7,25,10),'K')
 r((27,14,29,14),'O');r((28,12,29,12),'H')
 if state=='fail':
  r((21,7,24,9),'G');r((21,7,21,7),'K');r((24,7,24,7),'K');r((22,8,23,8),'K');r((21,9,21,9),'K');r((24,9,24,9),'K')
  r((27,15,28,16),'P')
 elif state in ['large','fall','wind']:
  r((27,14,28,16),'O');r((27,15,27,15),'P')
 # Separate feet and arms communicate jump size and funny landings.
 if state in ['medium','large','small','fall','wind','fail']:
  if state in ['large','fall']:
   poly([(6,22),(10,21),(12,24),(11,26),(5,26),(4,24)],'O');rect((5,24,9,24),'G')
   poly([(18,22),(21,21),(24,24),(27,24),(28,26),(23,27),(19,25)],'O');rect((22,24,25,25),'G')
  elif state=='wind':
   poly([(6,22),(10,21),(13,24),(9,26),(3,25)],'O');rect((4,24,9,24),'G')
   poly([(19,21),(22,20),(26,21),(30,20),(31,22),(26,24),(21,24)],'O');rect((25,21,28,22),'G')
  else:
   poly([(7,22),(12,21),(14,23),(11,25),(4,25),(3,23)],'O');rect((5,23,10,23),'G')
   poly([(19,21),(21,20),(24,22),(28,22),(29,24),(22,25)],'O');rect((23,22,27,23),'G')
 else:
  poly([(6,24),(13,23),(14,26),(3,26),(3,24)],'O');rect((4,24,11,25),'G')
  poly([(18,23),(21,22),(24,24),(28,24),(29,26),(19,26)],'O');rect((21,24,27,25),'G')
 if state=='charge':rect((22,10+oy,25,10+oy),'K')
 if state=='small':rect((27,13,30,13),'O')
 frames[state]=[''.join(next((k for k,v in palette.items() if Image.new('RGBA',(1,1),v).getpixel((0,0))==im.getpixel((x,y))),'.') for x in range(32)) for y in range(28)]
 im.save(root/f'assets/game019/frog-{state}.png')
atlas=Image.new('RGBA',(32*len(states),28))
for i,state in enumerate(states):atlas.paste(Image.open(root/f'assets/game019/frog-{state}.png'),(i*32,0))
atlas.save(root/'assets/game019/frog-atlas.png')
preview=Image.new('RGB',(32*3*8,28*3*8),'#213b3d')
for i,state in enumerate(states):
 sprite=Image.open(root/f'assets/game019/frog-{state}.png').resize((256,224),Image.Resampling.NEAREST)
 preview.paste(sprite,((i%3)*256,(i//3)*224),sprite)
preview.save(root/'assets/game019/frog-preview.png')
source='// Original intentional pixel authoring. Reproduce with tools/author_frog.py.\n'
source+='export type FrogPose = '+ ' | '.join(json.dumps(s) for s in states)+';\n'
source+='const palette: Record<string,string> = '+json.dumps(palette)+';\n'
source+='export const frogPixels: Record<FrogPose, readonly string[]> = '+json.dumps(frames,indent=2)+';\n'
source+='''export function drawFrog(ctx: CanvasRenderingContext2D, x: number, feetY: number, state: FrogPose, facing: number = 1, scale: number = 1): void {
  ctx.save(); ctx.translate(Math.round(x), Math.round(feetY)); ctx.scale(facing < 0 ? -scale : scale, scale);
  const rows = frogPixels[state];
  for(let y=0;y<rows.length;y++) for(let p=0;p<rows[y].length;p++) { const color=palette[rows[y][p]]; if(color) {ctx.fillStyle=color;ctx.fillRect(p-16,y-27,1,1);} }
  ctx.restore();
}
'''
(root/'src/games/game019/frogPixels.ts').write_text(source)
(root/'assets/game019/asset-index.json').write_text(json.dumps({'method':'original intentional pixel authoring','reference':'user provided frog direction: green profile, large eye, cream belly, dark outline; no source image copied','generator':'tools/author_frog.py','size':[32,28],'states':states,'license':'Original project artwork','sha256':hashlib.sha256(atlas.tobytes()).hexdigest(),'imagegenCalls':0,'hashScope':'decoded RGBA pixel bytes of frog-atlas.png'},indent=2)+'\n')
