from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
# Canonical, manually traced data is authored in data/. Do not overwrite it.
pack=json.loads((root/'data/reference-pack.json').read_text())
levels=pack['levels']
sets=[level['boxes'] for level in levels]
# Editable SVG geometry targets, newly drawn rather than screenshots.
def screen(mode):
 s=['<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">','<rect width="1280" height="720" fill="#f7f7f7"/>']
 def text(x,y,t,size=42,anchor='middle',fill='#111',weight=400): s.append(f'<text x="{x}" y="{y}" font-family="Arial, sans-serif" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" fill="{fill}">{t}</text>')
 def proj(x,y,z=0):return (640+54*(x-y),310+31.18*(x+y)-62.35*z)
 def polygon(points,fill,stroke='#222',width=2):s.append('<polygon points="'+' '.join(f'{x:.2f},{y:.2f}' for x,y in points)+f'" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round"/>')
 text(640,95,'Try to count the boxes.' if mode=='watch' else 'How many boxes were there?')
 for i in range(6):
  for pts in [[proj(i,0),proj(i,5)],[proj(0,i),proj(5,i)]]:
   s.append('<path d="M '+' L '.join(f'{x:.2f} {y:.2f}' for x,y in pts)+'" stroke="#797979" fill="none" stroke-width="1" stroke-dasharray="1 3" stroke-linecap="round"/>')
 if mode!='answer':
  for b in sorted(sets[1],key=lambda b:(b['x']+b['y'],b['x'])):
   x,y,z,w,d,h=(b[k] for k in ['x','y','z','w','d','h']);top=z+h
   colors=['#25f34b','#0bcb38','#009a24'] if mode=='reveal' else ['#fff','#d9d9d9','#999']
   polygon([proj(x,y+d,z),proj(x+w,y+d,z),proj(x+w,y+d,top),proj(x,y+d,top)],colors[1])
   polygon([proj(x+w,y,z),proj(x+w,y+d,z),proj(x+w,y+d,top),proj(x+w,y,top)],colors[2])
   polygon([proj(x,y,top),proj(x+w,y,top),proj(x+w,y+d,top),proj(x,y+d,top)],colors[0])
 if mode=='reveal':text(640,200,'6',96,weight=600)
 opacity='0.08' if mode=='watch' else '1'
 s.append(f'<g opacity="{opacity}">')
 for side,accent in [('left','#28cadd'),('right','#f17869')]:
  x=18 if side=='left' else 1210
  s.append(f'<rect x="{x}" y="598" width="52" height="76" rx="10" fill="{accent}" stroke="#333" stroke-width="2"/>')
  text(x+26,645,'P1' if side=='left' else 'P2',24,weight=600)
  if mode=='reveal':
   tx=145 if side=='left' else 1130;text(tx,678,'6' if side=='left' else '7',112,weight=600)
  else:
   start=86 if side=='left' else 1002
   for j,ch in enumerate('05' if mode=='answer' and side=='left' else '00'):
    s.append(f'<rect x="{start+j*99}" y="552" width="94" height="132" fill="#929292"/>')
    text(start+j*99+47,664,ch,114,fill='#fff')
   lx=300 if side=='left' else 844
   text(lx,605,'Z  +1' if side=='left' else 'N  +1',25,'start')
   text(lx,656,'X  Done' if side=='left' else 'M  Done',25,'start')
 s.append('</g>')
 if mode=='reveal':
  s.append('<path d="M 98 642 L 135 679 L 209 601" fill="none" stroke="#65d34d" stroke-width="20"/>')
  s.append('<path d="M 1083 607 L 1168 686 M 1168 607 L 1083 686" fill="none" stroke="#ec5a56" stroke-width="20"/>')
 s.append('</svg>');return ''.join(s)
for mode in ['watch','answer','reveal']:(root/f'assets/visual-targets/{mode}.svg').write_text(screen(mode))
