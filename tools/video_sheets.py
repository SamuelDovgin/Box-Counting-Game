from PIL import Image, ImageDraw
from pathlib import Path
paths=sorted(Path('references/frames/hadski').glob('*.png'))
for start in range(0,len(paths),20):
 out=Image.new('RGB',(1280,10*385),'#eeeeee'); d=ImageDraw.Draw(out)
 for j,p in enumerate(paths[start:start+20]):
  im=Image.open(p); x=(j%2)*640; y=(j//2)*385
  out.paste(im,(x,y+25)); d.text((x+8,y+5),f'{300+(start+j)*0.5:.1f} sec',fill='black')
 out.save(f'references/frames/hadski-sheet-{start//20+1:02d}.jpg')
