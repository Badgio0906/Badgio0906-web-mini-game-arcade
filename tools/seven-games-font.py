"""Union the existing Japanese font's cmap with this revision's seven-game text.
Do not modify the existing shared font or any other game's CSS.
"""
import hashlib,json
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parents[1]
IDS=['game003','game006','game007','game008','game009','game010','game018']
OLD=ROOT/'public/fonts/arcade-rounded-jp.woff2'
SOURCE=ROOT/'assets/fonts/source/MPLUSRounded1c-Medium.ttf'
OUTPUT=ROOT/'public/assets/seven-games-2026-10-06/arcade-rounded-v2.woff2'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
old=TTFont(OLD);old_codes=set(old.getBestCmap());font=TTFont(SOURCE);supported=set(font.getBestCmap())
files=[]
for gid in IDS:
 files.append(ROOT/(gid+'.html'))
 files.extend(p for p in (ROOT/'src/games'/gid).rglob('*') if p.suffix in ['.ts','.css','.json'])
chars=set(ord(c) for p in files for c in p.read_text())
required=old_codes|(chars&supported)
options=subset.Options();options.flavor='woff2';options.name_IDs=['*'];options.name_legacy=True
subsetter=subset.Subsetter(options=options);subsetter.populate(unicodes=required);subsetter.subset(font)
for record in font['name'].names:
 if record.nameID in [1,3,4,6,16,17]:
  text={1:'Seven Arcade Rounded',3:'SevenArcadeRounded-20261006',4:'Seven Arcade Rounded Medium',6:'SevenArcadeRounded-Medium',16:'Seven Arcade Rounded',17:'Medium'}[record.nameID]
  record.string=text.encode(record.getEncoding(),errors='replace')
font.flavor='woff2';OUTPUT.parent.mkdir(parents=True,exist_ok=True);font.save(OUTPUT)
new=set(TTFont(OUTPUT).getBestCmap());missing=old_codes-new
jp=lambda n:0x3040<=n<=0x30ff or 0x3400<=n<=0x9fff
missing_jp=sorted(n for n in chars if jp(n) and n not in new)
report={'scope':IDS,'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':sha(SOURCE),'license':'SIL Open Font License; original public/fonts/OFL.txt retained','sourceReservedFamilyRenamed':'Seven Arcade Rounded','original':str(OLD.relative_to(ROOT)),'originalSha256':sha(OLD),'originalCmap':len(old_codes),'output':str(OUTPUT.relative_to(ROOT)),'outputSha256':sha(OUTPUT),'bytes':OUTPUT.stat().st_size,'newCmap':len(new),'originalGlyphsLost':sorted(missing),'requiredJapaneseMissing':[chr(n) for n in missing_jp],'nonJapaneseUnsupportedMayFallback':[chr(n) for n in sorted(chars-supported) if n>=32], 'textFilesSha256':{str(p.relative_to(ROOT)):sha(p) for p in files},'imageGenerationCalls':0}
out=ROOT/'docs/seven-games-2026-10-06/QA/FONT_COVERAGE.json';out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
if missing or missing_jp:raise SystemExit('Font coverage failure')
print(json.dumps({k:report[k] for k in ['originalCmap','newCmap','bytes','originalGlyphsLost','requiredJapaneseMissing']}))
