from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
import json, hashlib
root=Path(__file__).resolve().parents[1]
source=root/'assets/fonts/source/MPLUSRounded1c-Medium.ttf'
inputs=list((root/'src').rglob('*.ts'))+list(root.glob('*.html'))+[root/'docs/revisions/TITLE_UI_SPEC.md', root/'docs/ten-game/IMPLEMENTATION_SPEC.md']
text=''.join(p.read_text() for p in inputs)+''.join(chr(i) for i in range(32,127))
font=TTFont(source)
missing=sorted(set(map(ord,text))-set(font.getBestCmap()))
options=subset.Options();options.flavor='woff2';options.layout_features=['*'];options.name_IDs=['*'];options.name_legacy=True
subsetter=subset.Subsetter(options=options);subsetter.populate(text=text);subsetter.subset(font)
for record in font['name'].names:
 if record.nameID in [1,4,6,16]:
  name='ArcadeRounded-Medium' if record.nameID==6 else 'Arcade Rounded'
  record.string=name.encode(record.getEncoding())
font.flavor='woff2';output=root/'public/fonts/arcade-rounded-jp.woff2';font.save(output)
(root/'public/fonts/OFL.txt').write_text((root/'assets/fonts/OFL.txt').read_text())
metadata={'family':'Arcade Rounded','sourceFamily':'M PLUS Rounded 1c','weight':500,'license':'SIL Open Font License 1.1','source':'https://raw.githubusercontent.com/google/fonts/main/ofl/mplusrounded1c/MPLUSRounded1c-Medium.ttf','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'file':'public/fonts/arcade-rounded-jp.woff2','bytes':output.stat().st_size,'codepoints':len(font.getBestCmap()),'missingNonWhitespace':[f'U+{c:04X}' for c in missing if not chr(c).isspace()],'note':'Local UI subset, renamed to avoid reserved original names. UI can fall back for unsupported decorative characters. Refresh after text changes.'}
(root/'assets/fonts/font-index.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'bytes':metadata['bytes'],'codepoints':metadata['codepoints'],'missingNonWhitespace':metadata['missingNonWhitespace']},ensure_ascii=False))
