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
# Revision 02: integer-pixel authored charge silhouettes, not image compression.
legacy_states=list(states)
new_states=['charge1','charge2','charge-max','jump-left','jump-up','jump-right','slip','wind-left','wind-right','clear']
for state in new_states:
 im=Image.new('RGBA',(32,28)); d=ImageDraw.Draw(im)
 def poly(points,c):d.polygon(points,fill=palette[c])
 def rect(box,c):d.rectangle(box,fill=palette[c])
 if state.startswith('charge'):
  # Each outline is authored at its own whole-pixel positions, with grounded feet.
  top={'charge1':6,'charge2':10,'charge-max':14}[state]
  haunch={'charge1':12,'charge2':15,'charge-max':18}[state]
  poly([(2,23),(1,19),(4,haunch),(15,haunch-1),(19,top+3),(20,top),(25,top),(27,top+3),(27,top+6),(31,top+7),(31,top+11),(27,top+12),(22,24),(11,26),(3,26)],'O')
  poly([(4,23),(3,19),(6,haunch+2),(16,haunch+1),(21,top+4),(22,top+2),(24,top+2),(25,top+4),(25,top+7),(29,top+8),(29,top+10),(25,top+10),(20,23),(12,24)],'G')
  poly([(17,22),(23,top+11),(27,top+11),(23,24),(13,24)],'C')
  poly([(4,20),(7,haunch+3),(13,haunch+3),(16,22),(11,24),(5,24)],'g')
  rect((7,haunch+2,11,haunch+2),'H');rect((10,haunch+5,14,haunch+6),'D')
  rect((21,top+3,24,top+7),'W')
  if state=='charge1':rect((24,top+4,25,top+7),'K')
  else:rect((21,top+5,25,top+5),'K')
  rect((27,top+10,29,top+10),'O')
  poly([(3,24),(13,23),(15,26),(2,26)],'O');rect((4,24,12,25),'G')
  poly([(18,24),(22,23),(26,24),(29,25),(30,26),(18,26)],'O');rect((21,24,27,25),'G')
  if state=='charge-max':rect((15,22,17,23),'H');rect((26,top+8,29,top+8),'H')
 else:
  # Preserve the original profile face while independently authoring limbs and eyes.
  base='large' if state.startswith('jump') else 'wind' if state.startswith('wind') else 'land' if state=='slip' else 'idle'
  im=Image.open(root/f'assets/game019/frog-{base}.png').copy();d=ImageDraw.Draw(im)
  if state.startswith('jump'):
   d.rectangle((0,22,31,27),fill=(0,0,0,0))
   if state=='jump-up':
    poly([(6,21),(11,21),(12,25),(10,27),(6,27),(5,25)],'O');rect((7,23,9,25),'G')
    poly([(18,21),(22,21),(24,25),(23,27),(19,27),(17,25)],'O');rect((19,23,21,25),'G')
    rect((21,7,25,10),'W');rect((22,5,24,6),'K')
   elif state=='jump-left':
    poly([(5,21),(10,21),(12,23),(10,25),(1,25),(0,23)],'O');rect((2,23,8,23),'G')
    poly([(18,21),(22,21),(26,22),(31,23),(31,25),(25,25),(21,24)],'O');rect((24,23,29,23),'G')
   else:
    poly([(4,21),(10,21),(12,24),(8,26),(0,26),(0,24)],'O');rect((2,24,8,24),'G')
    poly([(18,21),(21,20),(25,21),(30,20),(31,22),(28,24),(21,24)],'O');rect((25,21,29,22),'G')
  elif state=='slip':
   d.rectangle((0,23,31,27),fill=(0,0,0,0));poly([(4,23),(11,23),(13,25),(12,27),(0,27),(0,25)],'O');rect((2,25,9,25),'G')
   poly([(18,23),(22,22),(28,23),(31,25),(30,27),(20,26)],'O');rect((24,24,29,25),'G');rect((21,10,25,10),'K')
  elif state=='wind-left':
   rect((21,7,25,10),'W');rect((21,8,22,10),'K');poly([(18,20),(21,18),(26,18),(28,16),(30,17),(29,20),(23,22)],'O');rect((24,19,27,19),'G')
  elif state=='wind-right':
   poly([(5,21),(9,20),(14,22),(12,25),(1,25),(0,23)],'O');rect((3,22,9,23),'G');rect((24,7,25,10),'K')
  elif state=='clear':
   poly([(14,16),(17,15),(19,19),(18,23),(15,23)],'O');rect((16,17,17,21),'G')
   poly([(25,14),(27,12),(28,7),(30,7),(31,11),(30,16),(27,18)],'O');rect((28,10,29,14),'G')
   rect((21,8,25,10),'W');rect((21,7,25,7),'K');rect((27,14,29,16),'O');rect((28,15,28,15),'P')
 frames[state]=[''.join(next((k for k,v in palette.items() if Image.new('RGBA',(1,1),v).getpixel((0,0))==im.getpixel((x,y))),'.') for x in range(32)) for y in range(28)]
 im.save(root/f'assets/game019/frog-{state}.png')
states+=new_states
atlas=Image.new('RGBA',(32*len(states),28))
for i,state in enumerate(states):atlas.paste(Image.open(root/f'assets/game019/frog-{state}.png'),(i*32,0))
atlas.save(root/'assets/game019/frog-atlas.png')
preview=Image.new('RGB',(32*4*8,28*((len(states)+3)//4)*8),'#213b3d')
for i,state in enumerate(states):
 sprite=Image.open(root/f'assets/game019/frog-{state}.png').resize((256,224),Image.Resampling.NEAREST)
 preview.paste(sprite,((i%4)*256,(i//4)*224),sprite)
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
(root/'assets/game019/asset-index.json').write_text(json.dumps({'method':'original intentional pixel authoring','reference':'user provided frog direction: green profile, large eye, cream belly, dark outline; no source image copied','generator':'tools/author_frog.py','size':[32,28],'states':states,'revision':2,'legacyArchive':'assets/game019/legacy-v1','poseHashes':{state:hashlib.sha256((root/f'assets/game019/frog-{state}.png').read_bytes()).hexdigest() for state in states},'license':'Original project artwork','sha256':hashlib.sha256(atlas.tobytes()).hexdigest(),'imagegenCalls':0,'hashScope':'decoded RGBA pixel bytes of frog-atlas.png'},indent=2)+'\n')
